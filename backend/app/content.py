"""Isi materi, permainan, dan soal. Semua teks ada di sini supaya mudah diganti.

Dasar rancangan (hasil wawancara S01):
- Kenalkan istilah dulu, baru rumus persen           (DS02, EL05)
- Satu arti banyak kata: modal = harga pokok = harga beli  (EL01, EL03)
- Soal bertahap: pendek -> variasi istilah -> cerita panjang (GL05)
- Ada angka pengecoh pada soal cerita                (EL04)
- Contoh jual beli sehari-hari (kantin)              (GL01, GL02)
- Pembahasan menunjukkan letak salah                 (GL04)
"""
import re


def rp(n: int) -> str:
    return "Rp" + f"{n:,}".replace(",", ".")


def story(s: str):
    """Ubah teks bertanda [teks|peran] menjadi potongan kalimat."""
    out, pos = [], 0
    for m in re.finditer(r"\[([^|\]]+)\|([a-z_0-9]+)\]", s):
        if m.start() > pos:
            out.append({"t": s[pos:m.start()]})
        out.append({"t": m.group(1), "role": m.group(2)})
        pos = m.end()
    if pos < len(s):
        out.append({"t": s[pos:]})
    return out


def O(t, why=None):
    return {"t": t, "why": why}


GLOSSARY = [
    {"istilah": "Harga beli", "arti": "Uang yang dikeluarkan untuk mendapatkan barang.",
     "sinonim": ["modal", "harga pokok", "dibeli dengan harga", "membeli seharga"]},
    {"istilah": "Harga jual", "arti": "Uang yang diterima saat barang dijual lagi.",
     "sinonim": ["dijual seharga", "laku terjual", "ditawarkan seharga"]},
    {"istilah": "Untung", "arti": "Terjadi jika harga jual lebih besar dari harga beli.", "sinonim": []},
    {"istilah": "Rugi", "arti": "Terjadi jika harga jual lebih kecil dari harga beli.", "sinonim": []},
    {"istilah": "Impas", "arti": "Harga jual sama dengan harga beli.", "sinonim": []},
    {"istilah": "Persen (%)", "arti": "Artinya per seratus. 25% = 25 per 100.", "sinonim": []},
]

