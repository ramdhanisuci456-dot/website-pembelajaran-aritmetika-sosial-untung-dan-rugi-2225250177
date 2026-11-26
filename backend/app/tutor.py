import re

from .rmt import RMT_STAGE_BY_PHASE

_BUY_LABELS = r"modal(?:nya)?|harga\s+beli|harga\s+pokok|dibeli|beli"
_SELL_LABELS = r"harga\s+jual|dijual|menjual|terjual|jual"
_DEFAULT_STATE = {
    "phase": "awal",
    "intent": "untung",
    "harga_beli": None,
    "harga_jual": None,
    "wants_percent": False,
    "hint_level": 0,
}


def _parse_labeled_amount(text: str, labels: str) -> int | None:
    match = re.search(
        rf"\b(?:{labels})\b\s*(?:(?:adalah|sebesar|seharga|sebanyak|dengan\s+harga)\s*|[:=]\s*)?(?:rp\s*)?([0-9][0-9.,]*)",
        text,
        re.IGNORECASE,
    )
    if not match:
        return None
    return int(re.sub(r"[.,]", "", match.group(1)))


def _format_rupiah(amount: int) -> str:
    return f"Rp{amount:,}".replace(",", ".")


def _format_percent(value: float) -> str:
    return f"{value:.2f}".rstrip("0").rstrip(".").replace(".", ",") + "%"


def _parse_answer_amount(text: str) -> int | None:
    match = re.search(r"(?<!\w)(\d[\d.,]*)\s*(ribu|juta)?", text.casefold())
    if not match:
        return None
    amount = int(re.sub(r"[.,]", "", match.group(1)))
    unit = match.group(2)
    return amount * (1_000 if unit == "ribu" else 1_000_000 if unit == "juta" else 1)


def _parse_percent(text: str) -> float | None:
    match = re.search(r"(\d+(?:[,.]\d+)?)\s*%?", text)
    return float(match.group(1).replace(",", ".")) if match else None


def _reply(reply: str, state: dict) -> dict:
    return {
        "reply": reply,
        "state": state,
        "rmt_stage": RMT_STAGE_BY_PHASE[state["phase"]],
    }


def _is_expected_comparison(text: str, state: dict) -> bool:
    buy = state["harga_beli"]
    sell = state["harga_jual"]
    if buy == sell:
        return any(word in text for word in ("sama", "impas", "setara"))

    expected_price = sell if sell > buy else buy
    expected_label = "jual" if sell > buy else "beli"
    has_comparison = any(word in text for word in ("lebih besar", "lebih tinggi", "lebih kecil", "lebih rendah"))
    if has_comparison:
        if sell > buy and any(word in text for word in ("lebih kecil", "lebih rendah")):
            return False
        if sell < buy and any(word in text for word in ("lebih besar", "lebih tinggi")):
            return False
    amount = _parse_answer_amount(text)
    identifies_expected_price = amount == expected_price
    identifies_expected_label = expected_label in text
    if has_comparison:
        return identifies_expected_label or identifies_expected_price
    return identifies_expected_label or identifies_expected_price


def _is_correct_difference_formula(text: str, intent: str) -> bool:
    lowered = text.casefold()
    has_subtraction = any(word in lowered for word in ("dikurangi", "dikurang", "kurang", "minus", "-", "−"))
    if not has_subtraction:
        return False
    buy_words = ("beli", "modal")
    sell_words = ("jual", "uang masuk")
    first_words, second_words = (sell_words, buy_words) if intent == "untung" else (buy_words, sell_words)
    first = min((lowered.find(word) for word in first_words if word in lowered), default=-1)
    second = min((lowered.find(word) for word in second_words if word in lowered), default=-1)
    return first >= 0 and second > first


def _is_correct_percent_formula(text: str, intent: str) -> bool:
    lowered = text.casefold()
    numerator = "untung" if intent == "untung" else "rugi"
    has_numerator = numerator in lowered
    has_base = any(word in lowered for word in ("harga beli", "modal"))
    has_division = any(word in lowered for word in ("dibagi", "bagi", "per", "÷", "/"))
    has_times_100 = "100" in lowered or "seratus" in lowered
    return has_numerator and has_base and has_division and has_times_100


def _hint(state: dict, options: tuple[str, ...]) -> dict:
    state["hint_level"] = min(state["hint_level"] + 1, 3)
    index = min(state["hint_level"] - 1, len(options) - 1)
    return _reply(options[index], state)


