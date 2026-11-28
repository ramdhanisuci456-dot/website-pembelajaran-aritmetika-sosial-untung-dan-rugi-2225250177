
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const MAX_STUDENT_ID = 2_147_483_647;

export function isValidStudentId(studentId) {
  return (
    Number.isSafeInteger(studentId) &&
    studentId > 0 &&
    studentId <= MAX_STUDENT_ID
  );
}

function assertValidStudentId(studentId) {
  if (!isValidStudentId(studentId)) {
    throw new Error('ID siswa tidak valid. Silakan masuk kembali.');
  }
}

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

  if (!isValidStudentId(studentId)) {
    throw new Error(
      'Supabase tidak mengembalikan ID siswa integer yang valid.'
    );
  }

  return { studentId, name, registeredWithSupabase: true };
}

async function callSupabaseFunction(functionName, body) {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Koneksi Supabase belum dikonfigurasi.');
  }

  let response;

  try {
    response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/${functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(body),
      }
    );
  } catch {
    throw new Error('Tidak bisa terhubung ke Supabase. Periksa internet.');
  }

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || 'Data belum berhasil disimpan.');
  }
}

export async function saveAttempt({
  studentId,
  questionId,
  level,
  stepsTotal,
  firstTry,
  hintsUsed,
}) {
  assertValidStudentId(studentId);

  return callSupabaseFunction('save_student_attempt', {
    p_student_id: studentId,
    p_question_id: questionId,
    p_level: level,
    p_steps_total: stepsTotal,
    p_first_try: firstTry,
    p_hints_used: hintsUsed,
  });
}

export async function saveMateriDone(studentId, cardId) {
  assertValidStudentId(studentId);

  return callSupabaseFunction('save_student_materi', {
    p_student_id: studentId,
    p_card_id: cardId,
  });
}
