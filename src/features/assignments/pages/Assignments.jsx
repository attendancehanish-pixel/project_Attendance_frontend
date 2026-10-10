import { useState, useEffect } from "react";
import { get, patch, assignmentApi } from "../../../shared/api/client";
import PageHeader from "../../../shared/components/PageHeader";
import DataTable from "../../../shared/components/DataTable";
import Modal from "../../../shared/components/Modal";
import { Loading, ErrorState, Empty } from "../../../shared/components/State";

export default function Assignments() {
  const [matrixData, setMatrixData] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showStaffModal, setShowStaffModal] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load matrix when year changes
  useEffect(() => {
    if (selectedYearId) {
      loadMatrix();
      loadAvailableStaff();
    }
  }, [selectedYearId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const yearsRes = await get("/academic-years");
      const years = yearsRes.data || [];
      setAcademicYears(years);
      
      // Set default to active year or first year
      if (years.length > 0) {
        const activeYear = years.find(y => y.status === "ACTIVE");
        setSelectedYearId(activeYear ? activeYear.id : years[0].id);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMatrix = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await assignmentApi.getMatrix(selectedYearId);
      setMatrixData(res.data || []);
    } catch (err) {
      console.error('Error loading matrix:', err);
      setError(err);
      setMatrixData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableStaff = async () => {
    try {
      const res = await assignmentApi.getAvailableStaff(selectedYearId);
      setAvailableStaff(res.data || []);
    } catch (err) {
      console.error('Error loading staff:', err);
      setAvailableStaff([]);
    }
  };

  // Handle staff assignment
  const handleAssignStaff = async (row, staffId) => {
    try {
      setSaving(true);
      
      if (row.assignmentId) {
        // Update existing assignment
        await assignmentApi.update(row.assignmentId, { staffId });
      } else {
        // Create new assignment
        await assignmentApi.create({
          academicYearId: selectedYearId,
          standardId: row.standardId,
          subjectId: row.subjectId,
          staffId
        });
      }
      
      // Reload the matrix
      await loadMatrix();
    } catch (err) {
      alert(err.message || "Failed to assign staff");
    } finally {
      setSaving(false);
    }
  };

  // Handle removing staff from assignment
  const handleRemoveStaff = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to remove this staff assignment?")) return;
    
    try {
      await assignmentApi.delete(assignmentId);
      await loadMatrix();
    } catch (err) {
      alert(err.message || "Failed to remove assignment");
    }
  };

  // Open staff selection modal
  const openStaffModal = (row) => {
    setSelectedAssignment(row);
    setShowStaffModal(true);
  };

  // Get staff name by ID
  const getStaffName = (staffId) => {
    const staff = availableStaff.find(s => s.id === staffId);
    return staff ? staff.name : 'Unassigned';
  };

  // Loading state
  if (loading && matrixData === null) {
    return <Loading />;
  }

  // Error state
  if (error && matrixData === null) {
    return <ErrorState error={error} onRetry={loadMatrix} />;
  }

  const data = matrixData || [];

  return (
    <>
      <PageHeader
        title="Staff Subject Assignments"
        description="Assign staff members to subjects for each class"
        action={
          <button 
            className="button primary" 
            onClick={loadMatrix}
            disabled={saving}
          >
            Refresh
          </button>
        }
      />

      {/* Academic Year Filter */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ maxWidth: '400px' }}>
          <label className="inline-label">
            Academic Year
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
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

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <span>Total Subjects</span>
          <strong>{data.length}</strong>
          <small>Subject allocations</small>
        </div>
        <div className="stat-card">
          <span>Assigned</span>
          <strong>{data.filter(r => r.isAssigned).length}</strong>
          <small>Staff assigned</small>
        </div>
        <div className="stat-card">
          <span>Unassigned</span>
          <strong>{data.filter(r => !r.isAssigned).length}</strong>
          <small>Needs assignment</small>
        </div>
        <div className="stat-card">
          <span>Staff Members</span>
          <strong>{availableStaff.length}</strong>
          <small>Available staff</small>
        </div>
      </div>

      {/* Table with 3 columns: Class | Subject | Select Staff */}
      {data.length === 0 ? (
        <Empty 
          title="No Subjects Found"
          description="No subject allocations found for this academic year. Please add subject allocations first."
        />
      ) : (
        <DataTable
          columns={[
            { 
              key: "class", 
              label: "Class", 
              render: r => (
                <div>
                  <strong>{r.standardName}</strong>
                  <br />
                  <span style={{ fontSize: '10px', color: 'var(--ui-faint)' }}>
                    {r.standardCode}
                  </span>
                </div>
              )
            },
            { 
              key: "subject", 
              label: "Subject", 
              render: r => (
                <div>
                  <strong>{r.subjectName}</strong>
                  <br />
                  <span style={{ fontSize: '10px', color: 'var(--ui-faint)' }}>
                    {r.subjectCode}
                  </span>
                </div>
              )
            },
            { 
              key: "staff", 
              label: "Assign Teacher", 
              render: r => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {r.isAssigned ? (
                    <>
                      <span style={{ fontWeight: '500', color: 'var(--ui-ok-text)' }}>
                        {r.staffName}
                      </span>
                      <button
                        className="danger-text"
                        onClick={() => handleRemoveStaff(r.assignmentId)}
                        disabled={saving}
                        style={{ fontSize: '12px' }}
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <span style={{ color: 'var(--ui-faint)' }}>Not assigned</span>
                  )}
                  <button
                    className="button"
                    onClick={() => openStaffModal(r)}
                    disabled={saving}
                    style={{ 
                      padding: '4px 12px', 
                      fontSize: '12px',
                      marginLeft: 'auto'
                    }}
                  >
                    {r.isAssigned ? 'Change' : 'Assign'}
                  </button>
                </div>
              )
            }
          ]}
          rows={data}
          keyExtractor={(row, index) => `${row.standardId}_${row.subjectId}_${index}`}
        />
      )}

      {/* Staff Selection Modal */}
      {showStaffModal && selectedAssignment && (
        <Modal 
          title={`Assign Teacher - ${selectedAssignment.standardName} / ${selectedAssignment.subjectName}`}
          onClose={() => {
            setShowStaffModal(false);
            setSelectedAssignment(null);
          }}
        >
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            {availableStaff.length === 0 ? (
              <p style={{ color: 'var(--ui-faint)' }}>No staff members available</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {availableStaff.map(staff => (
                  <div
                    key={staff.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      border: '1px solid var(--ui-line-2)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: selectedAssignment.staffId === staff.id ? 'var(--ui-ok-bg)' : 'transparent'
                    }}
                    onClick={() => {
                      handleAssignStaff(selectedAssignment, staff.id);
                      setShowStaffModal(false);
                      setSelectedAssignment(null);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--ui-surface-2)';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedAssignment.staffId !== staff.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div>
                      <strong>{staff.name}</strong>
                      <br />
                      <span style={{ fontSize: '12px', color: 'var(--ui-muted)' }}>
                        {staff.email} {staff.designation ? `• ${staff.designation}` : ''}
                      </span>
                    </div>
                    <span style={{ 
                      fontSize: '12px', 
                      color: 'var(--ui-muted)',
                      background: 'var(--ui-surface-2)',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {staff.assignmentCount || 0} assignments
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button 
              className="button" 
              onClick={() => {
                setShowStaffModal(false);
                setSelectedAssignment(null);
              }}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}