def _start(message: str, state: dict) -> dict:
    lowered = message.casefold()
    buy = _parse_labeled_amount(message, _BUY_LABELS)
    sell = _parse_labeled_amount(message, _SELL_LABELS)
    state["wants_percent"] = "persen" in lowered or "%" in lowered

    if buy is not None:
        state["harga_beli"] = buy
    if sell is not None:
        state["harga_jual"] = sell

    if state["harga_beli"] is not None and state["harga_jual"] is not None:
        buy = state["harga_beli"]
        sell = state["harga_jual"]
        if buy <= 0:
            return _reply("Modal perlu lebih dari Rp0. Coba periksa lagi angka harga belinya, ya.", state)
        state["intent"] = "untung" if sell > buy else "rugi" if sell < buy else "impas"
        state["phase"] = "bandingkan"
        return _reply(
            f"Kita kerjakan pelan-pelan. Aku catat harga beli {_format_rupiah(buy)} dan "
            f"harga jual {_format_rupiah(sell)}. Menurutmu, mana yang lebih besar?",
            state,
        )

    has_price = state["harga_beli"] is not None or state["harga_jual"] is not None
    asks_to_solve = any(word in lowered for word in ("berapa", "hitung", "soal", "persen", "persentase"))
    if has_price or asks_to_solve:
        state["phase"] = "identifikasi"
        missing = []
        if state["harga_beli"] is None:
            missing.append("harga beli atau modal")
        if state["harga_jual"] is None:
            missing.append("harga jual")
        return _reply(
            f"Kita mulai dengan mengidentifikasi informasi. Sebutkan {' dan '.join(missing)} dari soalnya, ya.",
            state,
        )

    state["harga_beli"] = 10_000
    state["harga_jual"] = 8_000 if "rugi" in lowered and "untung" not in lowered else 12_000
    state["intent"] = "rugi" if state["harga_jual"] < state["harga_beli"] else "untung"
    state["phase"] = "bandingkan"
    return _reply(
        f"Kita pahami lewat contoh kantin dulu. Harga beli {_format_rupiah(state['harga_beli'])}, "
        f"lalu harga jual {_format_rupiah(state['harga_jual'])}. Mana yang lebih besar?",
        state,
    )


