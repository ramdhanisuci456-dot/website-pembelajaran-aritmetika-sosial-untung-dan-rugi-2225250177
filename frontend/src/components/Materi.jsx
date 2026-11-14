import { lazy, Suspense, useEffect, useState } from 'react';
import Rich from './Rich.jsx';

const Scene3D = lazy(() => import('./Scene3D.jsx')); // three.js dimuat hanya saat dibutuhkan

function Cek({ cek }) {
  const [pick, setPick] = useState(null);
  return (
    <div className="card cek">
      <strong>Cek cepat</strong>
      <p>{cek.tanya}</p>
      <div className="options">
        {cek.opsi.map((o, i) => (
          <button
            key={i}
            className={`opt ${pick === i ? (i === cek.jawab ? 'benar' : 'salah') : ''}`}
            onClick={() => setPick(i)}
          >
            {o}
          </button>
        ))}
      </div>
      {pick !== null && (
        <p className={pick === cek.jawab ? 'ok-text' : 'error'}>{pick === cek.jawab ? cek.benar : cek.salah}</p>
      )}
    </div>
  );
}

export default function Materi({ materi, done, onProgress, go, openKamus }) {
  const firstUndone = materi.findIndex((m) => !done.includes(m.id));
  const [i, setI] = useState(firstUndone === -1 ? 0 : firstUndone);
  const [show3d, setShow3d] = useState(true);
  const m = materi[i];
  const last = i === materi.length - 1;

  useEffect(() => {
    setShow3d(true);
  }, [i]);

  async function next() {
    try {
      await onProgress(m.id);
    } catch {
      return;
    }
    if (last) return go({ name: 'latihan' });
    setI(i + 1);
    window.scrollTo(0, 0);
  }

  return (
    <main className="page">
      <header className="row between">
        <button className="btn ghost small" onClick={() => go({ name: 'home' })}>← Beranda</button>
        <button className="btn ghost small" onClick={openKamus}>📚 Kamus</button>
      </header>

      <div className="dots" aria-label={`Kartu ${i + 1} dari ${materi.length}`}>
        {materi.map((x, k) => (
          <span key={x.id} className={`dot ${k === i ? 'on' : k < i || done.includes(x.id) ? 'done' : ''}`} />
        ))}
      </div>

      <h1>{m.judul}</h1>
      {m.body.map((t, k) => <p key={k} className="body"><Rich text={t} /></p>)}

      {m.dua_kolom && (
        <div className="two-col">
          <div className="col beli">
            <strong>{m.dua_kolom.kiri_judul}</strong>
            <ul>{m.dua_kolom.kiri.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className="col jual">
            <strong>{m.dua_kolom.kanan_judul}</strong>
            <ul>{m.dua_kolom.kanan.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        </div>
      )}

      {m.contoh && <div className="contoh"><strong>Contoh:</strong> {m.contoh}</div>}

      {m.scene && (
        show3d ? (
          <Suspense fallback={<p className="muted center">Memuat ilustrasi...</p>}>
            <Scene3D {...m.scene} />
          </Suspense>
        ) : (
          <button className="btn ghost" onClick={() => setShow3d(true)}>🧊 Lihat ilustrasi 3D</button>
        )
      )}

      {m.cek && <Cek key={m.id} cek={m.cek} />}

      <div className="row gap sticky-bottom">
        <button className="btn ghost" disabled={i === 0} onClick={() => { setI(i - 1); }}>Kembali</button>
        <button className="btn primary grow" onClick={next}>{last ? 'Mulai Latihan' : 'Lanjut'}</button>
      </div>
    </main>
  );
}
