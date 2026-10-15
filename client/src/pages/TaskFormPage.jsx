import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { DEPARTMENTS, PRIORITIES, formatDateFull } from '../utils/constants';
import { useToast } from '../context/ToastContext';

export const TaskFormPage = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    assignedEmployee: '',
    priority: 'Medium',
    department: 'Development',
    startDate: '',
    dueDate: '',
    description: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(isEditMode);

  // Fetch eligible employees for dropdown
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await api.getEmployees('limit=100&sortBy=fullName&sortOrder=asc');
        setEmployees(res.data);
      } catch (err) {
        toast.error('Failed to load employee list');
      }
    };
    loadEmployees();
  }, [toast]);

  // Load existing task in edit mode
  useEffect(() => {
    if (isEditMode) {
      const loadTask = async () => {
        try {
          setLoadingInitial(true);
          const res = await api.getTaskById(id);
          const t = res.data;

          if (['Completed', 'Cancelled'].includes(t.status)) {
            toast.error(`Tasks in '${t.status}' status cannot be edited.`);
            navigate('/tasks');
            return;
          }

          setFormData({
            title: t.title || '',
            assignedEmployee: t.assignedEmployee?._id || t.assignedEmployee || '',
            priority: t.priority || 'Medium',
            department: t.department || 'Development',
            startDate: formatDateFull(t.startDate),
            dueDate: formatDateFull(t.dueDate),
            description: t.description || ''
          });
        } catch (err) {
          toast.error(err.message || 'Failed to load task details');
          navigate('/tasks');
        } finally {
          setLoadingInitial(false);
        }
      };
      loadTask();
    }
  }, [id, isEditMode, navigate, toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage(''); // clear error banner when user edits field
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side quick checks
    if (!formData.title.trim()) {
      setErrorMessage('Please enter a task title.');
      return;
    }
    if (!formData.assignedEmployee) {
      setErrorMessage('Please select an assigned employee.');
      return;
    }
    if (!formData.startDate || !formData.dueDate) {
      setErrorMessage('Both Start Date and Due Date are required.');
      return;
    }
    if (new Date(formData.dueDate) < new Date(formData.startDate)) {
      setErrorMessage('Due Date cannot be earlier than Start Date.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditMode) {
        await api.updateTask(id, formData);
        toast.success('Task updated successfully');
      } else {
        await api.createTask(formData);
        toast.success('Task created successfully');
      }
      navigate('/tasks');
    } catch (err) {
      // Show backend business rule error in the alert banner
      setErrorMessage(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="main-container">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading task details...
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <div className="form-card">
        <h1 className="form-title">{isEditMode ? 'Edit Task' : 'Add Task'}</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="title">Title</label>
              <input
                id="title"
                name="title"
                type="text"
                className="form-input"
                placeholder="Enter Title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Assigned Employee */}
            <div className="form-group">
              <label className="form-label" htmlFor="assignedEmployee">Assigned Employee</label>
              <select
                id="assignedEmployee"
                name="assignedEmployee"
                className="form-select"
                value={formData.assignedEmployee}
                onChange={handleChange}
                required
              >
                <option value="">Select...</option>
                {employees.map((emp) => {
                  const statusLabel = emp.status === 'Active' ? '' : ` (${emp.status})`;
                  const countLabel = emp.activeTasksCount !== undefined ? ` [${emp.activeTasksCount}/3 active]` : '';
                  return (
                    <option key={emp._id} value={emp._id}>
                      {emp.fullName}{statusLabel}{countLabel}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Priority */}
            <div className="form-group">
              <label className="form-label" htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                className="form-select"
                value={formData.priority}
                onChange={handleChange}
                required
              >
                <option value="">Select...</option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
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
                <option value="">Select...</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="form-group">
              <label className="form-label" htmlFor="startDate">Start Date</label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                className="form-input"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            {/* Due Date */}
            <div className="form-group">
              <label className="form-label" htmlFor="dueDate">Due Date</label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                className="form-input"
                value={formData.dueDate}
                onChange={handleChange}
                required
              />
            </div>

            {/* Description */}
            <div className="form-group form-group-full">
              <label className="form-label" htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                className="form-textarea"
                placeholder="Enter Description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Backend Business-Rule Error Banner (matches Page 3 reference) */}
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
              to="/tasks"
              className="btn btn-secondary"
              style={{ textAlign: 'center' }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      <div style={{ fontStyle: 'italic', color: '#64748b', fontSize: '0.825rem', textAlign: 'center', marginTop: '1rem' }}>
        Add / Edit Task form: backend business-rule errors are shown to the user.
      </div>
    </div>
  );
};

export default TaskFormPage;