MATERI = [
    {
        "id": "m1", "judul": "Kenalan: Harga Beli dan Harga Jual",
        "body": [
            "Bayangkan kamu jualan di kantin sekolah.",
            "**Harga beli** = uang yang kamu keluarkan untuk mendapatkan barang.",
            "**Harga jual** = uang yang kamu terima saat barang itu dijual lagi.",
        ],
        "contoh": "Beli gorengan Rp10.000, lalu dijual Rp12.000.",
        "scene": {"type": "kios", "beli": 10000, "jual": 12000},
        "cek": None,
    },
    {
        "id": "m2", "judul": "Satu Arti, Banyak Kata",
        "body": [
            "Di soal, harga beli dan harga jual sering ditulis dengan kata lain. Artinya tetap sama.",
            "Tanya ke diri sendiri: uang ini **keluar** atau **masuk**?",
        ],
        "dua_kolom": {
            "kiri_judul": "Harga beli (uang keluar)",
            "kiri": ["modal", "harga pokok", "dibeli dengan harga", "membeli seharga"],
            "kanan_judul": "Harga jual (uang masuk)",
            "kanan": ["dijual seharga", "laku terjual", "ditawarkan seharga"],
        },
        "cek": {"tanya": "Di soal tertulis: \"Modal Rp20.000\". Modal berarti...",
                "opsi": ["Harga jual", "Harga beli"], "jawab": 1,
                "benar": "Tepat! Modal adalah uang yang keluar untuk membeli barang.",
                "salah": "Belum tepat. Modal itu uang yang keluar di awal, jadi harga beli."},
    },
    {
        "id": "m3", "judul": "Bandingkan Dua Harga",
        "body": [
            "Sebelum menghitung, bandingkan dulu harga jual dan harga beli.",
            "Harga jual **lebih besar** dari harga beli → **untung**.",
            "Harga jual **lebih kecil** dari harga beli → **rugi**.",
            "Harga jual **sama** dengan harga beli → **impas**.",
        ],
        "contoh": "Beli Rp10.000, jual Rp12.000. Rp12.000 lebih besar, jadi untung.",
        "scene": {"type": "bars", "beli": 10000, "jual": 12000},
        "cek": {"tanya": "Dibeli Rp15.000, dijual Rp13.000. Hasilnya?",
                "opsi": ["Untung", "Rugi", "Impas"], "jawab": 1,
                "benar": "Benar! 13.000 lebih kecil dari 15.000, jadi rugi.",
                "salah": "Bandingkan lagi: harga jual 13.000 lebih kecil dari harga beli 15.000."},
    },
    {
        "id": "m4", "judul": "Berapa Untung atau Ruginya?",
        "body": [
            "Untung = harga jual − harga beli.",
            "Rugi = harga beli − harga jual.",
            "Kurangkan angka yang besar dengan yang kecil, supaya hasilnya tidak negatif.",
        ],
        "contoh": "Beli Rp50.000, jual Rp42.000. Rugi = 50.000 − 42.000 = Rp8.000.",
        "scene": {"type": "bars", "beli": 50000, "jual": 42000},
        "cek": {"tanya": "Beli Rp40.000, jual Rp46.000. Berapa untungnya?",
                "opsi": ["Rp6.000", "Rp86.000", "Rp46.000"], "jawab": 0,
                "benar": "Betul! 46.000 − 40.000 = Rp6.000.",
                "salah": "Untung dicari dengan mengurangi: harga jual − harga beli."},
    },
    {
        "id": "m5", "judul": "Persentase Untung dan Rugi",
        "body": [
            "Tanda % artinya **per seratus**.",
            "Persentase untung = untung ÷ harga beli × 100%.",
            "Persentase rugi = rugi ÷ harga beli × 100%.",
            "Dua rumus ini hampir sama. Pembaginya **selalu harga beli**. Bedanya hanya di atas: untung atau rugi.",
        ],
        "contoh": "Beli Rp10.000, untung Rp2.000. 2.000 ÷ 10.000 = 0,2. Lalu 0,2 × 100% = 20%.",
        "cek": {"tanya": "Beli Rp50.000, untung Rp5.000. Persentase untungnya?",
                "opsi": ["5%", "10%", "90%"], "jawab": 1,
                "benar": "Yes! 5.000 ÷ 50.000 = 0,1 → 10%.",
                "salah": "Bagi untung dengan harga beli: 5.000 ÷ 50.000 = 0,1. Lalu kali 100%."},
    },
    {
        "id": "m6", "judul": "Banyak Barang: Hitung Totalnya",
        "body": [
            "Kalau barangnya lebih dari satu, kalikan harga satu barang dengan jumlahnya.",
            "Total harga beli = jumlah × harga beli per barang.",
            "Total hasil penjualan = jumlah × harga jual per barang.",
            "Untung seluruhnya = total hasil penjualan − total harga beli.",
        ],
        "contoh": "5 botol, beli Rp3.000 dan jual Rp4.000 per botol. Total beli 15.000, total jual 20.000, untung Rp5.000.",
        "cek": {"tanya": "Membeli 6 buah, harga beli Rp2.000 per buah. Total harga belinya?",
                "opsi": ["Rp8.000", "Rp12.000"], "jawab": 1,
                "benar": "Tepat! 6 × 2.000 = Rp12.000.",
                "salah": "Kalikan jumlah dengan harga per buah: 6 × 2.000."},
    },
    {
        "id": "m7", "judul": "Mencari Harga Jual dari Persen Untung",
        "body": [
            "Kalau pedagang ingin untung sekian persen, hitung dulu untungnya.",
            "Untung = persen untung × harga beli.",
            "Harga jual = harga beli + untung.",
            "Kalau ditanya harga jual satu barang, bagi total harga jual dengan jumlah barang.",
        ],
        "contoh": "Beli 10 barang Rp100.000, ingin untung 10%. Untung 10.000, harga jual 110.000, per barang Rp11.000.",
        "cek": {"tanya": "Harga beli Rp200.000, ingin untung 10%. Berapa harga jualnya?",
                "opsi": ["Rp210.000", "Rp220.000", "Rp20.000"], "jawab": 1,
                "benar": "Benar! Untung 20.000, jadi harga jual 200.000 + 20.000 = Rp220.000.",
                "salah": "Untungnya 10% × 200.000 = 20.000. Harga jual = harga beli + untung."},
    },
    {
        "id": "m8", "judul": "4 Langkah Menyelesaikan Soal",
        "body": [
            "1. Baca soal, cari **harga beli**.",
            "2. Cari **harga jual**.",
            "3. **Bandingkan** keduanya: untung, rugi, atau impas.",
            "4. **Hitung** nilainya, dan persentasenya jika ditanya.",
            "Tidak semua angka dipakai. Coret angka yang tidak berhubungan dengan uang beli dan jual.",
        ],
        "cek": None,
    },
]

