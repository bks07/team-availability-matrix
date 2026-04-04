import { useEffect } from 'react';

interface LegendModalProps {
  onClose: () => void;
}

export default function LegendModal({ onClose }: LegendModalProps): JSX.Element {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content legend-modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Legend</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="legend-items">
            <div className="legend-item"><span className="legend-dot legend-dot-w"></span> Working (W)</div>
            <div className="legend-item"><span className="legend-dot legend-dot-v"></span> Vacation (V)</div>
            <div className="legend-item"><span className="legend-dot legend-dot-a"></span> Absence (A)</div>
          </div>
          <div className="legend-section-virtual">
            <p className="legend-section-title">Virtual values</p>
            <div className="legend-items">
              <div className="legend-item"><span className="legend-dot legend-dot-virtual legend-dot-w"></span> Working (W) — assumed</div>
              <div className="legend-item"><span className="legend-dot legend-dot-virtual legend-dot-a"></span> Absence (A) — assumed</div>
            </div>
            <p className="legend-hint">Values with a dashed border are not explicitly set. They are derived from the employee's work schedule and public holidays.</p>
          </div>
          <p className="legend-hint">You can only edit your own column</p>
        </div>
      </div>
    </div>
  );
}