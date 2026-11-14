export default function Kamus({ glossary, onClose }) {
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Kamus istilah">
        <div className="row between">
          <h2>Kamus Istilah</h2>
          <button className="btn ghost small" onClick={onClose}>Tutup</button>
        </div>
        {glossary.map((g) => (
          <div className="kamus-item" key={g.istilah}>
            <strong>{g.istilah}</strong>
            <p>{g.arti}</p>
            {g.sinonim.length > 0 && (
              <p className="muted">Bisa juga ditulis: {g.sinonim.join(', ')}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
