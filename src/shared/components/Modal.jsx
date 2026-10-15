export default function Modal({ title, children, onClose, size }) {
  const wide = size === "large" || size === "wide";
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className={`modal${wide ? " wide" : ""}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="icon-button" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
