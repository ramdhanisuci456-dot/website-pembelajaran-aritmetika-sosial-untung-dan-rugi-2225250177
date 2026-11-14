const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function registerStudent(name) {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Koneksi Supabase belum dikonfigurasi.');
  }

  let response;
  try {
    response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/register_student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ p_name: name }),
    });
  } catch {
    throw new Error('Tidak bisa terhubung ke Supabase. Periksa koneksi internet.');
  }

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || 'Nama belum berhasil disimpan. Coba lagi.');
  }

  const studentId = await response.json();
  if (!Number.isInteger(studentId) || studentId < 1) {
    throw new Error('Supabase tidak mengembalikan data siswa yang valid.');
  }
  return { studentId, name };
}
