
import { useEffect, useRef, useState } from 'react';
import { playFail, playSuccess } from '../audio.js';
import { PALET, parseAngka } from '../utils.js';

const roleStyle = (q, id) => {
  const i = q.roles.findIndex((r) => r.id === id);
  const [bg, border] = PALET[i % PALET.length];
  return { background: bg, borderColor: border };
};

function Petunjuk({ hints, level, onMore }) {
  return (
    <div>
      {hints.slice(0, level).map((h, i) => <p key={i} className="hint">💡 {h}</p>)}
      {level < hints.length && (
        <button className="btn ghost small" onClick={onMore}>
          {level === 0 ? 'Butuh petunjuk?' : 'Petunjuk lebih jelas'}
        </button>
      )}
    </div>
  );
}

// Tahap 1: mengidentifikasi informasi yang diketahui
function Tandai({ q, onDone }) {
  const cycle = [null, ...q.roles.map((r) => r.id)];
  const label = Object.fromEntries(q.roles.map((r) => [r.id, r.label]));
  const [marks, setMarks] = useState({});
  const [tries, setTries] = useState(0);
  const [hint, setHint] = useState(0);
  const [wrong, setWrong] = useState([]);
  const [ok, setOk] = useState(false);
  const tappable = q.story.map((s, i) => (s.role ? i : null)).filter((i) => i !== null);
  const shown = (i) => (ok ? q.story[i].role : marks[i] || null);

  function tap(i) {
    if (ok) return;
    setWrong([]);
    setMarks((m) => ({ ...m, [i]: cycle[(cycle.indexOf(m[i] || null) + 1) % cycle.length] }));
  }

  function check() {
    const bad = tappable.filter((i) => (marks[i] || null) !== q.story[i].role);
    if (bad.length === 0) {
      playSuccess();
      return setOk(true);
    }
    playFail();
    setWrong(bad);
    setTries((t) => t + 1);
    setHint((h) => Math.max(h, 1));
  }

  return (
    <div>
      <span className="badge">Tahap 1 dari {q.steps_total}</span>
      <h2>Tandai informasi yang diketahui</h2>
      <p className="muted">Ketuk angka yang tebal untuk memberi label. Ketuk lagi untuk mengganti label.</p>
      <p className="story">
        {q.story.map((s, i) =>
          s.role ? (
            <button
              key={i}
              className={`mark ${wrong.includes(i) ? 'wrong' : ''}`}
              style={shown(i) ? roleStyle(q, shown(i)) : undefined}
              onClick={() => tap(i)}
            >
              {s.t}
              {shown(i) && <small> · {label[shown(i)]}</small>}
            </button>
          ) : (
            <span key={i}>{s.t}</span>
          )
        )}
      </p>
      {wrong.length > 0 && <p className="error" role="alert">Ada label yang belum tepat (ditandai merah). Coba lagi.</p>}
      {!ok && <Petunjuk hints={q.mark_hints} level={hint} onMore={() => setHint((h) => h + 1)} />}
      {ok ? (
        <>
          <p className="ok-text">Tepat! Informasi inilah yang dipakai untuk menjawab soal.</p>
          <button className="btn primary" onClick={() => onDone({ first: tries === 0, hints: hint, judul: 'Mengidentifikasi informasi yang diketahui', errs: [] })}>
            Lanjut
          </button>
        </>
      ) : (
        <button className="btn primary" onClick={check}>Periksa</button>
      )}
    </div>
  );
}

