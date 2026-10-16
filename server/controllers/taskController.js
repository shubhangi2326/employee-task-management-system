import Task from '../models/Task.js';
import Employee from '../models/Employee.js';
import { getNextSequence } from '../models/Counter.js';
import {
  validateEmployeeEligibility,
  validateEmployeeCapacity,
  validateStatusTransition
} from '../services/businessRules.js';

// Helper to format taskId like TSK-001
export const generateTaskId = async () => {
  const seq = await getNextSequence('taskId');
  return `TSK-${String(seq).padStart(3, '0')}`;
};

// Priority weight mapping for sorting
const PRIORITY_WEIGHTS = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1
};

// Build filter query for tasks
export const buildTaskFilterQuery = async (params) => {
  const {
    search = '',
    department,
    priority,
    status,
    dueDateFrom,
    dueDateTo
  } = params;

  const query = {};

  if (department) {
    query.department = department;
  }

  if (priority) {
    query.priority = priority;
  }

  if (status) {
    query.status = status;
  }

  if (dueDateFrom || dueDateTo) {
    query.dueDate = {};
    if (dueDateFrom) {
      const from = new Date(dueDateFrom);
      from.setUTCHours(0, 0, 0, 0);
      query.dueDate.$gte = from;
    }
    if (dueDateTo) {
      const to = new Date(dueDateTo);
      to.setUTCHours(23, 59, 59, 999);
      query.dueDate.$lte = to;
    }
  }

  if (search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');

    // Find employees matching search
    const matchingEmployees = await Employee.find({
      fullName: searchRegex
    }).select('_id');

    const matchingEmpIds = matchingEmployees.map(e => e._id);

    query.$or = [
      { title: searchRegex },
      { taskId: searchRegex },
      { assignedEmployee: { $in: matchingEmpIds } },
      { 'assignedEmployeeSnapshot.fullName': searchRegex }
    ];
  }

  return query;
};

// GET /api/tasks
export const getTasks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 5,
      sortBy = 'dueDate',
      sortOrder = 'asc'
    } = req.query;

    const query = await buildTaskFilterQuery(req.query);

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 5);
    const skip = (pageNum - 1) * limitNum;

    const totalRecords = await Task.countDocuments(query);

    let tasks;

    // Handle priority importance sorting
    if (sortBy === 'priority') {
      const sortDir = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
      tasks = await Task.aggregate([
        { $match: query },
        {
          $addFields: {
            priorityWeight: {
              $switch: {
                branches: [
                  { case: { $eq: ['$priority', 'Critical'] }, then: 4 },
                  { case: { $eq: ['$priority', 'High'] }, then: 3 },
                  { case: { $eq: ['$priority', 'Medium'] }, then: 2 },
                  { case: { $eq: ['$priority', 'Low'] }, then: 1 }
                ],
                default: 0
              }
            }
          }
        },
        { $sort: { priorityWeight: sortDir, _id: 1 } },
        { $skip: skip },
        { $limit: limitNum }
      ]);

      // Populate assigned employee
      await Task.populate(tasks, { path: 'assignedEmployee' });
    } else {
      const sortOption = {};
      const fieldMap = {
        createdDate: 'createdAt',
        dueDate: 'dueDate',
        title: 'title',
        createdAt: 'createdAt'
      };
      const dbField = fieldMap[sortBy] || 'dueDate';
      sortOption[dbField] = sortOrder.toLowerCase() === 'desc' ? -1 : 1;

      tasks = await Task.find(query)
        .populate('assignedEmployee')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean({ virtuals: true });
    }

    // Ensure virtual isOverdue is populated on each task
    const now = new Date();
    const enrichedTasks = tasks.map(task => {
      const isTerminal = task.status === 'Completed' || task.status === 'Cancelled';
      const isOverdue = Boolean(task.dueDate && now > new Date(task.dueDate) && !isTerminal);
      return {
        ...task,
        isOverdue
      };
    });

    res.json({
      success: true,
      data: enrichedTasks,
      pagination: {
        totalRecords,
        currentPage: pageNum,
        totalPages: Math.ceil(totalRecords / limitNum) || 1,
        limit: limitNum,
        hasNextPage: pageNum * limitNum < totalRecords,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/:id
export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id).populate('assignedEmployee').lean({ virtuals: true });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const isTerminal = task.status === 'Completed' || task.status === 'Cancelled';
    const isOverdue = Boolean(task.dueDate && new Date() > new Date(task.dueDate) && !isTerminal);

    res.json({
      success: true,
      data: {
        ...task,
        isOverdue
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/tasks
export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      assignedEmployee,
      department,
      priority = 'Medium',
      startDate,
      dueDate
    } = req.body;

    // Date validation
    if (!startDate || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Start Date and Due Date are required.'
      });
    }

    if (new Date(dueDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'Due Date cannot be earlier than Start Date.'
      });
    }

    // Verify employee
    const employee = await Employee.findById(assignedEmployee);
    if (!employee || employee.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Assigned employee does not exist or has been removed.'
      });
    }

    // Business rule: employee eligibility (Active / Inactive / On Leave)
    const eligibility = validateEmployeeEligibility(employee, startDate);
    if (!eligibility.valid) {
      return res.status(400).json({
        success: false,
        message: eligibility.message
      });
    }

    // Business rule: employee capacity (max 3 active tasks: Todo + In Progress)
    const capacity = await validateEmployeeCapacity(employee._id);
    if (!capacity.valid) {
      return res.status(400).json({
        success: false,
        message: capacity.message
      });
    }

    // Auto-generate sequential taskId
    const taskId = await generateTaskId();

    const task = new Task({
      taskId,
      title: title.trim(),
      description: description.trim(),
      assignedEmployee: employee._id,
      assignedEmployeeSnapshot: {
        fullName: employee.fullName,
        employeeId: employee.employeeId,
        email: employee.email,
        role: employee.role,
        department: employee.department
      },
      department,
      priority,
      status: 'Todo', // New tasks start as Todo
      startDate,
      dueDate,
      completedDate: null
    });

    await task.save();
    await task.populate('assignedEmployee');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    next(error);
  }
};

