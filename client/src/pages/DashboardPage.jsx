import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      setStats(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="main-container">
        <h1 className="page-title">Dashboard</h1>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading dashboard metrics from server...
        </div>
      </div>
    );
  }

  const employees = stats?.employees || { total: 0, active: 0, inactive: 0, onLeave: 0 };
  const tasks = stats?.tasks || { total: 0, todo: 0, inProgress: 0, completed: 0, cancelled: 0, overdue: 0 };
  const workload = stats?.workload || [];

  return (
    <div className="main-container">
      <h1 className="page-title">Dashboard</h1>

      {/* Employee Metrics Row */}
      <div className="stats-section">
        <div className="stats-grid-row">
          <div className="stat-card">
            <div className="stat-label">Total Employees</div>
            <div className="stat-value">{employees.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active</div>
            <div className="stat-value text-green">{employees.active}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Inactive</div>
            <div className="stat-value">{employees.inactive}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">On Leave</div>
            <div className="stat-value text-amber">{employees.onLeave}</div>
          </div>
        </div>
      </div>

      {/* Task Metrics Row */}
      <div className="stats-section">
        <div className="stats-grid-row">
          <div className="stat-card">
            <div className="stat-label">Total Tasks</div>
            <div className="stat-value">{tasks.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Todo</div>
            <div className="stat-value">{tasks.todo}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Progress</div>
            <div className="stat-value text-blue">{tasks.inProgress}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Completed</div>
            <div className="stat-value text-green">{tasks.completed}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Cancelled</div>
            <div className="stat-value">{tasks.cancelled}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Overdue</div>
            <div className="stat-value text-red">{tasks.overdue}</div>
          </div>
        </div>
      </div>

      {/* Employee Workload Table */}
      <div className="card" style={{ padding: '1.25rem', marginTop: '1.5rem' }}>
        <h2 className="workload-title">Employee Workload</h2>
        <div className="table-wrapper" style={{ boxShadow: 'none' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th style={{ width: '180px' }}>Active Tasks</th>
              </tr>
            </thead>
            <tbody>
              {workload.length === 0 ? (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                    No active workload recorded
                  </td>
                </tr>
              ) : (
                workload.map((item, idx) => (
                  <tr key={item.employeeId || idx}>
                    <td>
                      <strong>{item.fullName}</strong>
                      <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                        ({item.department} &bull; {item.role})
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                        {item.activeTasks}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '0.35rem' }}>
                        / 3 active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ fontStyle: 'italic', color: '#64748b', fontSize: '0.825rem', marginTop: '1rem' }}>
        Dashboard: all numbers come from the backend.
      </div>
    </div>
  );
};

export default DashboardPage;