def local_tutor_reply(message: str, prior_state: dict | None = None) -> dict:
    state = {**_DEFAULT_STATE, **(prior_state or {})}
    text = message.strip().casefold()
    phase = state["phase"]
    buy = state["harga_beli"]
    sell = state["harga_jual"]

    if phase == "awal":
        if not text or text in {"halo", "hai", "hii", "pagi", "siang", "sore"}:
            return _start("Apa itu untung?", state)
        return _start(message, state)

    if phase == "identifikasi":
        parsed_buy = _parse_labeled_amount(message, _BUY_LABELS)
        parsed_sell = _parse_labeled_amount(message, _SELL_LABELS)
        buy = parsed_buy if parsed_buy is not None else buy
        sell = parsed_sell if parsed_sell is not None else sell
        state["harga_beli"] = buy
        state["harga_jual"] = sell
        if buy is None or sell is None:
            missing = "harga beli/modal" if buy is None else "harga jual"
            return _reply(f"Bagus, kita cari informasinya satu per satu. Berapa {missing} yang tertulis?", state)
        if buy <= 0:
            return _reply("Modal perlu lebih dari Rp0. Coba periksa lagi angka harga belinya, ya.", state)
        state["intent"] = "untung" if sell > buy else "rugi" if sell < buy else "impas"
        state["phase"] = "bandingkan"
        return _reply(
            f"Terima kasih, aku catat harga beli {_format_rupiah(buy)} dan harga jual {_format_rupiah(sell)}. "
            "Mana yang lebih besar?",
            state,
        )

    if phase == "bandingkan":
        if not _is_expected_comparison(text, state):
            return _hint(state, (
                "Coba bandingkan nilai uang yang keluar saat membeli dengan uang yang masuk saat menjual. "
                "Mana yang lebih besar?",
                f"Periksa lagi dua nilai ini: harga beli {_format_rupiah(buy)} dan harga jual "
                f"{_format_rupiah(sell)}. Mana yang lebih besar?",
                "Gunakan tanda > atau < untuk membandingkan kedua harga, lalu sebutkan harga yang lebih besar.",
            ))
        state["hint_level"] = 0
        if state["intent"] == "impas":
            state["phase"] = "bukti"
            return _reply(
                "Tepat, kedua harga sama. Kamu sudah membandingkan nilainya; mengapa keadaan ini tidak menghasilkan "
                "untung maupun rugi?",
                state,
            )
        state["phase"] = "rumus"
        return _reply(
            f"Betul, kamu membandingkan dua harga dengan cermat. Untuk mencari {state['intent']}, "
            "rumus apa yang menghubungkan harga beli dan harga jual?",
            state,
        )

    if phase == "rumus":
        if not _is_correct_difference_formula(text, state["intent"]):
            noun = "harga jual" if state["intent"] == "untung" else "harga beli"
            return _hint(state, (
                f"Pikirkan dua harga tadi. Jika ingin mencari {state['intent']}, besaran mana yang perlu "
                "dikurangkan dari yang lain?",
                f"Gunakan hubungan antara {noun} dan harga yang satunya. Bagaimana urutan pengurangannya?",
                f"Petunjuknya: {noun} dikurangi harga beli." if state["intent"] == "untung"
                else "Petunjuknya: harga beli dikurangi harga jual. Coba tulis rumusnya dengan kata-katamu.",
            ))
        state["phase"] = "hitung"
        state["hint_level"] = 0
        left, right = (sell, buy) if state["intent"] == "untung" else (buy, sell)
        return _reply(
            f"Bagus, kamu sudah memilih rumus yang sesuai. Sekarang masukkan angkanya: "
            f"{_format_rupiah(left)} − {_format_rupiah(right)}. Berapa hasil pengurangannya?",
            state,
        )

    if phase == "hitung":
        expected = abs(sell - buy)
        answer = _parse_answer_amount(message)
        if answer != expected:
            left, right = (sell, buy) if state["intent"] == "untung" else (buy, sell)
            return _hint(state, (
                f"Susun lagi pengurangannya: {_format_rupiah(left)} dikurangi "
                f"{_format_rupiah(right)}. Coba hitung per nilai tempat; berapa hasilnya?",
                "Gunakan contoh kecil dengan susunan angka yang sama, lalu terapkan cara itu ke soalmu. "
                "Berapa hasil pengurangannya?",
                f"Operasinya sudah tepat: {_format_rupiah(left)} − {_format_rupiah(right)}. "
                "Hitung sendiri, lalu tulis hasilnya.",
            ))
        state["phase"] = "bukti"
        state["hint_level"] = 0
        return _reply(
            f"Ya, hasil hitunganmu {_format_rupiah(expected)}. Bagaimana kamu memeriksa bahwa hasil itu masuk akal?",
            state,
        )

    if phase == "bukti":
        if state["wants_percent"] and state["intent"] != "impas":
            state["phase"] = "rumus_persen"
            value = "untung" if state["intent"] == "untung" else "rugi"
            return _reply(
                f"Alasanmu membantu memeriksa hasil. Sekarang kita lanjut ke persentase {value}; "
                "rumus apa yang memakai harga beli sebagai pembagi?",
                state,
            )
        state["phase"] = "refleksi"
        return _reply(
            "Bagus, kamu sudah membandingkan harga lalu memeriksa hasilnya. Jika angkanya berubah, "
            "langkah berpikir apa yang tetap kamu gunakan?",
            state,
        )

    if phase == "rumus_persen":
        if not _is_correct_percent_formula(text, state["intent"]):
            value = "untung" if state["intent"] == "untung" else "rugi"
            return _hint(state, (
                f"Untuk persentase {value}, besaran apa yang dibandingkan dengan harga beli?",
                "Ingat, harga beli menjadi dasar perbandingan. Besaran apa yang dibagi dengan harga beli?",
                f"Susun rumusnya: {value} dibagi harga beli, lalu dikali 100%.",
            ))
        state["phase"] = "hitung_persen"
        state["hint_level"] = 0
        difference = abs(sell - buy)
        value = "untung" if state["intent"] == "untung" else "rugi"
        return _reply(
            f"Tepat, kamu mengingat bahwa harga beli menjadi pembagi. Sekarang hitung "
            f"{_format_rupiah(difference)} ÷ {_format_rupiah(buy)} × 100%. Berapa persennya?",
            state,
        )

    if phase == "hitung_persen":
        expected = abs(sell - buy) / buy * 100
        answer = _parse_percent(message)
        if answer is None or abs(answer - expected) > 0.11:
            return _hint(state, (
                "Hitung pembagian terlebih dahulu, lalu ubah hasilnya menjadi persen dengan mengalikan 100. "
                "Berapa hasil akhirnya?",
                "Coba sederhanakan pecahan antara selisih dan harga beli sebelum mengalikan 100%. "
                "Berapa persennya?",
                f"Susun kembali: {_format_rupiah(abs(sell - buy))} ÷ {_format_rupiah(buy)} × 100%. "
                "Lanjutkan hitungannya sendiri, ya.",
            ))
        state["phase"] = "bukti_persen"
        state["hint_level"] = 0
        return _reply(
            f"Betul, persentasenya {_format_percent(expected)}. Mengapa harga beli menjadi pembagi, "
            "bukan harga jual?",
            state,
        )

    if phase == "bukti_persen":
        state["phase"] = "refleksi"
        return _reply(
            "Kamu sudah menghubungkan selisih dengan harga beli. Kalau harga belinya berubah, "
            "bagian mana dari cara menghitung persentase yang tetap sama?",
            state,
        )

    if phase == "refleksi":
        state.update(_DEFAULT_STATE)
        return _reply(
            "Terima kasih sudah menjelaskan cara berpikirmu. Kamu sudah berlatih membandingkan, menghitung, "
            "dan memeriksa alasan; kita bisa mulai soal baru kapan saja.",
            state,
        )

    return _start(message, {**_DEFAULT_STATE})
