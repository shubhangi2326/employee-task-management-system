import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { DEPARTMENTS, EMPLOYEE_STATUSES, formatDateFull } from '../utils/constants';
import { useToast } from '../context/ToastContext';

export const EmployeeFormPage = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    email: '',
    phone: '',
    department: 'Development',
    role: '',
    joiningDate: '',
    status: 'Active',
    skills: '',
    leaveStart: '',
    leaveEnd: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode) {
      const loadEmployee = async () => {
        try {
          setLoadingInitial(true);
          const res = await api.getEmployeeById(id);
          const emp = res.data;

          setFormData({
            employeeId: emp.employeeId || '',
            fullName: emp.fullName || '',
            email: emp.email || '',
            phone: emp.phone || '',
            department: emp.department || 'Development',
            role: emp.role || '',
            joiningDate: formatDateFull(emp.joiningDate),
            status: emp.status || 'Active',
            skills: Array.isArray(emp.skills) ? emp.skills.join(', ') : (emp.skills || ''),
            leaveStart: formatDateFull(emp.leaveStart),
            leaveEnd: formatDateFull(emp.leaveEnd)
          });
        } catch (err) {
          toast.error(err.message || 'Failed to load employee details');
          navigate('/employees');
        } finally {
          setLoadingInitial(false);
        }
      };
      loadEmployee();
    }
  }, [id, isEditMode, navigate, toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side validations
    if (!formData.employeeId.trim()) {
      setErrorMessage('Employee ID is required.');
      return;
    }
    if (!formData.fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setErrorMessage('Email address is required.');
      return;
    }
    if (!formData.joiningDate) {
      setErrorMessage('Joining date is required.');
      return;
    }
    if (!formData.skills.trim()) {
      setErrorMessage('At least one skill is required.');
      return;
    }

    // Leave date validations if On Leave
    if (formData.status === 'On Leave') {
      if (!formData.leaveStart || !formData.leaveEnd) {
        setErrorMessage('Both Leave Start Date and Leave End Date are required when status is On Leave.');
        return;
      }
      if (new Date(formData.leaveEnd) < new Date(formData.leaveStart)) {
        setErrorMessage('Leave End Date cannot be earlier than Leave Start Date.');
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        employeeId: formData.employeeId.trim().toUpperCase(),
        email: formData.email.trim().toLowerCase(),
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        leaveStart: formData.status === 'On Leave' ? formData.leaveStart : null,
        leaveEnd: formData.status === 'On Leave' ? formData.leaveEnd : null
      };

      if (isEditMode) {
        await api.updateEmployee(id, payload);
        toast.success('Employee updated successfully');
      } else {
        await api.createEmployee(payload);
        toast.success('Employee created successfully');
      }
      navigate('/employees');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save employee');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="main-container">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading employee details...
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <div className="form-card">
        <h1 className="form-title">{isEditMode ? 'Edit Employee' : 'Add Employee'}</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Employee ID */}
            <div className="form-group">
              <label className="form-label" htmlFor="employeeId">Employee ID</label>
              <input
                id="employeeId"
                name="employeeId"
                type="text"
                className="form-input"
                placeholder="e.g. EMP-101"
                value={formData.employeeId}
                onChange={handleChange}
                required
              />
            </div>

            {/* Full Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                className="form-input"
                placeholder="e.g. Rahul Sharma"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="e.g. rahul@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone</label>
              <input
                id="phone"
                name="phone"
                type="text"
                className="form-input"
                placeholder="e.g. +91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            {/* Department */}
            <div className="form-group">
              <label className="form-label" htmlFor="department">Department</label>
              <select
                id="department"
                name="department"
                className="form-select"
                value={formData.department}
                onChange={handleChange}
                required
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Role */}
            <div className="form-group">
              <label className="form-label" htmlFor="role">Role</label>
              <input
                id="role"
                name="role"
                type="text"
                className="form-input"
                placeholder="e.g. Senior Frontend Developer"
                value={formData.role}
                onChange={handleChange}
                required
              />
            </div>

            {/* Joining Date */}
            <div className="form-group">
              <label className="form-label" htmlFor="joiningDate">Joining Date</label>
              <input
                id="joiningDate"
                name="joiningDate"
                type="date"
                className="form-input"
                value={formData.joiningDate}
                onChange={handleChange}
                required
              />
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label" htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
                required
              >
                {EMPLOYEE_STATUSES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Conditional Leave Dates when status is On Leave */}
            {formData.status === 'On Leave' && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="leaveStart">Leave Start Date</label>
                  <input
                    id="leaveStart"
                    name="leaveStart"
                    type="date"
                    className="form-input"
                    value={formData.leaveStart}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="leaveEnd">Leave End Date</label>
                  <input
                    id="leaveEnd"
                    name="leaveEnd"
                    type="date"
                    className="form-input"
                    value={formData.leaveEnd}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

            {/* Skills */}
            <div className="form-group form-group-full">
              <label className="form-label" htmlFor="skills">Skills (comma-separated)</label>
              <input
                id="skills"
                name="skills"
                type="text"
                className="form-input"
                placeholder="e.g. React, Node.js, Express, MongoDB"
                value={formData.skills}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Backend Business-Rule Error Banner */}
          {errorMessage && (
            <div className="business-error-banner" role="alert">
              {errorMessage}
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-submit-full"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <Link
              to="/employees"
              className="btn btn-secondary"
              style={{ textAlign: 'center' }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      <div style={{ fontStyle: 'italic', color: '#64748b', fontSize: '0.825rem', textAlign: 'center', marginTop: '1rem' }}>
        Add / Edit Employee form: validation errors and business rule checks are presented cleanly.
      </div>
    </div>
  );
};

export default EmployeeFormPage;