// PUT /api/tasks/:id
export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Business rule: Completed and Cancelled tasks cannot be edited
    if (['Completed', 'Cancelled'].includes(task.status)) {
      return res.status(400).json({
        success: false,
        message: `Tasks in '${task.status}' status cannot be edited.`
      });
    }

    const {
      title,
      description,
      assignedEmployee,
      department,
      priority,
      startDate,
      dueDate,
      status // attempt to modify status via normal update
    } = req.body;

    // Reject attempt to modify status via general update API
    if (status !== undefined && status !== task.status) {
      return res.status(400).json({
        success: false,
        message: 'Task status cannot be changed through this endpoint. Please use PUT /api/tasks/:id/status.'
      });
    }

    const newStartDate = startDate ? new Date(startDate) : task.startDate;
    const newDueDate = dueDate ? new Date(dueDate) : task.dueDate;

    if (newDueDate < newStartDate) {
      return res.status(400).json({
        success: false,
        message: 'Due Date cannot be earlier than Start Date.'
      });
    }

    const targetEmployeeId = assignedEmployee || task.assignedEmployee;
    const employeeChanged = targetEmployeeId.toString() !== task.assignedEmployee.toString();
    const dateChanged = startDate && new Date(startDate).getTime() !== new Date(task.startDate).getTime();

    if (employeeChanged || dateChanged) {
      const employee = await Employee.findById(targetEmployeeId);
      if (!employee || employee.isDeleted) {
        return res.status(404).json({
          success: false,
          message: 'Target assigned employee not found.'
        });
      }

      // Check eligibility with (possibly updated) start date
      const eligibility = validateEmployeeEligibility(employee, newStartDate);
      if (!eligibility.valid) {
        return res.status(400).json({
          success: false,
          message: eligibility.message
        });
      }

      // If assigning to a different employee, check capacity
      if (employeeChanged) {
        const capacity = await validateEmployeeCapacity(employee._id, task._id);
        if (!capacity.valid) {
          return res.status(400).json({
            success: false,
            message: capacity.message
          });
        }
      }

      task.assignedEmployee = employee._id;
      task.assignedEmployeeSnapshot = {
        fullName: employee.fullName,
        employeeId: employee.employeeId,
        email: employee.email,
        role: employee.role,
        department: employee.department
      };
    }

    if (title) task.title = title.trim();
    if (description) task.description = description.trim();
    if (department) task.department = department;
    if (priority) task.priority = priority;
    if (startDate) task.startDate = newStartDate;
    if (dueDate) task.dueDate = newDueDate;

    await task.save();
    await task.populate('assignedEmployee');

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    next(error);
  }
};

