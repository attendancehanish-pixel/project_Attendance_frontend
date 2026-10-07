import { useState, useEffect } from "react";
import { get, post, del, patch, subjectAllocationApi } from "../../../shared/api/client";
import PageHeader from "../../../shared/components/PageHeader";
import DataTable from "../../../shared/components/DataTable";
import Modal from "../../../shared/components/Modal";
import { Loading, ErrorState, Empty } from "../../../shared/components/State";

export default function Standards() {
  const [standards, setStandards] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState(null);
  const [allocatedSubjects, setAllocatedSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  
  // Create/Edit modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingStandard, setEditingStandard] = useState(null);
  const [formData, setFormData] = useState({ code: "", name: "" });
  const [formError, setFormError] = useState(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [standardsRes, subjectsRes, yearsRes] = await Promise.all([
        get("/standards"),
        get("/subjects"),
        get("/academic-years")
      ]);
      
      setStandards(standardsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setAcademicYears(yearsRes.data || []);
      
      // Set default academic year to active or first
      if (yearsRes.data.length > 0) {
        const activeYear = yearsRes.data.find(y => y.status === "ACTIVE");
        setSelectedAcademicYear(activeYear ? activeYear.id : yearsRes.data[0].id);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Load allocated subjects for a standard
  const loadAllocatedSubjects = async (standardId) => {
    try {
      const res = await subjectAllocationApi.getByStandard(standardId, selectedAcademicYear);
      setAllocatedSubjects(res.data || []);
    } catch (err) {
      console.error('Error loading allocated subjects:', err);
      setAllocatedSubjects([]);
    }
  };

  // Load available subjects for a standard
  const loadAvailableSubjects = async (standardId) => {
    try {
      const res = await subjectAllocationApi.getAvailableSubjects(standardId, selectedAcademicYear);
      setAvailableSubjects(res.data || []);
    } catch (err) {
      console.error('Error loading available subjects:', err);
      setAvailableSubjects([]);
    }
  };

  // Open detail modal
  const openDetailModal = async (standard) => {
    setSelectedStandard(standard);
    setShowDetailModal(true);
    setSelectedSubjects([]);
    await Promise.all([
      loadAllocatedSubjects(standard.id),
      loadAvailableSubjects(standard.id)
    ]);
  };

  // Handle subject allocation
  const handleAssignSubject = async (subjectId) => {
    try {
      setSaving(true);
      await subjectAllocationApi.create({
        academicYearId: selectedAcademicYear,
        standardId: selectedStandard.id,
        subjectId: subjectId
      });
      
      // Refresh both lists
      await Promise.all([
        loadAllocatedSubjects(selectedStandard.id),
        loadAvailableSubjects(selectedStandard.id)
      ]);
      
      setSelectedSubjects([]);
    } catch (err) {
      alert(err.message || "Failed to assign subject");
    } finally {
      setSaving(false);
    }
  };

  // Handle subject removal
  const handleRemoveSubject = async (allocationId) => {
    if (!window.confirm("Remove this subject from the class?")) return;
    
    try {
      setSaving(true);
      await subjectAllocationApi.delete(allocationId);
      
      // Refresh both lists
      await Promise.all([
        loadAllocatedSubjects(selectedStandard.id),
        loadAvailableSubjects(selectedStandard.id)
      ]);
    } catch (err) {
      alert(err.message || "Failed to remove subject");
    } finally {
      setSaving(false);
    }
  };

  // Handle bulk assign
  const handleBulkAssign = async () => {
    if (selectedSubjects.length === 0) {
      alert("Please select at least one subject");
      return;
    }

    const allocations = selectedSubjects.map(subjectId => ({
      academicYearId: selectedAcademicYear,
      standardId: selectedStandard.id,
      subjectId
    }));

    try {
      setSaving(true);
      await subjectAllocationApi.bulkCreate(allocations);
      
      // Refresh both lists
      await Promise.all([
        loadAllocatedSubjects(selectedStandard.id),
        loadAvailableSubjects(selectedStandard.id)
      ]);
      
      setSelectedSubjects([]);
    } catch (err) {
      alert(err.message || "Failed to assign subjects");
    } finally {
      setSaving(false);
    }
  };

  // Handle toggle subject selection for bulk
  const toggleSubjectSelection = (subjectId) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  // Create/Update handlers
  const handleCreate = async () => {
    try {
      setSaving(true);
      await post("/standards", formData);
      setShowFormModal(false);
      setFormData({ code: "", name: "" });
      await loadInitialData();
    } catch (err) {
      setFormError(err.message || "Failed to create standard");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      await patch(`/standards/${editingStandard.id}`, formData);
      setShowFormModal(false);
      setEditingStandard(null);
      setFormData({ code: "", name: "" });
      await loadInitialData();
    } catch (err) {
      setFormError(err.message || "Failed to update standard");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this standard?")) return;
    
    try {
      await del(`/standards/${id}`);
      await loadInitialData();
    } catch (err) {
      alert(err.message || "Failed to delete standard");
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingStandard(null);
    setFormData({ code: "", name: "" });
    setFormError(null);
    setShowFormModal(true);
  };

  // Open edit modal
  const openEditModal = (standard) => {
    setEditingStandard(standard);
    setFormData({ code: standard.code, name: standard.name });
    setFormError(null);
    setShowFormModal(true);
  };

  // Loading state
  if (loading && standards === null) {
    return <Loading />;
  }

  // Error state
  if (error && standards === null) {
    return <ErrorState error={error} onRetry={loadInitialData} />;
  }

  const standardsList = standards || [];

  return (
    <>
      <PageHeader
        title="Standards / Classes"
        description="Manage classes/standards that students, subjects and timetables belong to."
        action={
          <button className="button primary" onClick={openCreateModal}>
            + New Standard
          </button>
        }
      />

      {/* Academic Year Filter */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ maxWidth: '400px' }}>
          <label className="inline-label">
            Academic Year
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
            >
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.status === 'ACTIVE' ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Statistics */}
      <div className="stat-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <span>Total Classes</span>
          <strong>{standardsList.length}</strong>
        </div>
        <div className="stat-card">
          <span>Total Subjects</span>
          <strong>{subjects.length}</strong>
        </div>
        <div className="stat-card">
          <span>Academic Year</span>
          <strong>{academicYears.find(y => y.id === selectedAcademicYear)?.name || 'Not selected'}</strong>
        </div>
      </div>

      {/* Standards Table */}
      {standardsList.length === 0 ? (
        <Empty 
          title="No Standards Created"
          description="Create your first standard/class to start assigning subjects."
          action={
            <button className="button primary" onClick={openCreateModal}>
              Create Standard
            </button>
          }
        />
      ) : (
        <DataTable
          columns={[
            { 
              key: "code", 
              label: "Code",
              render: r => <strong>{r.code}</strong>
            },
            { 
              key: "name", 
              label: "Name" 
            },
            { 
              key: "actions", 
              label: "Actions",
              render: r => (
                <div className="row-actions">
                  <button 
                    className="text-button" 
                    onClick={() => openDetailModal(r)}
                  >
                    View Subjects
                  </button>
                  <button 
                    className="text-button" 
                    onClick={() => openEditModal(r)}
                  >
                    Edit
                  </button>
                  <button 
                    className="danger-text" 
                    onClick={() => handleDelete(r.id)}
                  >
                    Delete
                  </button>
                </div>
              )
            }
          ]}
          rows={standardsList}
        />
      )}

      {/* Detail Modal - Grid-based Subject Selector */}
      {showDetailModal && selectedStandard && (
        <Modal 
          title={`${selectedStandard.name}`}
          subtitle={`${selectedStandard.code} • ${academicYears.find(y => y.id === selectedAcademicYear)?.name || ''}`}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedStandard(null);
            setSelectedSubjects([]);
          }}
          size="large"
        >
          <div style={{ padding: '8px 0' }}>
            {/* Currently Assigned - Compact Chips */}
            {allocatedSubjects.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  marginBottom: '12px',
                  color: '#0e7b4c',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px'
                }}>
                  Assigned Subjects
                </h3>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {allocatedSubjects.map(allocation => (
                    <span
                      key={allocation.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        backgroundColor: '#e8f5e9',
                        color: '#0e7b4c',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '500',
                        border: '1px solid #c8e6c9'
                      }}
                    >
                      {allocation.subject.name}
                      <button
                        onClick={() => handleRemoveSubject(allocation.id)}
                        disabled={saving}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0e7b4c',
                          cursor: 'pointer',
                          fontSize: '18px',
                          lineHeight: 1,
                          padding: '0 2px',
                          opacity: saving ? 0.5 : 1
                        }}
                        title="Remove subject"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Select Subjects Grid */}
            <div style={{ marginBottom: '8px' }}>
              <h3 style={{ 
                fontSize: '13px', 
                fontWeight: '600', 
                marginBottom: '16px',
                color: '#1e1e1e',
                textTransform: 'uppercase',
                letterSpacing: '0.6px'
              }}>
                Select Subjects
              </h3>
              
              {availableSubjects.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '48px 24px',
                  color: '#98a2b3',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px dashed #e4e7ec'
                }}>
                  <p style={{ fontSize: '15px', margin: '0 0 4px', fontWeight: 500, color: '#667085' }}>
                    All subjects assigned
                  </p>
                  <p style={{ fontSize: '13px', margin: 0 }}>
                    Every subject is already linked to this class
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '12px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  padding: '4px'
                }}>
                  {availableSubjects.map(subject => {
                    const isSelected = selectedSubjects.includes(subject.id);
                    return (
                      <div
                        key={subject.id}
                        onClick={() => !saving && toggleSubjectSelection(subject.id)}
                        style={{
                          padding: '16px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #0e7b4c' : '1px solid #e4e7ec',
                          backgroundColor: isSelected ? '#e8f5e9' : '#ffffff',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease',
                          position: 'relative',
                          opacity: saving ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected && !saving) {
                            e.currentTarget.style.borderColor = '#0e7b4c';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(14, 123, 76, 0.08)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected && !saving) {
                            e.currentTarget.style.borderColor = '#e4e7ec';
                            e.currentTarget.style.boxShadow = 'none';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '5px',
                            border: isSelected ? '2px solid #0e7b4c' : '2px solid #d0d5dd',
                            backgroundColor: isSelected ? '#0e7b4c' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px',
                            transition: 'all 0.15s ease'
                          }}>
                            {isSelected && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontWeight: '600', 
                              fontSize: '14px',
                              color: '#1e1e1e',
                              marginBottom: '4px',
                              lineHeight: 1.3
                            }}>
                              {subject.name}
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#667085',
                              display: 'flex',
                              gap: '8px',
                              flexWrap: 'wrap',
                              lineHeight: 1.4
                            }}>
                              <span>{subject.code}</span>
                              {subject.credits && <span>• {subject.credits} cr</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            {availableSubjects.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 0 8px',
                borderTop: '1px solid #e4e7ec',
                marginTop: '16px'
              }}>
                <span style={{ fontSize: '14px', color: '#667085' }}>
                  <strong style={{ color: '#1e1e1e' }}>{selectedSubjects.length}</strong> subject{selectedSubjects.length !== 1 ? 's' : ''} selected
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="button"
                    onClick={() => setSelectedSubjects([])}
                    disabled={selectedSubjects.length === 0 || saving}
                  >
                    Clear
                  </button>
                  <button
                    className="button primary"
                    onClick={handleBulkAssign}
                    disabled={saving || selectedSubjects.length === 0}
                    style={{ minWidth: '160px' }}
                  >
                    {saving ? 'Assigning...' : `Assign${selectedSubjects.length > 0 ? ` (${selectedSubjects.length})` : ''}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create/Edit Modal */}
      {showFormModal && (
        <Modal 
          title={editingStandard ? `Edit ${editingStandard.name}` : "Create New Standard"}
          onClose={() => {
            setShowFormModal(false);
            setEditingStandard(null);
            setFormData({ code: "", name: "" });
            setFormError(null);
          }}
        >
          <form onSubmit={editingStandard ? handleUpdate : handleCreate}>
            {formError && (
              <div className="form-error" style={{ marginBottom: '12px' }}>
                {formError}
              </div>
            )}
            
            <div className="form-grid">
              <label>
                Code *
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., BCA-1"
                  required
                />
                <span className="field-help">Unique short code identifier</span>
              </label>
              
              <label>
                Name *
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., BCA First Year"
                  required
                />
                <span className="field-help">Display name for the class</span>
              </label>
            </div>
            
            <div className="modal-actions">
              <button 
                type="button" 
                className="button" 
                onClick={() => {
                  setShowFormModal(false);
                  setEditingStandard(null);
                  setFormData({ code: "", name: "" });
                  setFormError(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="button primary" disabled={saving}>
                {saving 
                  ? (editingStandard ? 'Updating...' : 'Creating...') 
                  : (editingStandard ? 'Update Standard' : 'Create Standard')
                }
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}