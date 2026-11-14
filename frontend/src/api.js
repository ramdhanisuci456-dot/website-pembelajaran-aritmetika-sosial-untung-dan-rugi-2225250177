const BASE = import.meta.env.VITE_API_URL || '/api';
let token = localStorage.getItem('token') || '';

export function setToken(t) {
  token = t || '';
  if (t) localStorage.setItem('token', t);
  else localStorage.removeItem('token');
}
export const hasToken = () => !!token;

async function req(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Object.assign(new Error('Tidak bisa terhubung ke server. Cek internetmu.'), { status: 0 });
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const detail = Array.isArray(data.detail) ? 'Data tidak valid.' : data.detail;
    throw Object.assign(new Error(detail || 'Terjadi kesalahan.'), { status: res.status });
  }
  return res.json();
}

export const api = {
  login: (kode_siswa) => req('/auth/login', { method: 'POST', body: { kode_siswa } }),
  content: () => req('/content'),
  me: () => req('/me'),
  saveAttempt: (question_id, first_try, hints_used) =>
    req('/attempts', { method: 'POST', body: { question_id, first_try, hints_used } }),
  materiDone: (id) => req(`/materi/${id}/done`, { method: 'POST' }),
};
