import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2, Mail, Phone, Briefcase, Calendar, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { formatDate } from '../utils/constants';
import { useToast } from '../context/ToastContext';

export const EmployeeDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const res = await api.getEmployeeById(id);
      setEmployee(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load employee details');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const handleDelete = async () => {
    if (employee.activeTasksCount > 0) {
      toast.error(`Cannot delete employee: holds ${employee.activeTasksCount} active task(s).`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete '${employee.fullName}'? Past completed tasks will retain historical records.`)) {
      return;
    }

    try {
      await api.deleteEmployee(employee._id);
      toast.success('Employee deleted successfully');
      navigate('/employees');
    } catch (err) {
      toast.error(err.message || 'Failed to delete employee');
    }
  };

  if (loading || !employee) {
    return (
      <div className="main-container">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading employee profile...
        </div>
      </div>
    );
  }

  const tasks = employee.tasks || [];
  const activeTasks = tasks.filter((t) => ['Todo', 'In Progress'].includes(t.status));
  const pastTasks = tasks.filter((t) => ['Completed', 'Cancelled'].includes(t.status));

  return (
    <div className="main-container details-container">
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/employees" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>
          <ArrowLeft size={14} /> Back to Employees
        </Link>
      </div>

      {/* Main Profile Card */}
      <div className="details-card">
        <div className="details-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-todo">{employee.employeeId}</span>
              <span className={`badge badge-${employee.status.toLowerCase().replace(' ', '')}`}>
                {employee.status}
              </span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
              {employee.fullName}
            </h1>
            <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {employee.role} &bull; {employee.department}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/employees/${employee._id}/edit`} className="btn btn-secondary">
              <Edit3 size={15} /> Edit
            </Link>
            <button
              type="button"
              className="btn btn-danger"
              disabled={employee.activeTasksCount > 0}
              title={employee.activeTasksCount > 0 ? 'Cannot delete while employee has active tasks' : 'Delete'}
              onClick={handleDelete}
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>
        </div>

        {/* Capacity / Workload Indicator */}
        <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
              Active Task Capacity Limit:
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: employee.activeTasksCount >= 3 ? '#dc2626' : '#16a34a' }}>
              {employee.activeTasksCount} / 3 Tasks Active
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, (employee.activeTasksCount / 3) * 100)}%`,
                background: employee.activeTasksCount >= 3 ? '#dc2626' : employee.activeTasksCount === 2 ? '#f59e0b' : '#16a34a',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Info Grid */}
        <div className="details-grid">
          <div>
            <div className="detail-item-label">Email</div>
            <div className="detail-item-value">{employee.email}</div>
          </div>

          <div>
            <div className="detail-item-label">Phone</div>
            <div className="detail-item-value">{employee.phone}</div>
          </div>

          <div>
            <div className="detail-item-label">Joining Date</div>
            <div className="detail-item-value">{formatDate(employee.joiningDate)}</div>
          </div>

          {employee.status === 'On Leave' && (
            <div>
              <div className="detail-item-label">Leave Schedule</div>
              <div className="detail-item-value" style={{ color: '#d97706' }}>
                {formatDate(employee.leaveStart)} - {formatDate(employee.leaveEnd)}
              </div>
            </div>
          )}
        </div>

        {/* Skills */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
          <div className="detail-item-label">Skills & Competencies</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {employee.skills?.map((s, idx) => (
              <span key={idx} className="badge badge-todo" style={{ background: '#f1f5f9', color: '#334155' }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Assigned Tasks Section */}
      <div className="details-card">
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>
          Assigned Tasks ({tasks.length})
        </h2>

        {tasks.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '0.9rem', padding: '1rem 0' }}>
            No tasks currently assigned to this employee.
          </div>
        ) : (
          <div className="table-wrapper" style={{ boxShadow: 'none' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>ID</th>
                  <th>Title</th>
                  <th style={{ width: '100px' }}>Priority</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th style={{ width: '130px' }}>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <strong>{t.taskId}</strong>
                    </td>
                    <td>
                      <Link to={`/tasks/${t._id}`} style={{ fontWeight: 500, color: 'inherit' }}>
                        {t.title}
                      </Link>
                    </td>
                    <td>
                      <span className={`priority-tag priority-${t.priority.toLowerCase()}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${t.status.toLowerCase().replace(' ', '')}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      {formatDate(t.dueDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetailsPage;
