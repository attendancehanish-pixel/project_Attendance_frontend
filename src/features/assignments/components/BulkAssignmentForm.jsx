import { useState, useEffect } from 'react';
import { assignmentApi } from '../api/assignment.api';

export default function BulkAssignmentForm({ 
  academicYears, 
  standards, 
  subjects, 
  onSubmit, 
  onCancel 
}) {
  const [assignments, setAssignments] = useState([]);
  const [currentAssignment, setCurrentAssignment] = useState({
    academicYearId: '',
    standardId: '',
    subjectId: '',
    staffId: ''
  });
  const [availableStaff, setAvailableStaff] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentAssignment.academicYearId) {
      loadAvailableStaff(currentAssignment.academicYearId);
    }
  }, [currentAssignment.academicYearId]);

  const loadAvailableStaff = async (academicYearId) => {
    try {
      const res = await assignmentApi.getAvailableStaff(academicYearId);
      setAvailableStaff(res.data || []);
    } catch (err) {
      console.error('Error loading staff:', err);
    }
  };

  const handleAddAssignment = () => {
    const { academicYearId, standardId, subjectId, staffId } = currentAssignment;
    
    if (!academicYearId || !standardId || !subjectId || !staffId) {
      setError('Please fill all fields before adding');
      return;
    }

    // Check for duplicates
    const exists = assignments.some(a => 
      a.academicYearId === academicYearId &&
      a.standardId === standardId &&
      a.subjectId === subjectId &&
      a.staffId === staffId
    );

    if (exists) {
      setError('This assignment already exists in the list');
      return;
    }

    // Get names for display
    const academicYear = academicYears.find(y => y.id === academicYearId);
    const standard = standards.find(s => s.id === standardId);
    const subject = subjects.find(s => s.id === subjectId);
    const staff = availableStaff.find(s => s.id === staffId);

    setAssignments([
      ...assignments,
      {
        ...currentAssignment,
        _display: {
          academicYearName: academicYear?.name || '',
          standardName: standard?.name || '',
          subjectName: subject?.name || '',
          staffName: staff?.name || ''
        }
      }
    ]);

    setCurrentAssignment({
      academicYearId: '',
      standardId: '',
      subjectId: '',
      staffId: ''
    });
    setError('');
  };

  const handleRemoveAssignment = (index) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (assignments.length === 0) {
      setError('Please add at least one assignment');
      return;
    }

    try {
      setSubmitting(true);
      const result = await onSubmit(assignments);
      if (result.failed.length > 0) {
        setError(`${result.failed.length} assignments failed. Check console for details.`);
      }
    } catch (err) {
      setError(err.message || 'Failed to create assignments');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setCurrentAssignment(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <div className="form-grid">
        <label>
          Academic Year
          <select
            value={currentAssignment.academicYearId}
            onChange={(e) => handleChange('academicYearId', e.target.value)}
          >
            <option value="">Select Academic Year</option>
            {academicYears.map(year => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Standard
          <select
            value={currentAssignment.standardId}
            onChange={(e) => handleChange('standardId', e.target.value)}
          >
            <option value="">Select Standard</option>
            {standards.map(std => (
              <option key={std.id} value={std.id}>
                {std.name} ({std.code})
              </option>
            ))}
          </select>
        </label>

        <label>
          Subject
          <select
            value={currentAssignment.subjectId}
            onChange={(e) => handleChange('subjectId', e.target.value)}
          >
            <option value="">Select Subject</option>
            {subjects.map(sub => (
              <option key={sub.id} value={sub.id}>
                {sub.name} ({sub.code})
              </option>
            ))}
          </select>
        </label>

        <label>
          Staff Member
          <select
            value={currentAssignment.staffId}
            onChange={(e) => handleChange('staffId', e.target.value)}
            disabled={!currentAssignment.academicYearId}
          >
            <option value="">
              {!currentAssignment.academicYearId ? 'Select Academic Year First' : 'Select Staff'}
            </option>
            {availableStaff.map(staff => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="button" className="button" onClick={handleAddAssignment}>
          + Add to List
        </button>
      </div>

      {/* Assignment List Preview */}
      {assignments.length > 0 && (
        <div className="table-wrap" style={{ marginTop: '10px' }}>
          <table>
            <thead>
              <tr>
                <th>Staff</th>
                <th>Subject</th>
                <th>Standard</th>
                <th>Academic Year</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment, index) => (
                <tr key={index}>
                  <td>{assignment._display.staffName}</td>
                  <td>{assignment._display.subjectName}</td>
                  <td>{assignment._display.standardName}</td>
                  <td>{assignment._display.academicYearName}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="danger-text" 
                      onClick={() => handleRemoveAssignment(index)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
        <span style={{ fontSize: '12px', color: '#667085', marginRight: 'auto' }}>
          {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} in list
        </span>
        <button type="button" className="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button primary" disabled={submitting || assignments.length === 0}>
          {submitting ? 'Creating...' : `Create ${assignments.length} Assignment${assignments.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </form>
  );
}