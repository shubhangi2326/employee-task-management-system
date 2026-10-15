export const DEPARTMENTS = ['Development', 'Design', 'QA', 'HR', 'Sales'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const EMPLOYEE_STATUSES = ['Active', 'Inactive', 'On Leave'];
export const TASK_STATUSES = ['Todo', 'In Progress', 'Completed', 'Cancelled'];

export const ALLOWED_NEXT_STATUSES = {
  'Todo': ['In Progress', 'Cancelled'],
  'In Progress': ['Completed', 'Cancelled'],
  'Completed': [],
  'Cancelled': []
};

export const formatDate = (d, includeTime = false) => {
  if (!d) return 'N/A';
  const date = new Date(d);
  if (isNaN(date.getTime())) return 'N/A';

  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  if (includeTime) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  }

  return `${day} ${month}`;
};

export const formatDateFull = (d) => {
  if (!d) return 'N/A';
  const date = new Date(d);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toISOString().split('T')[0];
};
