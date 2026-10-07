import { useState, useEffect } from 'react';
import { assignmentApi } from '../api/assignment.api';

export default function AssignmentForm({ 
  academicYears, 
  standards, 
  subjects, 
  initialData = null,
  onSubmit, 
  onCancel,
  isEdit = false
}) {
  const [formData, setFormData] = useState({
    academicYearId: '',
    standardId: '',
    subjectId: '',
    staffId: ''
  });
  const [availableStaff, setAvailableStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);

  // Load staff when academic year changes
  useEffect(() => {
    if (formData.academicYearId) {
      loadAvailableStaff(formData.academicYearId);
    } else {
      setAvailableStaff([]);
    }
  }, [formData.academicYearId]);

  // Set initial data for edit
  useEffect(() => {
    if (initialData) {
      setFormData({
        academicYearId: initialData.academicYearId || '',
        standardId: initialData.standardId || '',
        subjectId: initialData.subjectId || '',
        staffId: initialData.staffId || ''
      });
    }
  }, [initialData]);

  const loadAvailableStaff = async (academicYearId) => {
    try {
      setStaffLoading(true);
      const res = await assignmentApi.getAvailableStaff(academicYearId);
      setAvailableStaff(res.data || []);
    } catch (err) {
      console.error('Error loading staff:', err);
      setError('Failed to load available staff');
    } finally {
      setStaffLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!formData.academicYearId) {
      setError('Please select an academic year');
      return;
    }
    if (!formData.standardId) {
      setError('Please select a standard');
      return;
    }
    if (!formData.subjectId) {
      setError('Please select a subject');
      return;
    }
    if (!formData.staffId) {
      setError('Please select a staff member');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (err) {
      setError(err.message || 'Failed to save assignment');
    } finally {
      setLoading(false);
    }
  };

  // Filter subjects by standard and academic year
  const getFilteredSubjects = () => {
    if (!formData.standardId) return subjects;
    // In a real app, you might want to filter subjects by standard
    // based on SubjectAllocation model
    return subjects;
  };

  const filteredSubjects = getFilteredSubjects();

  return (
    <form onSubmit={handleSubmit} className="form">
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <div className="form-grid">
        <label>
          Academic Year *
          <select
            value={formData.academicYearId}
            onChange={(e) => handleChange('academicYearId', e.target.value)}
            required
            disabled={isEdit}
          >
            <option value="">Select Academic Year</option>
            {academicYears.map(year => (
              <option key={year.id} value={year.id}>
                {year.name} ({new Date(year.startDate).getFullYear()})
              </option>
            ))}
          </select>
        </label>

        <label>
          Standard *
          <select
            value={formData.standardId}
            onChange={(e) => handleChange('standardId', e.target.value)}
            required
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
          Subject *
          <select
            value={formData.subjectId}
            onChange={(e) => handleChange('subjectId', e.target.value)}
            required
          >
            <option value="">Select Subject</option>
            {filteredSubjects.map(sub => (
              <option key={sub.id} value={sub.id}>
                {sub.name} ({sub.code})
              </option>
            ))}
          </select>
        </label>

        <label>
          Staff Member *
          <select
            value={formData.staffId}
            onChange={(e) => handleChange('staffId', e.target.value)}
            required
            disabled={!formData.academicYearId || staffLoading}
          >
            <option value="">
              {staffLoading ? 'Loading staff...' : 'Select Staff Member'}
            </option>
            {availableStaff.map(staff => (
              <option key={staff.id} value={staff.id}>
                {staff.name} ({staff.email})
              </option>
            ))}
          </select>
          {availableStaff.length === 0 && formData.academicYearId && !staffLoading && (
            <span className="field-help">No staff available for this academic year</span>
          )}
        </label>
      </div>

      <div className="modal-actions">
        <button type="button" className="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button primary" disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Update Assignment' : 'Create Assignment'}
        </button>
      </div>
    </form>
  );
}