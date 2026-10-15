import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { ALLOWED_NEXT_STATUSES } from '../../utils/constants';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const TaskStatusDropdown = ({ task, onStatusUpdated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef(null);
  const toast = useToast();

  const currentStatus = task.status;
  const allowedNext = ALLOWED_NEXT_STATUSES[currentStatus] || [];
  const hasNext = allowedNext.length > 0;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = async (nextStatus) => {
    setIsOpen(false);
    setIsUpdating(true);
    try {
      const res = await api.updateTaskStatus(task._id, nextStatus);
      toast.success(res.message || `Status updated to ${nextStatus}`);
      if (onStatusUpdated) {
        onStatusUpdated(res.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Todo': return 'badge-todo';
      case 'In Progress': return 'badge-inprogress';
      case 'Completed': return 'badge-completed';
      case 'Cancelled': return 'badge-cancelled';
      default: return 'badge-todo';
    }
  };

  return (
    <div className="status-dropdown-container" ref={dropdownRef}>
      <button
        type="button"
        className={`badge ${getStatusBadgeClass(currentStatus)} status-dropdown-trigger`}
        onClick={() => hasNext && setIsOpen(!isOpen)}
        disabled={!hasNext || isUpdating}
        style={{ cursor: hasNext ? 'pointer' : 'default' }}
        title={hasNext ? 'Click to change status' : 'Terminal status'}
      >
        <span>{isUpdating ? 'Updating...' : currentStatus}</span>
        {hasNext && <ChevronDown size={14} style={{ marginLeft: 2 }} />}
      </button>

      {isOpen && (
        <div className="status-dropdown-menu">
          {allowedNext.map((status) => (
            <button
              key={status}
              type="button"
              className="status-dropdown-item"
              onClick={() => handleStatusChange(status)}
            >
              {status}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskStatusDropdown;
