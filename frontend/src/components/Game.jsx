import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { playFail, playSuccess } from '../audio.js';
import { shuffle } from '../utils.js';

const GameScene3D = lazy(() => import('./Scene3D.jsx').then((module) => ({ default: module.GameScene3D })));

export default function Game({ game, go, studentName, studentId, onComplete }) {
  const [round, setRound] = useState(0);
  const cards = useMemo(() => shuffle(game.terms), [round, game]); // eslint-disable-line
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState(null); // null | {ok, pick}
  const completed = useRef(false);

  const c = cards[i];
  const finished = i >= cards.length;

  function answer(role) {
    if (result) return;
    const ok = role === c.role;
    setResult({ ok, pick: role });
    if (ok) {
      playSuccess();
      setScore((s) => s + 1);
    } else {
      playFail();
    }
  }
  function next() {
    if (i + 1 === cards.length && !completed.current) {
      completed.current = true;
      onComplete?.({ score, total: cards.length, studentId, studentName });
    }
    setResult(null);
    setI((n) => n + 1);
  }
  function again() {
    setRound((r) => r + 1);
    setI(0);
    setScore(0);
    setResult(null);
    completed.current = false;
  }

  return (
    <main className="page">
      <header className="row between">
        <button className="btn ghost small" onClick={() => go({ name: 'home' })}>← Beranda</button>
        <span className="badge">Skor {score}</span>
      </header>
      <h1>🎮 {game.judul}</h1>

      {!finished ? (
        <>
          <p className="muted">Semangat, {studentName}! {game.petunjuk} ({i + 1}/{cards.length})</p>
          <div className="game-card">
            <Suspense fallback={<div className="game-scene game-scene-fallback" aria-label="Menyiapkan ilustrasi 3D">{c.illustration.map((item, index) => <span key={`${c.id}-${index}`}>{item}</span>)}</div>}>
              <GameScene3D term={c} />
            </Suspense>
            <strong>{c.text}</strong>
          </div>
          <div className="row gap">
            <button className="btn beli grow" onClick={() => answer('beli')} disabled={!!result}>Harga beli</button>
            <button className="btn jual grow" onClick={() => answer('jual')} disabled={!!result}>Harga jual</button>
          </div>
          {result && (
            <div className={`card ${result.ok ? 'fb-ok' : 'fb-no'}`}>
              <strong>{result.ok ? 'Benar!' : `Belum tepat. Jawabannya: ${c.role === 'beli' ? 'harga beli' : 'harga jual'}.`}</strong>
              <p>{c.contoh}</p>
              <button className="btn primary" onClick={next}>{i + 1 === cards.length ? 'Lihat hasil' : 'Kartu berikutnya'}</button>
            </div>
          )}
        </>
      ) : (
        <div className="card game-result">
          <h2>{score === cards.length ? 'Wahhh, hebat banget! 🏆' : 'Jangan berkecil hati! 🌷'}</h2>
          <p>Keren, {studentName}! Hasil permainanmu tersimpan di perangkat ini.</p>
          <p className="result-score">Hasil: <strong>{score}</strong> dari {cards.length}</p>
          <p>
            {score === cards.length
              ? 'Kamu sudah paham banget bedanya harga beli dan harga jual. Pertahankan semangat jual belinya!'
              : 'Belajar itu bukan siapa yang cepat, tapi siapa yang terus mencoba. Yuk, coba lagi dan jadilah pedagang cerdas!'}
          </p>
          <p className="game-pantun">
            Pergi ke warung membeli pisang, <br />
            Jangan lupa membayar dengan senyum. <br />
            Kalau belum paham hari ini, <br />
            Besok kita coba lagi, tetap semangat ya! 😄
          </p>
          <div className="row gap">
            <button className="btn ghost" onClick={again}>Main lagi</button>
            <button className="btn primary grow" onClick={() => go({ name: 'latihan' })}>Ke latihan soal</button>
          </div>
        </div>
      )}
    </main>
  );
}
