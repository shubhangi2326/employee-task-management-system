import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import api from '../services/api';
import { DEPARTMENTS, EMPLOYEE_STATUSES } from '../utils/constants';
import { ActionMenu } from '../components/common/ActionMenu';
import { Pagination } from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';

export const EmployeesListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get('search') || '';
  const department = searchParams.get('department') || '';
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  useEffect(() => {
    setSearchInput(searchParams.get('search') || '');
  }, [searchParams]);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getEmployees(searchParams.toString());
      setEmployees(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  }, [searchParams, toast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const updateFilters = (newFilters) => {
    const current = Object.fromEntries(searchParams.entries());
    const merged = { ...current, ...newFilters };

    if (!newFilters.page) {
      merged.page = '1';
    }

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

  const handleDeleteEmployee = async (employee) => {
    if (employee.activeTasksCount > 0) {
      toast.error(`Cannot delete employee '${employee.fullName}' because they have ${employee.activeTasksCount} active tasks (Todo or In Progress). Please reassign or complete them first.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete employee '${employee.fullName}' (${employee.employeeId})? Historical completed tasks will be preserved.`)) {
      return;
    }

    try {
      const res = await api.deleteEmployee(employee._id);
      toast.success(res.message || 'Employee deleted successfully');
      fetchEmployees();
    } catch (err) {
      toast.error(err.message || 'Failed to delete employee');
    }
  };

  const hasActiveFilters = Boolean(search || department || status || searchParams.get('page'));

  return (
    <div className="main-container">
      {/* Top Controls Row */}
      <div className="controls-bar">
        <form onSubmit={handleSearchSubmit} className="search-box-group">
          <input
            type="text"
            className="search-input"
            placeholder="Search employee name, ID, or role"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>

        <div className="action-buttons-group">
          <Link to="/employees/new" className="btn btn-primary">
            <Plus size={16} />
            <span>+ Add Employee</span>
          </Link>
        </div>
      </div>

      {/* Filter Row */}
      <div className="filter-row">
        <select
          className="filter-select"
          value={department}
          onChange={(e) => updateFilters({ department: e.target.value })}
        >
          <option value="">Department (All)</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={status}
          onChange={(e) => updateFilters({ status: e.target.value })}
        >
          <option value="">Status (All)</option>
          {EMPLOYEE_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

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

      {/* Employees Table */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '100px' }}>ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Role</th>
              <th style={{ width: '120px' }}>Status</th>
              <th style={{ width: '110px' }}>Active Tasks</th>
              <th style={{ width: '70px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  Loading employees...
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  No employees found matching criteria.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp._id}>
                  <td>
                    <strong>{emp.employeeId}</strong>
                  </td>
                  <td>
                    <Link to={`/employees/${emp._id}`} style={{ fontWeight: 600, color: 'inherit' }}>
                      {emp.fullName}
                    </Link>
                  </td>
                  <td>{emp.email}</td>
                  <td>{emp.department}</td>
                  <td>{emp.role}</td>
                  <td>
                    <span className={`badge badge-${emp.status.toLowerCase().replace(' ', '')}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>
                      {emp.activeTasksCount}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '0.2rem' }}>
                      / 3 active
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <ActionMenu
                      viewUrl={`/employees/${emp._id}`}
                      editUrl={`/employees/${emp._id}/edit`}
                      canDelete={emp.activeTasksCount === 0}
                      deleteDisabledReason={`Cannot delete while employee holds ${emp.activeTasksCount} active task(s)`}
                      onDelete={() => handleDeleteEmployee(emp)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <Pagination
          pagination={pagination}
          onPageChange={(p) => updateFilters({ page: String(p) })}
          entityName="employees"
        />
      </div>

      <div style={{ fontStyle: 'italic', color: '#64748b', fontSize: '0.825rem', marginTop: '1rem' }}>
        Employee listing: search, filters, pagination, active capacity tracking, delete safeguards.
      </div>
    </div>
  );
};

export default EmployeesListPage;