// PUT /api/tasks/:id/status
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: 'New status is required.'
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Business rule: status flow validation
    const transitionCheck = validateStatusTransition(task.status, newStatus);
    if (!transitionCheck.valid) {
      return res.status(400).json({
        success: false,
        message: transitionCheck.message
      });
    }

    // If already the same status, no change
    if (task.status === newStatus) {
      return res.json({
        success: true,
        message: `Task is already in '${newStatus}' status.`,
        data: task
      });
    }

    task.status = newStatus;

    // Business rule: Completed Date is set by backend when task becomes Completed
    if (newStatus === 'Completed') {
      task.completedDate = new Date();
    } else {
      task.completedDate = null;
    }

    await task.save();
    await task.populate('assignedEmployee');

    res.json({
      success: true,
      message: `Task status updated from '${task.status}' to '${newStatus}'.`,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await Task.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `Task '${task.taskId}' deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

// Helper to format date strictly to YYYY-MM-DD
export const formatDateYYYYMMDD = (val) => {
  if (!val) return '';
  const date = new Date(val);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

// Helper to format date for CSV export
// Exports as ="YYYY-MM-DD" so Excel renders YYYY-MM-DD text without overflowing to ########
// Returns empty string '' if missing/null/undefined/invalid so Excel cells remain completely blank
export const formatDateForCSV = (val) => {
  const ymd = formatDateYYYYMMDD(val);
  if (!ymd) return '';
  return `="${ymd}"`;
};

// Helper for CSV escaping per RFC 4180
export const escapeCSV = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const str = String(val);
  if (str.startsWith('="') && str.endsWith('"')) {
    return str;
  }
  return `"${str.replace(/"/g, '""')}"`;
};

// GET /api/tasks/export/csv
export const exportTasksCSV = async (req, res, next) => {
  try {
    const query = await buildTaskFilterQuery(req.query);

    // Retrieve all tasks matching the filter without pagination limit
    const tasks = await Task.find(query)
      .populate('assignedEmployee')
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();

    const headers = [
      'Task ID',
      'Title',
      'Description',
      'Assigned Employee',
      'Employee ID',
      'Department',
      'Priority',
      'Status',
      'Start Date',
      'Due Date',
      'Completed Date',
      'Overdue'
    ];

    const rows = tasks.map(t => {
      const empName = t.assignedEmployee?.fullName || t.assignedEmployeeSnapshot?.fullName || 'N/A';
      const empId = t.assignedEmployee?.employeeId || t.assignedEmployeeSnapshot?.employeeId || 'N/A';
      const startStr = formatDateForCSV(t.startDate);
      const dueStr = formatDateForCSV(t.dueDate);
      const compStr = formatDateForCSV(t.completedDate);
      const isTerminal = t.status === 'Completed' || t.status === 'Cancelled';
      const isOverdue = Boolean(t.dueDate && now > new Date(t.dueDate) && !isTerminal);

      return [
        escapeCSV(t.taskId),
        escapeCSV(t.title),
        escapeCSV(t.description),
        escapeCSV(empName),
        escapeCSV(empId),
        escapeCSV(t.department),
        escapeCSV(t.priority),
        escapeCSV(t.status),
        escapeCSV(startStr),
        escapeCSV(dueStr),
        escapeCSV(compStr),
        escapeCSV(isOverdue ? 'Yes' : 'No')
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    const filename = `tasks_export_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

