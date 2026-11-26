const RMT_STAGE_BY_PHASE = {
  awal: 'R1 — Mendefinisikan masalah',
  identifikasi: 'R1 — Mendefinisikan masalah',
  bandingkan: 'R1 — Mendefinisikan masalah',
  rumus: 'R2 — Mengaktifkan pengetahuan awal',
  hitung: 'R3 — Membentuk relasi dan menghitung',
  bukti: 'R4 — Memberi bukti dan menyimpulkan',
  rumus_persen: 'R2 — Mengaktifkan pengetahuan awal',
  hitung_persen: 'R3 — Membentuk relasi dan menghitung',
  bukti_persen: 'R4 — Memberi bukti dan menyimpulkan',
  refleksi: 'R5 — Refleksi dan transfer',
};

const BUY_LABELS = 'modal(?:nya)?|harga\\s+beli|harga\\s+pokok|dibeli|beli';
const SELL_LABELS = 'harga\\s+jual|dijual|menjual|terjual|jual';
const DEFAULT_STATE = {
  phase: 'awal',
  intent: 'untung',
  harga_beli: null,
  harga_jual: null,
  wants_percent: false,
  hint_level: 0,
};

function parseLabeledAmount(text, labels) {
  const pattern = new RegExp(
    `\\b(?:${labels})\\b\\s*(?:(?:adalah|sebesar|seharga|sebanyak|dengan\\s+harga)\\s*|[:=]\\s*)?(?:rp\\s*)?([0-9][0-9.,]*)`,
    'i',
  );
  const match = text.match(pattern);
  return match ? Number.parseInt(match[1].replace(/[.,]/g, ''), 10) : null;
}

