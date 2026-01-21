import React, { useState } from 'react';

export interface DirectoryRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  status: 'active' | 'inactive';
}

interface RecordEditorProps {
  record: DirectoryRecord;
  onSave: (record: DirectoryRecord) => void;
  onCancel: () => void;
}

const RecordEditor: React.FC<RecordEditorProps> = ({ record, onSave, onCancel }) => {
  const [formData, setFormData] = useState<DirectoryRecord>(record);

  const handleChange = (field: keyof DirectoryRecord, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{record.id ? 'Edit Record' : 'Add New Record'}</h2>
          <button onClick={onCancel} className="close-btn">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="editor-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="department">Department</label>
            <input
              type="text"
              id="department"
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <input
              type="text"
              id="role"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as 'active' | 'inactive')}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordEditor;