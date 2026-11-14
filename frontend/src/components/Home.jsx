import KakUci from './KakUci.jsx';

export default function Home({ content, progress, go, openKamus, studentName, onChangeStudent }) {
  const materiDone = progress.materi_done.length;
  const materiTotal = content.materi.length;
  const next =
    materiDone < materiTotal
      ? { text: 'Lanjut belajar materi', to: { name: 'materi' } }
      : { text: 'Lanjut latihan soal', to: { name: 'latihan' } };

  return (
    <main className="page">
      <header className="home-header">
        <div className="home-greeting">
          <KakUci small />
          <div>
            <p className="muted">Halo, {studentName} 👋</p>
            <h1>Mau belajar apa?</h1>
          </div>
        </div>
        <button className="btn ghost small" onClick={onChangeStudent}>Ganti siswa</button>
      </header>

      <div className="home-banner">Kak Uci siap bantu kamu belajar sampai paham, ya! 🌷</div>
      <p className="muted center">Progres tersimpan di browser perangkat ini.</p>

      <button className="btn primary big" onClick={() => go(next.to)}>{next.text}</button>

      <div className="menu">
        <button className="card menu-item" onClick={() => go({ name: 'materi' })}>
          <span className="emoji">📖</span>
          <strong>Materi</strong>
          <span className="muted">{materiDone} dari {materiTotal} kartu</span>
        </button>
        <button className="card menu-item" onClick={() => go({ name: 'latihan' })}>
          <span className="emoji">✏️</span>
          <strong>Latihan Soal</strong>
          <span className="muted">Skor {progress.total_best} dari {progress.total_max}</span>
        </button>
        <button className="card menu-item" onClick={() => go({ name: 'game' })}>
          <span className="emoji">🎮</span>
          <strong>Permainan</strong>
          <span className="muted">
            {progress.game?.best == null ? 'Kantin Sortir' : `Skor terbaik ${progress.game.best}/${progress.game.total}`}
          </span>
        </button>
        <button className="card menu-item" onClick={openKamus}>
          <span className="emoji">📚</span>
          <strong>Kamus Istilah</strong>
          <span className="muted">Modal, harga pokok, ...</span>
        </button>
      </div>
    </main>
  );
}
