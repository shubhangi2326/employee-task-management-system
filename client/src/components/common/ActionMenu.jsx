import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ActionMenu = ({
  viewUrl,
  editUrl,
  onDelete,
  canEdit = true,
  canDelete = true,
  editDisabledReason = '',
  deleteDisabledReason = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="action-menu-container" ref={menuRef}>
      <button
        type="button"
        className="action-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Actions"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="action-dropdown">
          {viewUrl && (
            <Link to={viewUrl} onClick={() => setIsOpen(false)}>
              View
            </Link>
          )}

          {editUrl && canEdit && (
            <Link to={editUrl} onClick={() => setIsOpen(false)}>
              Edit
            </Link>
          )}

          {editUrl && !canEdit && (
            <span
              style={{
                display: 'block',
                padding: '0.5rem 0.85rem',
                fontSize: '0.825rem',
                color: '#94a3b8',
                cursor: 'not-allowed'
              }}
              title={editDisabledReason || 'Cannot be edited'}
            >
              Edit
            </span>
          )}

          {onDelete && (
            <button
              type="button"
              className="text-danger"
              disabled={!canDelete}
              title={!canDelete ? deleteDisabledReason : 'Delete'}
              onClick={() => {
                setIsOpen(false);
                if (canDelete) onDelete();
              }}
              style={{ cursor: canDelete ? 'pointer' : 'not-allowed', opacity: canDelete ? 1 : 0.5 }}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
