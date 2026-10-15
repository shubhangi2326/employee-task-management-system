import Employee from '../models/Employee.js';
import Task from '../models/Task.js';
import { validateEmployeeDeletion } from '../services/businessRules.js';

// GET /api/employees
export const getEmployees = async (req, res, next) => {
  try {
    const {
      search = '',
      department,
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isDeleted: false };

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex },
        { role: searchRegex }
      ];
    }

    if (department) {
      query.department = department;
    }

    if (status) {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const sortOption = {};
    sortOption[sortBy] = sortOrder.toLowerCase() === 'asc' ? 1 : -1;

    const totalRecords = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Fetch active task counts for returned employees
    const employeeIds = employees.map(e => e._id);
    const activeTasksCounts = await Task.aggregate([
      {
        $match: {
          assignedEmployee: { $in: employeeIds },
          status: { $in: ['Todo', 'In Progress'] }
        }
      },
      {
        $group: {
          _id: '$assignedEmployee',
          count: { $sum: 1 }
        }
      }
    ]);

    const countsMap = {};
    activeTasksCounts.forEach(item => {
      countsMap[item._id.toString()] = item.count;
    });

    const enrichedEmployees = employees.map(emp => ({
      ...emp,
      activeTasksCount: countsMap[emp._id.toString()] || 0
    }));

    res.json({
      success: true,
      data: enrichedEmployees,
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

// GET /api/employees/:id
export const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOne({ _id: id, isDeleted: false }).lean();

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Fetch all assigned tasks
    const tasks = await Task.find({ assignedEmployee: employee._id })
      .sort({ createdAt: -1 })
      .lean();

    const activeTasksCount = tasks.filter(t => ['Todo', 'In Progress'].includes(t.status)).length;

    res.json({
      success: true,
      data: {
        ...employee,
        activeTasksCount,
        tasks
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/employees
export const createEmployee = async (req, res, next) => {
  try {
    const {
      employeeId,
      fullName,
      email,
      phone,
      department,
      role,
      joiningDate,
      status = 'Active',
      skills,
      leaveStart,
      leaveEnd
    } = req.body;

    // Field presence validation
    if (!employeeId || !String(employeeId).trim()) {
      return res.status(400).json({ success: false, message: 'Employee ID is required.' });
    }
    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    if (String(fullName).trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Full name must be at least 2 characters.' });
    }
    if (!email || !String(email).trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }
    if (!department) {
      return res.status(400).json({ success: false, message: 'Department is required.' });
    }
    const validDepts = ['Development', 'Design', 'QA', 'HR', 'Sales'];
    if (!validDepts.includes(department)) {
      return res.status(400).json({ success: false, message: `'${department}' is not a valid department.` });
    }
    if (!role || !String(role).trim()) {
      return res.status(400).json({ success: false, message: 'Role is required.' });
    }
    if (!joiningDate) {
      return res.status(400).json({ success: false, message: 'Joining date is required.' });
    }

    const parsedSkills = Array.isArray(skills)
      ? skills.map(s => String(s).trim()).filter(Boolean)
      : String(skills || '').split(',').map(s => s.trim()).filter(Boolean);

    if (parsedSkills.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one skill is required.' });
    }

    const normalizedEmpId = String(employeeId).trim().toUpperCase();

    // Check duplicate employee ID across all records (including soft-deleted)
    const existingId = await Employee.findOne({ employeeId: normalizedEmpId });
    if (existingId) {
      return res.status(409).json({
        success: false,
        message: `Employee ID '${normalizedEmpId}' is already in use.`
      });
    }

    // Check duplicate email across all records
    const existingEmail = await Employee.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: `Email '${normalizedEmail}' is already registered.`
      });
    }

    // Validate leave dates if On Leave
    if (status === 'On Leave') {
      if (!leaveStart || !leaveEnd) {
        return res.status(400).json({
          success: false,
          message: 'Leave Start and Leave End dates are required when status is On Leave.'
        });
      }
      if (new Date(leaveEnd) < new Date(leaveStart)) {
        return res.status(400).json({
          success: false,
          message: 'Leave End date cannot be earlier than Leave Start date.'
        });
      }
    }

    const employee = new Employee({
      employeeId: normalizedEmpId,
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      phone: String(phone).trim(),
      department,
      role: String(role).trim(),
      joiningDate: new Date(joiningDate),
      status,
      skills: parsedSkills,
      leaveStart: status === 'On Leave' ? new Date(leaveStart) : null,
      leaveEnd: status === 'On Leave' ? new Date(leaveEnd) : null,
      isDeleted: false
    });

    await employee.save();

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    console.error('Error in createEmployee:', error);
    if (error.code === 11000) {
      const keyPattern = error.keyPattern || error.keyValue || error.errorResponse?.keyPattern || {};
      const field = Object.keys(keyPattern)[0] || 'employeeId';
      const label = field === 'employeeId' ? 'Employee ID' : field === 'email' ? 'Email' : field;
      return res.status(409).json({
        success: false,
        message: `Duplicate value for ${label}. It must be unique.`
      });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    next(error);
  }
};

// PUT /api/employees/:id
export const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOne({ _id: id, isDeleted: false });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const {
      employeeId,
      fullName,
      email,
      phone,
      department,
      role,
      joiningDate,
      status,
      skills,
      leaveStart,
      leaveEnd
    } = req.body;

    // Check unique employeeId if modified
    if (employeeId && employeeId.trim().toUpperCase() !== employee.employeeId) {
      const normalizedEmpId = employeeId.trim().toUpperCase();
      const existingId = await Employee.findOne({
        _id: { $ne: employee._id },
        employeeId: normalizedEmpId,
        isDeleted: false
      });
      if (existingId) {
        return res.status(409).json({
          success: false,
          message: `Employee ID '${normalizedEmpId}' is already in use.`
        });
      }
      employee.employeeId = normalizedEmpId;
    }

    // Check unique email if modified
    if (email && email.trim().toLowerCase() !== employee.email) {
      const normalizedEmail = email.trim().toLowerCase();
      const existingEmail = await Employee.findOne({
        _id: { $ne: employee._id },
        email: normalizedEmail,
        isDeleted: false
      });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: `Email '${normalizedEmail}' is already registered.`
        });
      }
      employee.email = normalizedEmail;
    }

    const newStatus = status || employee.status;
    if (newStatus === 'On Leave') {
      const lStart = leaveStart || employee.leaveStart;
      const lEnd = leaveEnd || employee.leaveEnd;
      if (!lStart || !lEnd) {
        return res.status(400).json({
          success: false,
          message: 'Leave Start and Leave End dates are required when status is On Leave.'
        });
      }
      if (new Date(lEnd) < new Date(lStart)) {
        return res.status(400).json({
          success: false,
          message: 'Leave End date cannot be earlier than Leave Start date.'
        });
      }
      employee.leaveStart = lStart;
      employee.leaveEnd = lEnd;
    } else {
      employee.leaveStart = null;
      employee.leaveEnd = null;
    }

    if (fullName) employee.fullName = fullName.trim();
    if (phone) employee.phone = phone.trim();
    if (department) employee.department = department;
    if (role) employee.role = role.trim();
    if (joiningDate) employee.joiningDate = joiningDate;
    if (status) employee.status = status;
    if (skills) {
      employee.skills = Array.isArray(skills)
        ? skills
        : skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    await employee.save();

    // Update snapshots on assigned tasks
    await Task.updateMany(
      { assignedEmployee: employee._id },
      {
        $set: {
          'assignedEmployeeSnapshot.fullName': employee.fullName,
          'assignedEmployeeSnapshot.employeeId': employee.employeeId,
          'assignedEmployeeSnapshot.email': employee.email,
          'assignedEmployeeSnapshot.role': employee.role,
          'assignedEmployeeSnapshot.department': employee.department
        }
      }
    );

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    next(error);
  }
};

// DELETE /api/employees/:id
export const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOne({ _id: id, isDeleted: false });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Business rule: not allowed while employee has Todo / In Progress tasks
    const deletionCheck = await validateEmployeeDeletion(employee._id);
    if (!deletionCheck.valid) {
      return res.status(400).json({
        success: false,
        message: deletionCheck.message
      });
    }

    // Make sure snapshot is fully recorded on all past completed/cancelled tasks
    await Task.updateMany(
      { assignedEmployee: employee._id },
      {
        $set: {
          'assignedEmployeeSnapshot.fullName': employee.fullName,
          'assignedEmployeeSnapshot.employeeId': employee.employeeId,
          'assignedEmployeeSnapshot.email': employee.email,
          'assignedEmployeeSnapshot.role': employee.role,
          'assignedEmployeeSnapshot.department': employee.department
        }
      }
    );

    // Soft delete to maintain DB relational consistency while removing from active queries
    employee.isDeleted = true;
    await employee.save();

    res.json({
      success: true,
      message: `Employee '${employee.fullName}' deleted successfully. Historical task records have been preserved.`
    });
  } catch (error) {
    next(error);
  }
};
