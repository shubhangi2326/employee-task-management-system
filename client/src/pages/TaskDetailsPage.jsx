import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2, Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { formatDate, formatDateFull, ALLOWED_NEXT_STATUSES } from '../utils/constants';
import { useToast } from '../context/ToastContext';

export const TaskDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const res = await api.getTaskById(id);
      setTask(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load task');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleStatusTransition = async (nextStatus) => {
    try {
      setUpdatingStatus(true);
      const res = await api.updateTaskStatus(task._id, nextStatus);
      toast.success(res.message || `Status updated to ${nextStatus}`);
      fetchTask();
    } catch (err) {
      toast.error(err.message || 'Status transition rejected');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete task ${task.taskId}?`)) return;
    try {
      await api.deleteTask(task._id);
      toast.success(`Task ${task.taskId} deleted`);
      navigate('/tasks');
    } catch (err) {
      toast.error(err.message || 'Failed to delete task');
    }
  };

  if (loading || !task) {
    return (
      <div className="main-container">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading task details...
        </div>
      </div>
    );
  }

  const isTerminal = task.status === 'Completed' || task.status === 'Cancelled';
  const allowedNext = ALLOWED_NEXT_STATUSES[task.status] || [];
  const assignedEmp = task.assignedEmployee;
  const snapshot = task.assignedEmployeeSnapshot || {};
  const empName = assignedEmp?.fullName || snapshot.fullName || 'Unassigned';
  const empRole = assignedEmp?.role || snapshot.role || 'N/A';
  const empDept = assignedEmp?.department || snapshot.department || 'N/A';
  const empEmail = assignedEmp?.email || snapshot.email || 'N/A';
  const empId = assignedEmp?.employeeId || snapshot.employeeId || 'N/A';

  return (
    <div className="main-container details-container">
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/tasks" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>
          <ArrowLeft size={14} /> Back to Tasks
        </Link>
      </div>

      <div className="details-card">
        <div className="details-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-todo" style={{ fontSize: '0.85rem' }}>{task.taskId}</span>
              <span className={`badge badge-${task.status.toLowerCase().replace(' ', '')}`}>
                {task.status}
              </span>
              {task.isOverdue && (
                <span className="badge" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                  <AlertCircle size={12} /> Overdue
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{task.title}</h1>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!isTerminal && (
              <Link to={`/tasks/${task._id}/edit`} className="btn btn-secondary">
                <Edit3 size={15} /> Edit
              </Link>
            )}
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              <Trash2 size={15} /> Delete
            </button>
          </div>
        </div>

        {/* Status Lifecycle Stepper / Actions */}
        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            Status Progression
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
            <div>
              Current Status: <strong>{task.status}</strong>
            </div>

            {allowedNext.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                <span style={{ fontSize: '0.825rem', color: '#64748b' }}>Transition to:</span>
                {allowedNext.map((nextSt) => (
                  <button
                    key={nextSt}
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                    onClick={() => handleStatusTransition(nextSt)}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? 'Updating...' : nextSt}
                  </button>
                ))}
              </div>
            )}

            {isTerminal && (
              <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.85rem' }}>
                This task is in a terminal status ({task.status}). No further transitions allowed.
              </div>
            )}
          </div>
        </div>

        {/* Task Details Grid */}
        <div className="details-grid">
          <div>
            <div className="detail-item-label">Department</div>
            <div className="detail-item-value">{task.department}</div>
          </div>

          <div>
            <div className="detail-item-label">Priority</div>
            <div className={`detail-item-value priority-tag priority-${task.priority.toLowerCase()}`}>
              {task.priority}
            </div>
          </div>

          <div>
            <div className="detail-item-label">Start Date</div>
            <div className="detail-item-value">{formatDate(task.startDate)}</div>
          </div>

          <div>
            <div className="detail-item-label">Due Date</div>
            <div className="detail-item-value">
              {formatDate(task.dueDate)}
              {task.isOverdue && <span className="overdue-text"> (Overdue)</span>}
            </div>
          </div>

          {task.completedDate && (
            <div>
              <div className="detail-item-label">Completed Date</div>
              <div className="detail-item-value" style={{ color: '#16a34a' }}>
                {formatDate(task.completedDate, true)}
              </div>
            </div>
          )}

          <div>
            <div className="detail-item-label">Created Date</div>
            <div className="detail-item-value">{formatDate(task.createdAt)}</div>
          </div>
        </div>

        {/* Task Description */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
          <div className="detail-item-label">Description</div>
          <p style={{ marginTop: '0.4rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {task.description}
          </p>
        </div>
      </div>

      {/* Assigned Employee Card */}
      <div className="details-card">
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>
          Assigned Employee
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{empName}</div>
            <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              {empId} &bull; {empDept} &bull; {empRole}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              {empEmail}
            </div>
          </div>

          {assignedEmp?._id && (
            <Link to={`/employees/${assignedEmp._id}`} className="btn btn-secondary">
              View Profile
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsPage;
