export default function AssignmentTable({ assignments, onEdit, onDelete, loading }) {
  if (loading) {
    return <div className="card">Loading assignments...</div>;
  }

  if (assignments.length === 0) {
    return (
      <div className="card">
        <div className="table-empty">
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>📋 No assignments found</p>
          <p style={{ fontSize: '12px', color: '#98a2b3' }}>
            Click "New Assignment" to assign a staff member to a subject
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Staff</th>
            <th>Subject</th>
            <th>Standard</th>
            <th>Academic Year</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((assignment) => (
            <tr key={assignment.id}>
              <td>
                <strong>{assignment.staff?.name || 'N/A'}</strong>
                <br />
                <span style={{ fontSize: '10px', color: '#98a2b3' }}>
                  {assignment.staff?.email || ''}
                </span>
              </td>
              <td>
                <strong>{assignment.subject?.name || 'N/A'}</strong>
                <br />
                <span style={{ fontSize: '10px', color: '#98a2b3' }}>
                  {assignment.subject?.code || ''}
                </span>
              </td>
              <td>
                <strong>{assignment.standard?.name || 'N/A'}</strong>
                <br />
                <span style={{ fontSize: '10px', color: '#98a2b3' }}>
                  {assignment.standard?.code || ''}
                </span>
              </td>
              <td>
                <span style={{ fontSize: '12px' }}>
                  {assignment.academicYear?.name || 'N/A'}
                </span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                  <button 
                    className="text-button" 
                    onClick={() => onEdit(assignment)}
                  >
                    Edit
                  </button>
                  <button 
                    className="danger-text" 
                    onClick={() => onDelete(assignment.id)}
                  >
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}