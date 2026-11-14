export default function Latihan({ content, progress, go, openKamus }) {
  return (
    <main className="page">
      <header className="row between">
        <button className="btn ghost small" onClick={() => go({ name: 'home' })}>← Beranda</button>
        <button className="btn ghost small" onClick={openKamus}>📚 Kamus</button>
      </header>

      <div className="study-banner">
        Semangat mengerjakan yaaa! 🌷 Jangan terburu-buru, baca soalnya pelan-pelan dan pahami informasi yang diberikan.
        Nggak perlu takut salah, karena setiap jawaban adalah kesempatan untuk belajar. Santai aja, kamu pasti bisa!
      </div>

      <h1>Latihan Soal</h1>
      <p className="muted">
        4 soal literasi matematis. Tiap soal dikerjakan dalam 6 tahap, 1 poin per tahap.
        Skormu: <strong>{progress.total_best} dari {progress.total_max}</strong>.
      </p>

      {content.questions.map((q, idx) => {
        const p = progress.soal.find((x) => x.id === q.id);
        return (
          <button key={q.id} className="card soal-card" onClick={() => go({ name: 'soal', idx })}>
            <div className="row between">
              <strong>Soal {q.no}</strong>
              <span className={`badge ${p.dikuasai ? 'ok' : ''}`}>
                {p.best === null ? 'Belum dikerjakan' : `Skor ${p.best}/${p.max}${p.dikuasai ? ' ✓' : ''}`}
              </span>
            </div>
            <p className="muted">{q.indikator}</p>
          </button>
        );
      })}
    </main>
  );
}