function formatRupiah(amount) {
  const grouped = String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp${grouped}`;
}

function formatPercent(value) {
  const rounded = Number(value.toFixed(2)).toString().replace('.', ',');
  return `${rounded}%`;
}

function parseAnswerAmount(text) {
  const match = text.match(/(?:^|[^\w])(?:rp\s*)?(\d[\d.,]*)\s*(ribu|juta)?/i);
  if (!match) return null;
  const amount = Number.parseInt(match[1].replace(/[.,]/g, ''), 10);
  const unit = match[2]?.toLowerCase();
  return amount * (unit === 'ribu' ? 1_000 : unit === 'juta' ? 1_000_000 : 1);
}

function parsePercent(text) {
  const match = text.match(/(\d+(?:[,.]\d+)?)/);
  return match ? Number.parseFloat(match[1].replace(',', '.')) : null;
}

function reply(text, state) {
  return {
    reply: text,
    state,
    rmt_stage: RMT_STAGE_BY_PHASE[state.phase],
  };
}

function isExpectedComparison(text, state) {
  const { harga_beli: buy, harga_jual: sell } = state;
  if (buy === sell) return ['sama', 'impas', 'setara'].some((word) => text.includes(word));

  const expectedPrice = sell > buy ? sell : buy;
  const expectedLabel = sell > buy ? 'jual' : 'beli';
  const hasComparison = ['lebih besar', 'lebih tinggi', 'lebih kecil', 'lebih rendah']
    .some((word) => text.includes(word));
  if (hasComparison) {
    if (sell > buy && ['lebih kecil', 'lebih rendah'].some((word) => text.includes(word))) return false;
    if (sell < buy && ['lebih besar', 'lebih tinggi'].some((word) => text.includes(word))) return false;
  }
  const amount = parseAnswerAmount(text);
  return text.includes(expectedLabel) || amount === expectedPrice;
}

function isCorrectDifferenceFormula(text, intent) {
  const hasSubtraction = ['dikurangi', 'dikurang', 'kurang', 'minus', '-', '−']
    .some((word) => text.includes(word));
  if (!hasSubtraction) return false;
  const buyWords = ['beli', 'modal'];
  const sellWords = ['jual', 'uang masuk'];
  const firstWords = intent === 'untung' ? sellWords : buyWords;
  const secondWords = intent === 'untung' ? buyWords : sellWords;
  const firstPositions = firstWords.filter((word) => text.includes(word)).map((word) => text.indexOf(word));
  const secondPositions = secondWords.filter((word) => text.includes(word)).map((word) => text.indexOf(word));
  const first = firstPositions.length ? Math.min(...firstPositions) : -1;
  const second = secondPositions.length ? Math.min(...secondPositions) : -1;
  return first >= 0 && second > first;
}

function isCorrectPercentFormula(text, intent) {
  const numerator = intent === 'untung' ? 'untung' : 'rugi';
  const hasBase = ['harga beli', 'modal'].some((word) => text.includes(word));
  const hasDivision = ['dibagi', 'bagi', 'per', '÷', '/'].some((word) => text.includes(word));
  const hasTimes100 = text.includes('100') || text.includes('seratus');
  return text.includes(numerator) && hasBase && hasDivision && hasTimes100;
}

function hint(state, options) {
  state.hint_level = Math.min(state.hint_level + 1, 3);
  const index = Math.min(state.hint_level - 1, options.length - 1);
  return reply(options[index], state);
}

function start(message, state) {
  const lowered = message.toLowerCase();
  const buy = parseLabeledAmount(message, BUY_LABELS);
  const sell = parseLabeledAmount(message, SELL_LABELS);
  state.wants_percent = lowered.includes('persen') || lowered.includes('%');

  if (buy !== null) state.harga_beli = buy;
  if (sell !== null) state.harga_jual = sell;

  if (state.harga_beli !== null && state.harga_jual !== null) {
    const currentBuy = state.harga_beli;
    const currentSell = state.harga_jual;
    if (currentBuy <= 0) {
      return reply('Modal perlu lebih dari Rp0. Coba periksa lagi angka harga belinya, ya.', state);
    }
    state.intent = currentSell > currentBuy ? 'untung' : currentSell < currentBuy ? 'rugi' : 'impas';
    state.phase = 'bandingkan';
    return reply(
      `Kita kerjakan pelan-pelan. Aku catat harga beli ${formatRupiah(currentBuy)} dan harga jual ${formatRupiah(currentSell)}. Menurutmu, mana yang lebih besar?`,
      state,
    );
  }

  const hasPrice = state.harga_beli !== null || state.harga_jual !== null;
  const asksToSolve = ['berapa', 'hitung', 'soal', 'persen', 'persentase'].some((word) => lowered.includes(word));
  if (hasPrice || asksToSolve) {
    state.phase = 'identifikasi';
    const missing = [];
    if (state.harga_beli === null) missing.push('harga beli atau modal');
    if (state.harga_jual === null) missing.push('harga jual');
    return reply(`Kita mulai dengan mengidentifikasi informasi. Sebutkan ${missing.join(' dan ')} dari soalnya, ya.`, state);
  }

  state.harga_beli = 10_000;
  state.harga_jual = lowered.includes('rugi') && !lowered.includes('untung') ? 8_000 : 12_000;
  state.intent = state.harga_jual < state.harga_beli ? 'rugi' : 'untung';
  state.phase = 'bandingkan';
  return reply(
    `Kita pahami lewat contoh kantin dulu. Harga beli ${formatRupiah(state.harga_beli)}, lalu harga jual ${formatRupiah(state.harga_jual)}. Mana yang lebih besar?`,
    state,
  );
}

export function localTutorReply(message, priorState = null) {
  const state = { ...DEFAULT_STATE, ...(priorState || {}) };
  const text = message.trim().toLowerCase();
  const { harga_beli: buy, harga_jual: sell } = state;

  if (state.phase === 'awal') {
    if (!text || ['halo', 'hai', 'hii', 'pagi', 'siang', 'sore'].includes(text)) {
      return start('Apa itu untung?', state);
    }
    return start(message, state);
  }

  if (state.phase === 'identifikasi') {
    const parsedBuy = parseLabeledAmount(message, BUY_LABELS);
    const parsedSell = parseLabeledAmount(message, SELL_LABELS);
    const nextBuy = parsedBuy !== null ? parsedBuy : buy;
    const nextSell = parsedSell !== null ? parsedSell : sell;
    state.harga_beli = nextBuy;
    state.harga_jual = nextSell;
    if (nextBuy === null || nextSell === null) {
      const missing = nextBuy === null ? 'harga beli/modal' : 'harga jual';
      return reply(`Bagus, kita cari informasinya satu per satu. Berapa ${missing} yang tertulis?`, state);
    }
    if (nextBuy <= 0) {
      return reply('Modal perlu lebih dari Rp0. Coba periksa lagi angka harga belinya, ya.', state);
    }
    state.intent = nextSell > nextBuy ? 'untung' : nextSell < nextBuy ? 'rugi' : 'impas';
    state.phase = 'bandingkan';
    return reply(
      `Terima kasih, aku catat harga beli ${formatRupiah(nextBuy)} dan harga jual ${formatRupiah(nextSell)}. Mana yang lebih besar?`,
      state,
    );
  }

  if (state.phase === 'bandingkan') {
    if (!isExpectedComparison(text, state)) {
      return hint(state, [
        'Coba bandingkan nilai uang yang keluar saat membeli dengan uang yang masuk saat menjual. Mana yang lebih besar?',
        `Periksa lagi dua nilai ini: harga beli ${formatRupiah(buy)} dan harga jual ${formatRupiah(sell)}. Mana yang lebih besar?`,
        'Gunakan tanda > atau < untuk membandingkan kedua harga, lalu sebutkan harga yang lebih besar.',
      ]);
    }
    state.hint_level = 0;
    if (state.intent === 'impas') {
      state.phase = 'bukti';
      return reply(
        'Tepat, kedua harga sama. Kamu sudah membandingkan nilainya; mengapa keadaan ini tidak menghasilkan untung maupun rugi?',
        state,
      );
    }
    state.phase = 'rumus';
    return reply(
      `Betul, kamu membandingkan dua harga dengan cermat. Untuk mencari ${state.intent}, rumus apa yang menghubungkan harga beli dan harga jual?`,
      state,
    );
  }

  if (state.phase === 'rumus') {
    if (!isCorrectDifferenceFormula(text, state.intent)) {
      const noun = state.intent === 'untung' ? 'harga jual' : 'harga beli';
      return hint(state, [
        `Pikirkan dua harga tadi. Jika ingin mencari ${state.intent}, besaran mana yang perlu dikurangkan dari yang lain?`,
        `Gunakan hubungan antara ${noun} dan harga yang satunya. Bagaimana urutan pengurangannya?`,
        state.intent === 'untung'
          ? 'Petunjuknya: harga jual dikurangi harga beli. Coba tulis rumusnya dengan kata-katamu.'
          : 'Petunjuknya: harga beli dikurangi harga jual. Coba tulis rumusnya dengan kata-katamu.',
      ]);
    }
    state.phase = 'hitung';
    state.hint_level = 0;
    const [left, right] = state.intent === 'untung' ? [sell, buy] : [buy, sell];
    return reply(
      `Bagus, kamu sudah memilih rumus yang sesuai. Sekarang masukkan angkanya: ${formatRupiah(left)} − ${formatRupiah(right)}. Berapa hasil pengurangannya?`,
      state,
    );
  }

  if (state.phase === 'hitung') {
    const expected = Math.abs(sell - buy);
    const answer = parseAnswerAmount(message);
    if (answer !== expected) {
      const [left, right] = state.intent === 'untung' ? [sell, buy] : [buy, sell];
      return hint(state, [
        `Susun lagi pengurangannya: ${formatRupiah(left)} dikurangi ${formatRupiah(right)}. Coba hitung per nilai tempat; berapa hasilnya?`,
        'Gunakan contoh kecil dengan susunan angka yang sama, lalu terapkan cara itu ke soalmu. Berapa hasil pengurangannya?',
        `Operasinya sudah tepat: ${formatRupiah(left)} − ${formatRupiah(right)}. Hitung sendiri, lalu tulis hasilnya.`,
      ]);
    }
    state.phase = 'bukti';
    state.hint_level = 0;
    return reply(
      `Ya, hasil hitunganmu ${formatRupiah(expected)}. Bagaimana kamu memeriksa bahwa hasil itu masuk akal?`,
      state,
    );
  }

  if (state.phase === 'bukti') {
    if (state.wants_percent && state.intent !== 'impas') {
      state.phase = 'rumus_persen';
      const value = state.intent === 'untung' ? 'untung' : 'rugi';
      return reply(
        `Alasanmu membantu memeriksa hasil. Sekarang kita lanjut ke persentase ${value}; rumus apa yang memakai harga beli sebagai pembagi?`,
        state,
      );
    }
    state.phase = 'refleksi';
    return reply(
      'Bagus, kamu sudah membandingkan harga lalu memeriksa hasilnya. Jika angkanya berubah, langkah berpikir apa yang tetap kamu gunakan?',
      state,
    );
  }

  if (state.phase === 'rumus_persen') {
    if (!isCorrectPercentFormula(text, state.intent)) {
      const value = state.intent === 'untung' ? 'untung' : 'rugi';
      return hint(state, [
        `Untuk persentase ${value}, besaran apa yang dibandingkan dengan harga beli?`,
        'Ingat, harga beli menjadi dasar perbandingan. Besaran apa yang dibagi dengan harga beli?',
        `Susun rumusnya: ${value} dibagi harga beli, lalu dikali 100%.`,
      ]);
    }
    state.phase = 'hitung_persen';
    state.hint_level = 0;
    const difference = Math.abs(sell - buy);
    const value = state.intent === 'untung' ? 'untung' : 'rugi';
    return reply(
      `Tepat, kamu mengingat bahwa harga beli menjadi pembagi. Sekarang hitung ${formatRupiah(difference)} ÷ ${formatRupiah(buy)} × 100%. Berapa persennya?`,
      state,
    );
  }

  if (state.phase === 'hitung_persen') {
    const expected = Math.abs(sell - buy) / buy * 100;
    const answer = parsePercent(message);
    if (answer === null || Math.abs(answer - expected) > 0.11) {
      return hint(state, [
        'Hitung pembagian terlebih dahulu, lalu ubah hasilnya menjadi persen dengan mengalikan 100. Berapa hasil akhirnya?',
        'Coba sederhanakan pecahan antara selisih dan harga beli sebelum mengalikan 100%. Berapa persennya?',
        `Susun kembali: ${formatRupiah(Math.abs(sell - buy))} ÷ ${formatRupiah(buy)} × 100%. Lanjutkan hitungannya sendiri, ya.`,
      ]);
    }
    state.phase = 'bukti_persen';
    state.hint_level = 0;
    return reply(
      `Betul, persentasenya ${formatPercent(expected)}. Mengapa harga beli menjadi pembagi, bukan harga jual?`,
      state,
    );
  }

  if (state.phase === 'bukti_persen') {
    state.phase = 'refleksi';
    return reply(
      'Kamu sudah menghubungkan selisih dengan harga beli. Kalau harga belinya berubah, bagian mana dari cara menghitung persentase yang tetap sama?',
      state,
    );
  }

  if (state.phase === 'refleksi') {
    Object.assign(state, DEFAULT_STATE);
    return reply(
      'Terima kasih sudah menjelaskan cara berpikirmu. Kamu sudah berlatih membandingkan, menghitung, dan memeriksa alasan; kita bisa mulai soal baru kapan saja.',
      state,
    );
  }

  return start(message, { ...DEFAULT_STATE });
}