GAME = {
    "judul": "Kantin Sortir",
    "petunjuk": "Geser kartu ke jawaban yang tepat: ini harga beli atau harga jual?",
    "terms": [
        {"id": "g1", "text": "modal", "role": "beli", "contoh": "Ani punya modal Rp5.000 untuk membeli bahan gorengan."},
        {"id": "g2", "text": "dijual seharga", "role": "jual", "contoh": "Gorengan itu dijual seharga Rp7.000."},
        {"id": "g3", "text": "harga pokok", "role": "beli", "contoh": "Harga pokok satu kotak susu adalah Rp4.000."},
        {"id": "g4", "text": "laku terjual", "role": "jual", "contoh": "Susu itu laku terjual Rp5.000."},
        {"id": "g5", "text": "dibeli dengan harga", "role": "beli", "contoh": "Roti dibeli dengan harga Rp9.000."},
        {"id": "g6", "text": "ditawarkan seharga", "role": "jual", "contoh": "Roti ditawarkan seharga Rp11.000."},
        {"id": "g7", "text": "uang yang dikeluarkan untuk membeli barang", "role": "beli", "contoh": "Ini uang yang keluar dari dompet penjual."},
        {"id": "g8", "text": "uang yang diterima dari pembeli", "role": "jual", "contoh": "Ini uang yang masuk ke dompet penjual."},
    ],
}

# ---------------------------------------------------------------------------
# SOAL LITERASI MATEMATIS (dari dokumen "Tabel Soal dan Kisi-kisi Jawaban")
# Tiap soal punya 6 tahap, skor 1 per tahap, maksimum 6. Total 4 soal = 24.
# Tahap 1 selalu "Mengidentifikasi informasi yang diketahui" (fitur Tandai informasi).
# ---------------------------------------------------------------------------
SKOR_MAKS_SOAL = 6
PASS_RATIO = 4 / 6  # soal dianggap dikuasai jika skor >= 4 dari 6

MARK_HINTS = [
    "Baca kata di dekat setiap angka. Tanyakan: angka ini menunjukkan apa?",
    "Harga beli = uang keluar untuk membeli. Harga jual = uang masuk dari penjualan. Perhatikan juga jumlah barang dan persen.",
]


def pilihan(tahap, judul, tanya, opsi, jawab, h1, h2, jelas):
    return {"jenis": "pilihan", "tahap": tahap, "judul": judul, "tanya": tanya,
            "opsi": opsi, "jawab": jawab, "h1": h1, "h2": h2, "jelas": jelas}


def isian(tahap, judul, tanya, fields, h1, h2, jelas):
    return {"jenis": "isian", "tahap": tahap, "judul": judul, "tanya": tanya,
            "fields": fields, "h1": h1, "h2": h2, "jelas": jelas}


