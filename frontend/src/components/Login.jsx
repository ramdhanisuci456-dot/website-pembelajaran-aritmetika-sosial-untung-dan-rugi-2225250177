import { useState } from 'react';
import KakUci from './KakUci.jsx';

const STUDENT_IDS_KEY = 'untung-rugi-student-ids';

function getStudentId(name) {
  const normalizedName = name.trim().toLowerCase();
  const storedIds = localStorage.getItem(STUDENT_IDS_KEY);
  const ids = storedIds ? JSON.parse(storedIds) : {};
  if (!ids || typeof ids !== 'object' || Array.isArray(ids)) {
    throw new Error('Data nama siswa di perangkat ini tidak valid. Coba bersihkan data situs lalu ulangi.');
  }

  if (Number.isSafeInteger(ids[normalizedName]) && ids[normalizedName] >= 0) {
    return ids[normalizedName];
  }

  let studentId = Date.now();
  if (globalThis.crypto?.getRandomValues) {
    const random = new Uint32Array(2);
    globalThis.crypto.getRandomValues(random);
    studentId = random[0] * 0x200000 + (random[1] & 0x1fffff);
  }
  ids[normalizedName] = studentId;
  localStorage.setItem(STUDENT_IDS_KEY, JSON.stringify(ids));
  return studentId;
}

export default function Login({ onLogin }) {
  const [nama, setNama] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const name = nama.trim();
      const studentId = getStudentId(name);
      onLogin({ studentId, name });
    } catch (error) {
      setErr(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page center-page welcome-page">
      <div className="welcome-topbar">
        <div className="mascot-badge">Kak Uci</div>
      </div>

      <div className="welcome-card">
        <KakUci />
        <p className="eyebrow">Selamat datang, teman-teman!</p>
        <h1>Kenalan dengan Kak Uci! 👋🌷</h1>
        <p className="welcome-text">
          Hai, aku Kak Uci! Yuk, kita belajar tentang Untung dan Rugi dengan cara yang seru dan menyenangkan.
          Isi nama dulu sebelum mulai belajar, ya.
        </p>
      </div>

      <form onSubmit={submit} className="card login-form">
        <label htmlFor="nama">Masukkan nama</label>
        <input
          id="nama"
          className="login-name-input"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Tulis nama kamu"
          autoComplete="name"
          maxLength={60}
          required
        />
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn primary" disabled={busy || !nama.trim()}>
          {busy ? 'Mendaftarkan nama...' : 'Mulai Belajar'}
        </button>
      </form>
    </main>
  );
}
