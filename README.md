# Untung Rugi Kantin

Aplikasi belajar **Aritmetika Sosial: Untung dan Rugi** untuk siswa SMP, dirancang dari hasil wawancara
beban kognitif (Intrinsic, Extraneous, Germane) dengan tujuan meningkatkan **literasi matematis**.

- **Frontend**: JavaScript, React + Vite, three.js (ilustrasi 3D)
- **Backend**: Python, FastAPI + SQLAlchemy
- **Database**: SQLite (lokal) atau Postgres Supabase (online)
- **Akses belajar**: nama siswa wajib diisi dan dicatat di Supabase; progres dan skor game tersimpan lokal per ID siswa
- **Kak Uci**: tutor lokal bertahap dengan pendekatan RMT; tidak memerlukan API key
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

## Tutor dan deployment

Chat Kak Uci membimbing siswa mengidentifikasi informasi, membandingkan harga, memilih rumus, menghitung,
memberi alasan, lalu merefleksikan strategi. Tutor RMT berjalan langsung di frontend tanpa API key, Render,
Supabase, atau layanan AI eksternal. Rinciannya ada di [docs/RMT.md](./docs/RMT.md).

Nama siswa dan progres latihan/permainan disimpan di browser perangkat masing-masing; keduanya tidak
disinkronkan antarperangkat. Gunakan tombol **Ganti siswa** pada perangkat bersama.

Untuk hosting publik di Vercel:
1. Hubungkan repositori ini dan atur **Root Directory** ke `frontend`.
2. Jalankan build dengan `npm run build`; tidak perlu environment variables untuk fitur belajar.
3. Hubungkan domain Vercel yang diinginkan. Deployment frontend dapat dibuka dari jaringan Wi-Fi maupun data seluler.

Backend FastAPI di `backend/` tetap tersedia untuk pengembangan fitur server terpisah, tetapi tidak diperlukan
oleh frontend publik saat ini. Jangan menaruh `DATABASE_URL`, `SECRET_KEY`, atau kredensial database di frontend.

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
