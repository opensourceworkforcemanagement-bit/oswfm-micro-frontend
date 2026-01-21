import React, { useState, useCallback } from 'react';
import DataEditor, {
  GridCellKind,
  GridColumn,
  Item,
  EditableGridCell,
  GridCell,
  GridSelection,
} from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';
import './DirectoryPage.css';
import RecordEditor, { DirectoryRecord } from './RecordEditor';


const DirectoryPage: React.FC = () => {
  const [records, setRecords] = useState<DirectoryRecord[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@company.com',
      phone: '555-0101',
      department: 'Engineering',
      role: 'Senior Developer',
      status: 'active',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      phone: '555-0102',
      department: 'Marketing',
      role: 'Marketing Manager',
      status: 'active',
    },
    // Add more sample data as needed
  ]);

  const [editingRecord, setEditingRecord] = useState<DirectoryRecord | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selection, setSelection] = useState<GridSelection>({
    columns: [],
    rows: [],
  });

  const columns: GridColumn[] = [
    { title: 'Name', width: 200, id: 'name' },
    { title: 'Email', width: 250, id: 'email' },
    { title: 'Phone', width: 150, id: 'phone' },
    { title: 'Department', width: 150, id: 'department' },
    { title: 'Role', width: 180, id: 'role' },
    { title: 'Status', width: 100, id: 'status' },
  ];

  const getCellContent = useCallback(
    (cell: Item): GridCell => {
      const [col, row] = cell;
      const record = records[row];
      const columnId = columns[col].id as keyof DirectoryRecord;

      return {
        kind: GridCellKind.Text,
        data: String(record[columnId]),
        displayData: String(record[columnId]),
        allowOverlay: false,
        readonly: true,
      };
    },
    [records]
  );

  // Handle double-click to edit
  const onCellActivated = useCallback(
    (cell: Item) => {
      const [, row] = cell;
      setEditingRecord(records[row]);
      setIsEditorOpen(true);
    },
    [records]
  );

  // Handle "Add" button
  const handleAdd = () => {
    const newRecord: DirectoryRecord = {
      id: Date.now().toString(),
      name: '',
      email: '',
      phone: '',
      department: '',
      role: '',
      status: 'active',
    };
    setEditingRecord(newRecord);
    setIsEditorOpen(true);
  };

  // Handle "Edit" button for selected row
  const handleEdit = () => {
    if (selection.rows.length > 0) {
      const rowIndex = selection.rows[0];
      setEditingRecord(records[rowIndex]);
      setIsEditorOpen(true);
    }
  };

  // Save edited/new record
  const handleSave = (updatedRecord: DirectoryRecord) => {
    setRecords((prev) => {
      const existingIndex = prev.findIndex((r) => r.id === updatedRecord.id);
      if (existingIndex >= 0) {
        // Update existing
        const newRecords = [...prev];
        newRecords[existingIndex] = updatedRecord;
        return newRecords;
      } else {
        // Add new
        return [...prev, updatedRecord];
      }
    });
    setIsEditorOpen(false);
    setEditingRecord(null);
  };

  // Cancel editing
  const handleCancel = () => {
    setIsEditorOpen(false);
    setEditingRecord(null);
  };

  // Delete record
  const handleDelete = () => {
    if (selection.rows.length > 0 && window.confirm('Delete selected record?')) {
      const rowIndex = selection.rows[0];
      setRecords((prev) => prev.filter((_, idx) => idx !== rowIndex));
      setSelection({ columns: [], rows: [] });
    }
  };

  return (
    <div className="directory-page">
      <div className="directory-header">
        <h1>Employee Directory</h1>
        <div className="directory-actions">
          <button onClick={handleAdd} className="btn-primary">
            Add New
          </button>
          <button
            onClick={handleEdit}
            disabled={selection.rows.length === 0}
            className="btn-secondary"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={selection.rows.length === 0}
            className="btn-danger"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="directory-grid">
        <DataEditor
          getCellContent={getCellContent}
          columns={columns}
          rows={records.length}
          width="100%"
          height="calc(100vh - 200px)"
          onCellActivated={onCellActivated}
          gridSelection={selection}
          onGridSelectionChange={setSelection}
          rowMarkers="number"
          smoothScrollX={true}
          smoothScrollY={true}
        />
      </div>

      {isEditorOpen && editingRecord && (
        <RecordEditor
          record={editingRecord}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default DirectoryPage;