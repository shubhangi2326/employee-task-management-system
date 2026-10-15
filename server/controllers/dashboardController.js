import Employee from '../models/Employee.js';
import Task from '../models/Task.js';

// GET /api/dashboard/stats
export const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();

    // 1. Employee Statistics
    const [employeeStats] = await Employee.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
          },
          inactive: {
            $sum: { $cond: [{ $eq: ['$status', 'Inactive'] }, 1, 0] }
          },
          onLeave: {
            $sum: { $cond: [{ $eq: ['$status', 'On Leave'] }, 1, 0] }
          }
        }
      }
    ]) || [{ total: 0, active: 0, inactive: 0, onLeave: 0 }];

    // 2. Task Statistics
    const [taskStats] = await Task.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          todo: {
            $sum: { $cond: [{ $eq: ['$status', 'Todo'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', now] },
                    { $in: ['$status', ['Todo', 'In Progress']] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]) || [{ total: 0, todo: 0, inProgress: 0, completed: 0, cancelled: 0, overdue: 0 }];

    // 3. Employee Workload (Active tasks: Todo + In Progress per employee)
    const workloadAggregation = await Task.aggregate([
      {
        $match: {
          status: { $in: ['Todo', 'In Progress'] }
        }
      },
      {
        $group: {
          _id: '$assignedEmployee',
          activeTasks: { $sum: 1 }
        }
      },
      {
        $sort: { activeTasks: -1 }
      }
    ]);

    // Populate employee details for workload
    const employeeIds = workloadAggregation.map(w => w._id);
    const employees = await Employee.find({ _id: { $in: employeeIds } })
      .select('fullName employeeId role department status')
      .lean();

    const empMap = {};
    employees.forEach(e => {
      empMap[e._id.toString()] = e;
    });

    const workload = workloadAggregation.map(item => {
      const emp = empMap[item._id?.toString()];
      return {
        employeeId: emp?.employeeId || 'N/A',
        fullName: emp?.fullName || 'Unknown / Deleted',
        department: emp?.department || 'N/A',
        role: emp?.role || '',
        status: emp?.status || '',
        activeTasks: item.activeTasks
      };
    });

    res.json({
      success: true,
      data: {
        employees: employeeStats || { total: 0, active: 0, inactive: 0, onLeave: 0 },
        tasks: taskStats || { total: 0, todo: 0, inProgress: 0, completed: 0, cancelled: 0, overdue: 0 },
        workload
      }
    });
  } catch (error) {
    next(error);
  }
};
