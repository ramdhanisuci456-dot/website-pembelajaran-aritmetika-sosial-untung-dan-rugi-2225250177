# Untung Rugi Kantin

Aplikasi belajar **Aritmetika Sosial: Untung dan Rugi** untuk siswa SMP, dirancang dari hasil wawancara
beban kognitif (Intrinsic, Extraneous, Germane) dengan tujuan meningkatkan **literasi matematis**.

- **Frontend**: JavaScript, React + Vite, three.js (ilustrasi 3D)
- **Backend**: Python, FastAPI + SQLAlchemy
- **Database**: SQLite (lokal) atau Postgres Supabase (online)
- **Akses belajar**: nama siswa wajib diisi dan dicatat di Supabase; progres dan skor game tersimpan lokal per ID siswa
- **Audio**: musik ceria hanya mulai setelah tombol musik ditekan; efek benar/salah memprioritaskan suara jawaban
- **Ilustrasi**: sambutan Kak Uci memakai ilustrasi 2D; permainan memakai adegan 3D bergerak yang berubah sesuai kartu

## Cara menjalankan di VS Code

Butuh: Node.js (sudah termasuk npm) dan Python 3.10+.

### 1. Backend (terminal 1)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows. Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Cek di browser: http://localhost:8000/api/health dan dokumentasi API di http://localhost:8000/docs

### 2. Frontend (terminal 2)
```bash
cd frontend
npm install
npm run dev
```
Buka http://localhost:5173. Masukkan nama untuk melanjutkan; data nama dicatat ke Supabase.

### 3. Coba di HP Android
Laptop dan HP harus satu Wi-Fi. Buka `http://IP-LAPTOP:5173` di Chrome HP
(cari IP laptop dengan `ipconfig` di Windows, atau `ifconfig` di Mac/Linux).

### 4. Tes backend (opsional)
```bash
cd backend
pytest
```

## Backend dan Supabase

Nama siswa dikirim ke fungsi database Supabase dengan publishable key dan hasilnya memberi ID siswa. Database menerima
hanya pendaftaran nama melalui fungsi terbatas; tabel tidak dibuka untuk pembacaan publik. Nama saja tidak bisa
membedakan siswa dengan nama sama, jadi setiap pendaftaran baru mendapat ID tersendiri. Progres latihan dan permainan
disimpan di browser/perangkat berdasarkan ID tersebut, bukan di Supabase, dan tidak disinkronkan antarperangkat.
Gunakan tombol **Ganti siswa** di beranda pada perangkat bersama. Jangan pernah menaruh kunci
`service_role` atau password database di frontend.

1. Pada Supabase SQL Editor, jalankan migrasi [001_add_student_name.sql](./backend/migrations/001_add_student_name.sql)
   untuk menambahkan kolom nama siswa tanpa menghapus data yang ada.
2. Jalankan juga [002_allow_name_only_student_entry.sql](./backend/migrations/002_allow_name_only_student_entry.sql)
   untuk mengizinkan pendaftaran nama tanpa kode melalui fungsi database.
3. Dari **Project Settings > API Keys**, gunakan project URL dan **publishable key**. Jangan gunakan `service_role`
   atau secret key di frontend.
4. Dari **Project Settings > Database > Connection string**, salin connection string **Session pooler** (URI)
   bila ingin memakai backend FastAPI untuk fitur lain.
   Simpan password database dengan aman.
5. Deploy backend dari direktori ini ke Render menggunakan [render.yaml](./render.yaml). Saat Render meminta
   `DATABASE_URL`, isi connection string Supabase tersebut. `SECRET_KEY` dibuat otomatis.
6. Setelah backend aktif, pastikan `https://<alamat-backend>/api/health` menampilkan `{"status":"ok"}`.
7. Deploy frontend ke Vercel dengan **Root Directory** `frontend`. Isi environment variables
   `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY`, lalu redeploy frontend. Nama proyek yang disarankan:
   `aplikasi-pembelajaran-aritmetika-sosial-untung-dan-rugi-2225250177`.
8. Setelah mendapatkan URL Vercel, atur `CORS_ORIGINS` di Render ke URL frontend itu (misalnya
   `https://<nama-proyek>.vercel.app`), lalu redeploy backend.

URL Vercel biasanya menggunakan tanda hubung, bukan garis bawah; nama tampilan dapat tetap memakai
`aplikasi_pembelajaran_aritmetika_sosial_untung_dan_rugi_2225250177`. Hosting publik dan project Supabase
baru benar-benar tersedia setelah deployment dilakukan menggunakan akun pemilik.

## Struktur
```
backend/app/content.py   <- SEMUA materi, soal, dan istilah (edit di sini)
backend/app/main.py      <- API (login, konten, kemajuan)
frontend/src/components  <- Home, Materi, Latihan, Soal, Game, Kamus, Scene3D
```

## Dari temuan wawancara ke fitur
| Temuan S01 | Fitur |
|---|---|
| Bingung istilah: modal, harga pokok, laku terjual (EL01, EL03) | Kartu "Satu Arti, Banyak Kata", Kamus Istilah, game Kantin Sortir |
| Paham istilah dulu baru rumus persen (DS02) | Urutan materi: istilah, bandingkan, hitung, persen |
| Soal cerita sulit diterjemahkan ke angka (IL04) | Langkah "Tandai informasi" sebelum menghitung |
| Banyak angka membingungkan (EL04) | Tahap 1 "Tandai informasi" memilah angka yang dipakai |
| Rumus persen untung dan rugi mirip (K01) | Kartu persentase menekankan pembagi selalu harga beli, plus umpan balik per pilihan salah |
| Contoh jual beli membantu (GL01, GL02) | Semua soal berkonteks kantin dan warung, ilustrasi 3D kios |
| Pembahasan menunjukkan letak salah (GL04) | Penjelasan tiap pilihan salah dan ringkasan "Yang perlu diperhatikan" |
| Mulai dari langkah kecil (GL05) | Tiap soal dipecah jadi 6 tahap, satu tahap per layar |
| Petunjuk bertahap menuju mandiri (GL03) | Petunjuk 1 dan 2 yang bisa dibuka sendiri |

## Soal literasi matematis
Empat soal mengikuti dokumen *Tabel Soal dan Kisi-kisi Jawaban* (Mathematical Reasoning, Formulating, Employing,
Interpreting). Tiap soal 6 tahap dan skor 1 per tahap yang benar pada percobaan pertama, maksimum 6 per soal dan 24 total.
Tahap 1 adalah menandai informasi, tahap 2-6 berupa isian angka atau pilihan. Soal ada di `backend/app/content.py`.

## Catatan
- Materi di sini "Untung dan Rugi" karena sesuai dengan hasil wawancara. Jika dosen meminta materi lain,
  cukup ganti isi `backend/app/content.py`.
- Wawancara baru melibatkan satu siswa (S01) dan pedomannya belum tervalidasi, jadi keputusan desain ini masih awal.