def F(label, jawab, awalan="", akhiran="", salah=None):
    return {"label": label, "jawab": jawab, "awalan": awalan, "akhiran": akhiran, "salah": salah or {}}


QUESTIONS = [
    {
        "id": "q1", "no": 1,
        "indikator": "Mathematical Reasoning",
        "indikator_arti": "Membandingkan, memberi alasan, dan mengambil keputusan.",
        "roles": [
            {"id": "a_beli", "label": "Harga beli A"}, {"id": "a_jual", "label": "Harga jual A"},
            {"id": "b_beli", "label": "Harga beli B"}, {"id": "b_jual", "label": "Harga jual B"},
        ],
        "story": story(
            "Dua pedagang menjual tas dengan jenis dan kualitas yang sama. Pedagang A membeli sebuah tas seharga "
            "[Rp80.000|a_beli] dan menjualnya seharga [Rp100.000|a_jual]. Sementara itu, Pedagang B membeli sebuah tas seharga "
            "[Rp90.000|b_beli] dan menjualnya seharga [Rp117.000|b_jual]. Seorang pembeli berpendapat bahwa Pedagang A "
            "memperoleh keuntungan lebih besar karena harga jual tasnya lebih rendah dibandingkan Pedagang B. "
            "Apakah pendapat tersebut benar? Bandingkan keuntungan dalam rupiah dan persentase dari kedua pedagang. "
            "Jelaskan alasanmu!"),
        "steps": [
            isian(2, "Menghitung keuntungan Pedagang A", "Berapa keuntungan Pedagang A?",
                  [F("Keuntungan A", 20000, awalan="Rp", salah={
                      "180000": "Itu hasil menjumlahkan. Untung dicari dengan mengurangi.",
                      "100000": "Itu harga jualnya, bukan keuntungannya."})],
                  "Untung = harga jual − harga beli.", "Hitung 100.000 − 80.000.", "100.000 − 80.000 = Rp20.000."),
            isian(3, "Menghitung keuntungan Pedagang B", "Berapa keuntungan Pedagang B?",
                  [F("Keuntungan B", 27000, awalan="Rp", salah={
                      "207000": "Itu hasil menjumlahkan. Untung dicari dengan mengurangi.",
                      "117000": "Itu harga jualnya, bukan keuntungannya."})],
                  "Untung = harga jual − harga beli.", "Hitung 117.000 − 90.000.", "117.000 − 90.000 = Rp27.000."),
            pilihan(4, "Membandingkan keuntungan", "Dalam rupiah, siapa yang untungnya lebih besar?",
                    [O("Pedagang A, Rp20.000", "Rp20.000 lebih kecil dari Rp27.000."),
                     O("Pedagang B, Rp27.000"),
                     O("Sama besar", "Kedua keuntungan tidak sama.")], 1,
                    "Bandingkan Rp20.000 dengan Rp27.000.", "Mana angka yang lebih besar?",
                    "Rp27.000 lebih besar daripada Rp20.000, jadi Pedagang B lebih untung dalam rupiah."),
            isian(5, "Menghitung persentase keuntungan", "Berapa persentase keuntungan masing-masing?",
                  [F("Pedagang A", 25, akhiran="%", salah={
                      "20": "Kamu membagi dengan harga jual (100.000). Pembagi persentase untung adalah harga beli.",
                      "20000": "Itu keuntungan dalam rupiah. Bagi dengan harga beli lalu kali 100%."}),
                   F("Pedagang B", 30, akhiran="%", salah={
                       "23.08": "Kamu membagi dengan harga jual (117.000). Pembagi persentase untung adalah harga beli.",
                       "27000": "Itu keuntungan dalam rupiah. Bagi dengan harga beli lalu kali 100%."})],
                  "Persentase untung = untung ÷ harga beli × 100%.",
                  "A: 20.000 ÷ 80.000. B: 27.000 ÷ 90.000. Lalu kali 100%.",
                  "A = 20.000 ÷ 80.000 × 100% = 25%. B = 27.000 ÷ 90.000 × 100% = 30%."),
            pilihan(6, "Menyimpulkan", "Apakah pendapat pembeli itu benar?",
                    [O("Benar. Pedagang A untung lebih besar karena harga jualnya lebih rendah.",
                       "Harga jual yang rendah tidak berarti untung besar. Yang dibandingkan adalah keuntungannya."),
                     O("Tidak benar. Pedagang B untung lebih besar, baik dalam rupiah (Rp27.000) maupun persentase (30%)."),
                     O("Benar dalam persentase, tetapi salah dalam rupiah.",
                       "Persentase A (25%) justru lebih kecil dari B (30%).")], 1,
                    "Lihat hasil tahap 4 (rupiah) dan tahap 5 (persen).", "B unggul di rupiah dan di persen.",
                    "Pendapat pembeli tidak benar. B untung lebih besar dalam rupiah dan persentase."),
        ],
        "solution": [
            "Diketahui: A beli Rp80.000, jual Rp100.000. B beli Rp90.000, jual Rp117.000.",
            "Untung A = 100.000 − 80.000 = Rp20.000.",
            "Untung B = 117.000 − 90.000 = Rp27.000.",
            "Rp27.000 > Rp20.000, jadi B lebih untung dalam rupiah.",
            "Persen A = 20.000 ÷ 80.000 × 100% = 25%. Persen B = 27.000 ÷ 90.000 × 100% = 30%.",
            "Kesimpulan: pendapat pembeli tidak benar. B untung lebih besar dalam rupiah dan persentase.",
        ],
    },
    {
        "id": "q2", "no": 2,
        "indikator": "Formulating Situations Mathematically",
        "indikator_arti": "Memilih informasi penting dan mengubah situasi nyata menjadi model matematika.",
        "roles": [
            {"id": "jumlah", "label": "Jumlah barang"},
            {"id": "beli", "label": "Harga beli seluruhnya"},
            {"id": "persen", "label": "Persentase untung"},
        ],
        "story": story(
            "Seorang pedagang membeli [15 kotak bekal|jumlah] dengan total harga [Rp150.000|beli]. Pedagang tersebut ingin "
            "memperoleh keuntungan sebesar [20%|persen] dari harga beli seluruh kotak bekal. Agar memperoleh keuntungan sesuai "
            "keinginannya, pedagang harus menentukan harga jual untuk setiap kotak bekal. Buatlah model matematika berdasarkan "
            "situasi tersebut, kemudian tentukan harga jual setiap kotak bekal!"),
        "steps": [
            pilihan(2, "Menentukan model keuntungan", "Model matematika mana yang tepat untuk keuntungan?",
                    [O("keuntungan = persentase keuntungan × jumlah barang",
                       "Persentase untung diambil dari harga beli seluruhnya, bukan dari jumlah barang."),
                     O("keuntungan = persentase keuntungan × harga beli"),
                     O("keuntungan = persentase keuntungan × harga jual",
                       "Di soal, 20% dihitung dari harga beli, bukan harga jual.")], 1,
                    "Baca lagi: 20% dari apa?", "Keuntungan 20% dari harga beli seluruh kotak.",
                    "keuntungan = persentase keuntungan × harga beli."),
            isian(3, "Menghitung keuntungan", "Berapa keuntungan yang diinginkan?",
                  [F("Keuntungan", 30000, awalan="Rp", salah={
                      "3000": "Cek lagi: 20% sama dengan 0,2. Kalikan 0,2 × 150.000.",
                      "170000": "Itu hasil menjumlahkan. Keuntungan = 20% × harga beli."})],
                  "Keuntungan = 20% × Rp150.000.", "20% = 20/100 = 0,2. Hitung 0,2 × 150.000.",
                  "20% × 150.000 = Rp30.000."),
            isian(4, "Menentukan total harga jual", "Berapa total harga jual seluruh kotak?",
                  [F("Total harga jual", 180000, awalan="Rp", salah={
                      "30000": "Itu keuntungannya. Total harga jual = harga beli + keuntungan."})],
                  "Total harga jual = harga beli + keuntungan.", "Hitung 150.000 + 30.000.",
                  "150.000 + 30.000 = Rp180.000."),
            pilihan(5, "Menentukan model harga jual setiap kotak", "Model mana yang tepat untuk harga jual setiap kotak?",
                    [O("total harga jual × jumlah barang", "Mengalikan membuat angkanya makin besar. Harga per kotak didapat dengan membagi."),
                     O("keuntungan ÷ jumlah barang", "Itu keuntungan tiap kotak, bukan harga jual tiap kotak."),
                     O("total harga jual ÷ jumlah barang")], 2,
                    "Total harga jual dibagi rata ke semua kotak.", "Bagi total harga jual dengan 15.",
                    "harga jual setiap kotak = total harga jual ÷ jumlah barang."),
            isian(6, "Menghitung harga jual setiap kotak", "Berapa harga jual setiap kotak bekal?",
                  [F("Harga jual per kotak", 12000, awalan="Rp", salah={
                      "180000": "Itu total harga jual semua kotak. Bagi dengan jumlah kotak (15).",
                      "10000": "Itu harga beli per kotak (150.000 ÷ 15). Harga jual harus lebih tinggi karena ada untung."})],
                  "Harga jual per kotak = total harga jual ÷ 15.", "Hitung 180.000 ÷ 15.",
                  "180.000 ÷ 15 = Rp12.000. Setiap kotak bekal harus dijual Rp12.000."),
        ],
        "solution": [
            "Diketahui: 15 kotak, harga beli seluruhnya Rp150.000, untung 20%.",
            "Model: keuntungan = persentase untung × harga beli.",
            "Keuntungan = 20% × 150.000 = Rp30.000.",
            "Total harga jual = 150.000 + 30.000 = Rp180.000.",
            "Model: harga jual per kotak = total harga jual ÷ jumlah barang.",
            "Harga jual per kotak = 180.000 ÷ 15 = Rp12.000.",
        ],
    },
    {
        "id": "q3", "no": 3,
        "indikator": "Employing Mathematical Concepts, Facts, and Procedures",
        "indikator_arti": "Memilih dan memakai operasi serta prosedur untuk mendapat solusi.",
        "roles": [
            {"id": "jumlah", "label": "Jumlah barang"},
            {"id": "beli", "label": "Harga beli per botol"},
            {"id": "jual", "label": "Harga jual per botol"},
        ],
        "story": story(
            "Seorang pedagang membeli [24 botol|jumlah] minuman dengan harga [Rp8.000|beli] untuk setiap botol. Seluruh minuman "
            "tersebut berhasil dijual dengan harga [Rp9.000|jual] per botol. Berdasarkan informasi tersebut, hitunglah: "
            "a. Total harga beli seluruh minuman. b. Total hasil penjualan. c. Besar keuntungan yang diperoleh. "
            "d. Persentase keuntungan yang diperoleh pedagang. Tunjukkan langkah perhitunganmu!"),
        "steps": [
            isian(2, "Menghitung total harga beli", "a. Berapa total harga beli seluruh minuman?",
                  [F("Total harga beli", 192000, awalan="Rp", salah={
                      "32": "Itu hasil menjumlahkan 24 + 8. Kalikan jumlah botol dengan harga per botol."})],
                  "Total = jumlah botol × harga beli per botol.", "Hitung 24 × 8.000.", "24 × 8.000 = Rp192.000."),
            isian(3, "Menghitung total hasil penjualan", "b. Berapa total hasil penjualan?",
                  [F("Total hasil penjualan", 216000, awalan="Rp", salah={
                      "9000": "Itu harga jual satu botol. Kalikan dengan 24 botol."})],
                  "Total = jumlah botol × harga jual per botol.", "Hitung 24 × 9.000.", "24 × 9.000 = Rp216.000."),
            isian(4, "Menghitung keuntungan", "c. Berapa besar keuntungan yang diperoleh?",
                  [F("Keuntungan", 24000, awalan="Rp", salah={
                      "1000": "Itu untung satu botol. Pertanyaannya untung seluruh minuman.",
                      "408000": "Itu hasil menjumlahkan. Untung dicari dengan mengurangi."})],
                  "Untung = total hasil penjualan − total harga beli.", "Hitung 216.000 − 192.000.",
                  "216.000 − 192.000 = Rp24.000."),
            pilihan(5, "Menyusun perhitungan persentase", "d. Susunan mana yang tepat untuk persentase keuntungan?",
                    [O("(24.000 ÷ 192.000) × 100%"),
                     O("(24.000 ÷ 216.000) × 100%", "Pembaginya harus harga beli (192.000), bukan hasil penjualan."),
                     O("(216.000 ÷ 192.000) × 100%", "Itu perbandingan hasil penjualan terhadap harga beli, bukan persentase untung.")], 0,
                    "Persentase untung = untung ÷ harga beli × 100%.", "Harga beli seluruhnya adalah Rp192.000.",
                    "Persentase untung = (24.000 ÷ 192.000) × 100%."),
            isian(6, "Menyelesaikan perhitungan", "Berapa persentase keuntungan pedagang?",
                  [F("Persentase untung", 12.5, akhiran="%", salah={
                      "11.11": "Kamu membagi dengan total hasil penjualan (216.000). Pembaginya harga beli (192.000).",
                      "0.125": "Itu bentuk pecahannya. Kalikan 100% untuk mendapat persen."})],
                  "Hitung 24.000 ÷ 192.000, lalu kali 100%.", "24.000 ÷ 192.000 = 0,125.",
                  "0,125 × 100% = 12,5%. Untungnya Rp24.000 atau 12,5%."),
        ],
        "solution": [
            "Diketahui: 24 botol, beli Rp8.000 per botol, jual Rp9.000 per botol.",
            "Total harga beli = 24 × 8.000 = Rp192.000.",
            "Total hasil penjualan = 24 × 9.000 = Rp216.000.",
            "Keuntungan = 216.000 − 192.000 = Rp24.000.",
            "Persentase untung = (24.000 ÷ 192.000) × 100%.",
            "Hasilnya 12,5%. Jadi untungnya Rp24.000 atau 12,5%.",
        ],
    },
    {
        "id": "q4", "no": 4,
        "indikator": "Interpreting, Applying, and Evaluating Mathematical Outcomes",
        "indikator_arti": "Menafsirkan hasil, menilai kewajaran, dan mengambil keputusan.",
        "roles": [{"id": "beli", "label": "Harga beli"}, {"id": "jual", "label": "Harga jual"}],
        "story": story(
            "Dina membeli sebuah sepatu seharga [Rp200.000|beli]. Beberapa hari kemudian, sepatu tersebut dijual kembali dengan "
            "harga [Rp230.000|jual]. Dina menghitung keuntungan sebesar Rp30.000, kemudian menentukan persentase keuntungan "
            "dengan cara membagi keuntungan tersebut dengan harga jual, lalu mengalikannya dengan 100%. Dina memperoleh hasil "
            "sekitar 13,04%. Apakah cara perhitungan Dina sudah tepat untuk menentukan persentase keuntungan? Evaluasilah "
            "perhitungan tersebut dan tentukan persentase keuntungan yang seharusnya diperoleh Dina. Jelaskan alasanmu!"),
        "steps": [
            isian(2, "Menghitung keuntungan", "Periksa dulu: berapa keuntungan Dina?",
                  [F("Keuntungan", 30000, awalan="Rp", salah={
                      "430000": "Itu hasil menjumlahkan. Untung dicari dengan mengurangi."})],
                  "Untung = harga jual − harga beli.", "Hitung 230.000 − 200.000.", "230.000 − 200.000 = Rp30.000. Hitungan Dina untuk bagian ini benar."),
            pilihan(3, "Mengidentifikasi rumus persentase", "Rumus persentase keuntungan yang tepat adalah...",
                    [O("(keuntungan ÷ harga beli) × 100%"),
                     O("(keuntungan ÷ harga jual) × 100%", "Ini cara Dina. Pembaginya bukan harga jual."),
                     O("(harga jual ÷ harga beli) × 100%", "Itu bukan persentase untung. Yang dibandingkan adalah keuntungannya.")], 0,
                    "Untung dibandingkan dengan modal awal.", "Modal awal disebut harga beli.",
                    "Persentase keuntungan = (keuntungan ÷ harga beli) × 100%."),
            pilihan(4, "Menjelaskan letak kesalahan", "Apa yang keliru dari cara Dina?",
                    [O("Dina membagi dengan harga jual. Seharusnya dengan harga beli."),
                     O("Dina salah menghitung keuntungan. Seharusnya Rp20.000.", "Keuntungan Dina sudah benar, yaitu Rp30.000."),
                     O("Dina tidak perlu mengalikan dengan 100%.", "Mengalikan 100% itu perlu agar hasilnya berbentuk persen.")], 0,
                    "Bandingkan pembagi Dina dengan rumus di tahap 3.", "Dina memakai Rp230.000 sebagai pembagi.",
                    "Dina memakai harga jual sebagai pembagi. Seharusnya harga beli."),
            isian(5, "Menghitung persentase yang benar", "Berapa persentase keuntungan yang seharusnya?",
                  [F("Persentase untung", 15, akhiran="%", salah={
                      "13.04": "Itu hasil Dina, yang membagi dengan harga jual. Bagi dengan harga beli (200.000)."})],
                  "Persentase = 30.000 ÷ harga beli × 100%.", "Hitung 30.000 ÷ 200.000 = 0,15.",
                  "30.000 ÷ 200.000 × 100% = 15%."),
            pilihan(6, "Menyimpulkan", "Apa kesimpulan evaluasimu?",
                    [O("Cara Dina belum tepat. Persentase untung yang benar 15% karena untung dibandingkan dengan harga beli."),
                     O("Cara Dina sudah tepat karena untung memang dibandingkan dengan harga jual.",
                       "Persentase untung dibandingkan dengan harga beli (modal), bukan harga jual."),
                     O("Cara Dina belum tepat. Persentase untung yang benar adalah 30%.", "30 itu dari Rp30.000, bukan persentasenya.")], 0,
                    "Gabungkan hasil tahap 4 dan tahap 5.", "Cara Dina keliru, hasil benarnya 15%.",
                    "Cara Dina belum tepat. Yang benar 15% karena keuntungan dibandingkan dengan harga beli."),
        ],
        "solution": [
            "Diketahui: harga beli Rp200.000, harga jual Rp230.000.",
            "Keuntungan = 230.000 − 200.000 = Rp30.000.",
            "Rumus yang tepat: (keuntungan ÷ harga beli) × 100%.",
            "Dina memakai harga jual sebagai pembagi, jadi hasilnya (13,04%) keliru.",
            "Persentase yang benar = (30.000 ÷ 200.000) × 100% = 15%.",
            "Kesimpulan: cara Dina belum tepat. Persentase untung yang benar adalah 15%.",
        ],
    },
]

for _q in QUESTIONS:
    _q["mark_hints"] = MARK_HINTS
    _q["steps_total"] = len(_q["steps"]) + 1  # tahap 1 = menandai informasi
    assert _q["steps_total"] == SKOR_MAKS_SOAL

QUESTION_INDEX = {q["id"]: q for q in QUESTIONS}


def content_payload():
    return {"glossary": GLOSSARY, "materi": MATERI, "game": GAME, "questions": QUESTIONS,
            "skor_maks": SKOR_MAKS_SOAL * len(QUESTIONS)}
