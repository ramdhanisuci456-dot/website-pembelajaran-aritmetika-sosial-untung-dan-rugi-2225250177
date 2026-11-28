
import { useState } from 'react';
import KakUci from './KakUci.jsx';
import { registerStudent } from '../supabase.js';

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
      const student = await registerStudent(name);
      onLogin(student);
    } catch (error) {
      setErr(error.message || 'Nama belum berhasil didaftarkan. Coba lagi.');
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