// Tahap 2-6: pilihan ganda atau isian angka
function Langkah({ step, total, onDone }) {
  const [wrongPicks, setWrongPicks] = useState([]);
  const [vals, setVals] = useState((step.fields || []).map(() => ''));
  const [msgs, setMsgs] = useState({});
  const [wrongCount, setWrongCount] = useState(0);
  const [errs, setErrs] = useState([]);
  const [right, setRight] = useState(false);
  const [hint, setHint] = useState(0);

  function pick(i) {
    if (right || wrongPicks.includes(i)) return;
    if (i === step.jawab) {
      playSuccess();
      return setRight(true);
    }
    playFail();
    setWrongPicks((w) => [...w, i]);
    setWrongCount((c) => c + 1);
    setErrs((e) => [...e, { tanya: step.tanya, pilihan: step.opsi[i].t, why: step.opsi[i].why }]);
  }

  function checkIsian() {
    const next = {};
    const newErrs = [];
    step.fields.forEach((f, i) => {
      const n = parseAngka(vals[i]);
      if (Number.isNaN(n)) {
        next[i] = 'Tulis angka dulu.';
        return;
      }
      if (Math.abs(n - f.jawab) < 0.01) return;
      const key = Object.keys(f.salah).find((k) => Math.abs(Number(k) - n) < 0.01);
      next[i] = key ? f.salah[key] : 'Belum tepat. Periksa lagi perhitunganmu.';
      newErrs.push({ tanya: `${step.tanya} (${f.label})`, pilihan: vals[i], why: next[i] });
    });
    setMsgs(next);
    if (Object.keys(next).length === 0) {
      playSuccess();
      return setRight(true);
    }
    playFail();
    setWrongCount((c) => c + 1);
    setErrs((e) => [...e, ...newErrs]);
  }

  return (
    <div>
      <span className="badge">Tahap {step.tahap} dari {total}</span>
      <p className="muted">{step.judul}</p>
      <h2>{step.tanya}</h2>

      {step.jenis === 'pilihan' ? (
        <div className="options">
          {step.opsi.map((o, i) => {
            const isWrong = wrongPicks.includes(i);
            return (
              <div key={i}>
                <button className={`opt ${isWrong ? 'salah' : ''} ${right && i === step.jawab ? 'benar' : ''}`} onClick={() => pick(i)}>
                  {o.t}
                </button>
                {isWrong && <p className="why">Belum tepat. {o.why}</p>}
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          {step.fields.map((f, i) => (
            <div key={i} className="field">
              <label htmlFor={`f${i}`}>{f.label}</label>
              <div className="row gap">
                {f.awalan && <span className="affix">{f.awalan}</span>}
                <input
                  id={`f${i}`}
                  className="num"
                  inputMode="decimal"
                  value={vals[i]}
                  disabled={right}
                  onChange={(e) => setVals((v) => v.map((x, k) => (k === i ? e.target.value : x)))}
                />
                {f.akhiran && <span className="affix">{f.akhiran}</span>}
              </div>
              {msgs[i] && <p className="why">{msgs[i]}</p>}
            </div>
          ))}
          {!right && (
            <button className="btn primary" disabled={vals.some((v) => !v.trim())} onClick={checkIsian}>Periksa</button>
          )}
        </div>
      )}

      {!right && <Petunjuk hints={[step.h1, step.h2]} level={hint} onMore={() => setHint((h) => h + 1)} />}
      {right && (
        <>
          <p className="ok-text">Benar! {step.jelas}</p>
          <button className="btn primary" onClick={() => onDone({ first: wrongCount === 0, hints: hint, judul: step.judul, errs })}>
            Lanjut
          </button>
        </>
      )}
    </div>
  );
}

export default function Soal({ q, hasNext, onNext, onRetry, onBack, onProgress }) {
  const total = q.steps_total;
  const [phase, setPhase] = useState(0);
  const [log, setLog] = useState([]);
  const saved = useRef(false);
  const skor = log.filter((l) => l.first).length;
  const hints = log.reduce((n, l) => n + l.hints, 0);

  function finish(r) {
    setLog((l) => [...l, r]);
    setPhase((p) => p + 1);
    window.scrollTo(0, 0);
  }

  useEffect(() => {
    if (phase === total && !saved.current) {
      saved.current = true;

      onProgress({
        questionId: q.id,
        level: total,
        stepsTotal: total,
        firstTry: skor,
        hintsUsed: hints,
        score: skor,
      });
    }
  }, [phase]); // eslint-disable-line

  const errors = log.flatMap((l) => l.errs);

  return (
    <main className="page">
      <header className="row between">
        <button className="btn ghost small" onClick={onBack}>← Latihan</button>
        <span className="muted">Soal {q.no}</span>
      </header>
      <p className="muted indikator"><strong>{q.indikator}</strong><br />{q.indikator_arti}</p>
      <div className="dots">
        {Array.from({ length: total }).map((_, k) => (
          <span key={k} className={`dot ${k === phase ? 'on' : k < phase ? 'done' : ''}`} />
        ))}
      </div>

      {phase < total && (
        <>
          {phase > 0 && (
            <details className="card soal-ringkas">
              <summary>Lihat soal</summary>
              <p className="story small-story">
                {q.story.map((s, i) => (s.role ? <mark key={i} style={roleStyle(q, s.role)}>{s.t}</mark> : <span key={i}>{s.t}</span>))}
              </p>
            </details>
          )}
          {phase === 0 ? <Tandai key="t" q={q} onDone={finish} /> : <Langkah key={phase} step={q.steps[phase - 1]} total={total} onDone={finish} />}
        </>
      )}

      {phase === total && (
        <div>
          <div className={`result-banner ${skor >= Math.ceil(total / 2) ? 'success' : 'encourage'}`}>
            <h1>{skor >= Math.ceil(total / 2) ? 'Wahhh, hebat banget! 🏆' : 'Jangan berkecil hati! 🌷'}</h1>
            <p>
              {skor >= Math.ceil(total / 2)
                ? 'Kamu berhasil memahami materi Untung dan Rugi. Pertahankan semangat belajarmu yaaa!'
                : 'Belajar itu bukan tentang siapa yang paling cepat, tetapi siapa yang mau terus mencoba. Yuk, pelajari lagi materinya dan coba sekali lagi!'}
            </p>
            <em>
              {skor >= Math.ceil(total / 2)
                ? 'Pergi ke kantin membeli roti, jangan lupa membeli susu. Kamu sudah paham hari ini, lanjutkan terus, jangan menyerah dulu! 😆'
                : 'Pergi ke kantin membeli roti, jangan lupa membeli susu. Kalau belum paham hari ini, besok kita coba lagi, jangan menyerah dulu! 😆'}
            </em>
          </div>

          <p className="result-score">Skor soal ini: <strong>{skor} dari {total}</strong> (1 poin per tahap yang benar pada percobaan pertama).</p>
          <div className="card">
            <strong>Skor per tahap</strong>
            <ul className="tahap-list">
              {log.map((l, i) => (
                <li key={i}>{l.first ? '✅' : '❌'} Tahap {i + 1}: {l.judul}</li>
              ))}
            </ul>
          </div>
          <div className="card">
            <strong>Langkah penyelesaian</strong>
            <ol>{q.solution.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </div>
          {errors.length > 0 && (
            <div className="card">
              <strong>Yang perlu diperhatikan</strong>
              {errors.map((e, i) => (
                <p key={i} className="why"><em>{e.tanya}</em><br />Jawabanmu: {e.pilihan}. {e.why}</p>
              ))}
            </div>
          )}
          <div className="row gap wrap">
            <button className="btn ghost" onClick={onRetry}>Ulangi soal</button>
            {hasNext
              ? <button className="btn primary grow" onClick={onNext}>Soal berikutnya</button>
              : <button className="btn primary grow" onClick={onBack}>Kembali ke latihan</button>}
          </div>
        </div>
      )}
    </main>
  );
}
