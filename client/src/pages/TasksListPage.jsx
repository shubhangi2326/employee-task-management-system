import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Plus, Download, X } from 'lucide-react';
import api from '../services/api';
import { DEPARTMENTS, PRIORITIES, TASK_STATUSES, formatDate } from '../utils/constants';
import { TaskStatusDropdown } from '../components/tasks/TaskStatusDropdown';
import { ActionMenu } from '../components/common/ActionMenu';
import { Pagination } from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';

export const TasksListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  // Local state for search input before submission
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Read query params from URL
  const search = searchParams.get('search') || '';
  const department = searchParams.get('department') || '';
  const priority = searchParams.get('priority') || '';
  const status = searchParams.get('status') || '';
  const dueDateFrom = searchParams.get('dueDateFrom') || '';
  const dueDateTo = searchParams.get('dueDateTo') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const sortBy = searchParams.get('sortBy') || 'dueDate';
  const sortOrder = searchParams.get('sortOrder') || 'asc';

  // Synchronize search input when URL changes
  useEffect(() => {
    setSearchInput(searchParams.get('search') || '');
  }, [searchParams]);

  // Fetch tasks based on active URL search params
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const queryString = searchParams.toString();
      const res = await api.getTasks(queryString);
      setTasks(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [searchParams, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Helper to update URL search parameters
  const updateFilters = (newFilters) => {
    const current = Object.fromEntries(searchParams.entries());
    const merged = { ...current, ...newFilters };

    // Reset to page 1 if any filter other than page changes
    if (!newFilters.page) {
      merged.page = '1';
    }

    // Remove empty parameters to keep URL clean
    Object.keys(merged).forEach((key) => {
      if (!merged[key] || merged[key] === '') {
        delete merged[key];
      }
    });

    setSearchParams(merged);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim() });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    updateFilters({ page: String(newPage) });
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      await api.exportTasksCSV(searchParams.toString());
      toast.success('Tasks CSV exported successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteTask = async (task) => {
    if (!window.confirm(`Are you sure you want to delete task '${task.taskId}'?`)) {
      return;
    }
    try {
      await api.deleteTask(task._id);
      toast.success(`Task ${task.taskId} deleted`);
      fetchTasks();
    } catch (err) {
      toast.error(err.message || 'Failed to delete task');
    }
  };

  const hasActiveFilters = Boolean(
    search || department || priority || status || dueDateFrom || dueDateTo || searchParams.get('page')
  );

  return (
    <div className="main-container">
      {/* Top Controls Row */}
      <div className="controls-bar">
        {/* Search Input matching design */}
        <form onSubmit={handleSearchSubmit} className="search-box-group">
          <input
            type="text"
            className="search-input"
            placeholder="Search title or employee"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>

        {/* Action Buttons matching design (Burgundy) */}
        <div className="action-buttons-group">
          <Link to="/tasks/new" className="btn btn-primary">
            <Plus size={16} />
            <span>+ Add Task</span>
          </Link>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExportCSV}
            disabled={isExporting}
          >
            <Download size={16} />
            <span>{isExporting ? 'Exporting...' : 'Export To Csv'}</span>
          </button>
        </div>
      </div>

      {/* Filter Row matching design */}
      <div className="filter-row">
        <select
          className="filter-select"
          value={department}
          onChange={(e) => updateFilters({ department: e.target.value })}
        >
          <option value="">Department (All)</option>
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={priority}
          onChange={(e) => updateFilters({ priority: e.target.value })}
        >
          <option value="">Priority (All)</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={status}
          onChange={(e) => updateFilters({ status: e.target.value })}
        >
          <option value="">Status (All)</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div className="date-range-filter">
          <span style={{ color: '#64748b' }}>Due:</span>
          <input
            type="date"
            className="date-input-compact"
            value={dueDateFrom}
            onChange={(e) => updateFilters({ dueDateFrom: e.target.value })}
            title="Due Date From"
          />
          <span style={{ color: '#64748b' }}>-</span>
          <input
            type="date"
            className="date-input-compact"
            value={dueDateTo}
            onChange={(e) => updateFilters({ dueDateTo: e.target.value })}
            title="Due Date To"
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClearFilters}
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
          >
            <X size={14} /> Clear Filters
          </button>
        )}
      </div>

      {/* Tasks Table */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '90px' }}>ID</th>
              <th>Title</th>
              <th>Employee</th>
              <th style={{ width: '100px' }}>Priority</th>
              <th style={{ width: '140px' }}>Status</th>
              <th style={{ width: '150px' }}>Due Date</th>
              <th style={{ width: '70px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  Loading tasks...
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  No tasks found matching current filters.
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const empName = task.assignedEmployee?.fullName || task.assignedEmployeeSnapshot?.fullName || 'Unassigned';
                const isTerminal = task.status === 'Completed' || task.status === 'Cancelled';

                return (
                  <tr key={task._id}>
                    <td>
                      <strong>{task.taskId}</strong>
                    </td>
                    <td>
                      <Link to={`/tasks/${task._id}`} style={{ fontWeight: 500, color: 'inherit' }}>
                        {task.title}
                      </Link>
                    </td>
                    <td>{empName}</td>
                    <td>
                      <span className={`priority-tag priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      <TaskStatusDropdown
                        task={task}
                        onStatusUpdated={fetchTasks}
                      />
                    </td>
                    <td>
                      <span>{formatDate(task.dueDate)}</span>
                      {task.isOverdue && (
                        <span className="overdue-text">(Overdue)</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <ActionMenu
                        viewUrl={`/tasks/${task._id}`}
                        editUrl={`/tasks/${task._id}/edit`}
                        canEdit={!isTerminal}
                        editDisabledReason={`Cannot edit ${task.status} tasks`}
                        onDelete={() => handleDeleteTask(task)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          entityName="tasks"
        />
      </div>

      <div style={{ fontStyle: 'italic', color: '#64748b', fontSize: '0.825rem', marginTop: '1rem' }}>
        Task listing: search, filters, Export CSV, status dropdown (valid next statuses only), action menu, pagination.
      </div>
    </div>
  );
};

export default TasksListPage;
