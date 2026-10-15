import Task from '../models/Task.js';
import Employee from '../models/Employee.js';

// Status transition matrix
export const ALLOWED_STATUS_TRANSITIONS = {
  'Todo': ['In Progress', 'Cancelled'],
  'In Progress': ['Completed', 'Cancelled'],
  'Completed': [],
  'Cancelled': []
};

/**
 * Validates if a status transition is permissible
 */
export const validateStatusTransition = (currentStatus, newStatus) => {
  if (currentStatus === newStatus) {
    return { valid: true };
  }
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    return {
      valid: false,
      message: `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed next statuses: ${allowed.length ? allowed.join(', ') : 'None (Terminal state)'}.`
    };
  }
  return { valid: true };
};

/**
 * Normalize date to UTC day start for comparison
 */
export const toDayStart = (d) => {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
};

export const toDayEnd = (d) => {
  const date = new Date(d);
  date.setUTCHours(23, 59, 59, 999);
  return date.getTime();
};

/**
 * Validates employee eligibility for task assignment:
 * - Active employee: permitted
 * - Inactive employee: always rejected
 * - On Leave employee: rejected ONLY if task's startDate falls inside [leaveStart, leaveEnd] (inclusive)
 */
export const validateEmployeeEligibility = (employee, startDate) => {
  if (!employee || employee.isDeleted) {
    return { valid: false, message: 'Assigned employee not found or is deleted.' };
  }

  if (employee.status === 'Inactive') {
    return {
      valid: false,
      message: `Cannot assign task to '${employee.fullName}' because the employee is Inactive.`
    };
  }

  if (employee.status === 'On Leave') {
    if (employee.leaveStart && employee.leaveEnd && startDate) {
      const taskStart = toDayStart(startDate);
      const leaveStart = toDayStart(employee.leaveStart);
      const leaveEnd = toDayEnd(employee.leaveEnd);

      if (taskStart >= leaveStart && taskStart <= leaveEnd) {
        const startStr = new Date(employee.leaveStart).toLocaleDateString('en-GB');
        const endStr = new Date(employee.leaveEnd).toLocaleDateString('en-GB');
        return {
          valid: false,
          message: `Cannot assign task to '${employee.fullName}': employee is On Leave from ${startStr} to ${endStr} (inclusive).`
        };
      }
    }
  }

  return { valid: true };
};

/**
 * Validates employee active task capacity (max 3 active tasks: Todo + In Progress)
 * @param {string|ObjectId} employeeId 
 * @param {string|ObjectId} excludeTaskId (optional, when updating an existing task)
 */
export const validateEmployeeCapacity = async (employeeId, excludeTaskId = null) => {
  const query = {
    assignedEmployee: employeeId,
    status: { $in: ['Todo', 'In Progress'] }
  };

  if (excludeTaskId) {
    query._id = { $ne: excludeTaskId };
  }

  const activeTaskCount = await Task.countDocuments(query);

  if (activeTaskCount >= 3) {
    return {
      valid: false,
      activeCount: activeTaskCount,
      message: 'Employee already has 3 active tasks. Please choose another employee.'
    };
  }

  return { valid: true, activeCount: activeTaskCount };
};

/**
 * Validates if employee can be safely deleted (no Todo or In Progress tasks)
 */
export const validateEmployeeDeletion = async (employeeId) => {
  const activeCount = await Task.countDocuments({
    assignedEmployee: employeeId,
    status: { $in: ['Todo', 'In Progress'] }
  });

  if (activeCount > 0) {
    return {
      valid: false,
      activeCount,
      message: `Cannot delete employee: employee currently has ${activeCount} active task(s) (Todo or In Progress). Please reassign or complete them first.`
    };
  }

  return { valid: true };
};
