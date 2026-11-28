
import { useEffect, useState } from 'react';
import content from './content.json';
import Login from './components/Login.jsx';
import Home from './components/Home.jsx';
import Materi from './components/Materi.jsx';
import Latihan from './components/Latihan.jsx';
import Soal from './components/Soal.jsx';
import Game from './components/Game.jsx';
import Kamus from './components/Kamus.jsx';
import KakUciChat from './components/KakUciChat.jsx';
import { isAudioSupported, startAmbientMusic, stopAmbientMusic } from './audio.js';
import {
  isValidStudentId,
  saveAttempt as saveAttemptToSupabase,
  saveMateriDone,
} from './supabase.js';

const PROGRESS_KEY = 'untung-rugi-progress';
const STUDENT_KEY = 'untung-rugi-student';
const LEGACY_PROGRESS_MIGRATION_KEY = 'untung-rugi-progress-migrated';

function readStudent() {
  try {
    const saved = localStorage.getItem(STUDENT_KEY);
    if (!saved) return null;

    const student = JSON.parse(saved);

    if (
      !isValidStudentId(student.studentId) ||
      student.registeredWithSupabase !== true ||
      typeof student.name !== 'string' ||
      !student.name.trim()
    ) {
      throw new Error('Profil siswa tersimpan tidak valid.');
    }

    return student;
  } catch (error) {
    console.error('Tidak dapat membaca profil siswa tersimpan:', error);
    return null;
  }
}

function initialProgress(studentId) {
  return {
    student_id: studentId ?? null,
    soal: content.questions.map((q) => ({
      id: q.id,
      best: null,
      max: q.steps_total,
      last_score: null,
      attempts: 0,
      dikuasai: false,
    })),
    total_best: 0,
    total_max: content.skor_maks,
    materi_done: [],
    game: {
      attempts: 0,
      best: null,
      last: null,
      total: content.game.terms.length,
    },
  };
}

function progressKey(studentId) {
  return `${PROGRESS_KEY}:${studentId}`;
}

function migrateLegacyStudentProgress(nextStudent) {
  try {
    const savedStudent = localStorage.getItem(STUDENT_KEY);
    if (!savedStudent) return;

    const previousStudent = JSON.parse(savedStudent);
    if (
      previousStudent.registeredWithSupabase === true ||
      !Number.isSafeInteger(previousStudent.studentId) ||
      previousStudent.studentId < 1 ||
      typeof previousStudent.name !== 'string' ||
      previousStudent.name.trim().toLowerCase() !==
        nextStudent.name.trim().toLowerCase()
    ) {
      return;
    }

    const oldProgress = localStorage.getItem(
      progressKey(previousStudent.studentId)
    );
    const newKey = progressKey(nextStudent.studentId);
    if (!oldProgress || localStorage.getItem(newKey)) return;

    const progress = JSON.parse(oldProgress);
    if (
      !Array.isArray(progress.materi_done) ||
      !Array.isArray(progress.soal)
    ) {
      throw new Error('Format progres belajar lama tidak valid.');
    }

    localStorage.setItem(
      newKey,
      JSON.stringify({
        ...initialProgress(nextStudent.studentId),
        ...progress,
        student_id: nextStudent.studentId,
      })
    );
  } catch (error) {
    console.error(
      'Tidak dapat memindahkan progres dari ID siswa lama:',
      error
    );
  }
}

function readProgress(studentId) {
  if (!studentId) return initialProgress();

  try {
    const key = progressKey(studentId);
    const saved = localStorage.getItem(key);

    if (!saved) {
      const legacy = localStorage.getItem(PROGRESS_KEY);

      if (
        legacy &&
        localStorage.getItem(LEGACY_PROGRESS_MIGRATION_KEY) !== 'true'
      ) {
        const progress = JSON.parse(legacy);

        if (
          !Array.isArray(progress.materi_done) ||
          !Array.isArray(progress.soal)
        ) {
          throw new Error('Format progres belajar tersimpan tidak valid.');
        }

        localStorage.setItem(
          key,
          JSON.stringify({
            ...initialProgress(studentId),
            ...progress,
            student_id: studentId,
          })
        );

        localStorage.setItem(LEGACY_PROGRESS_MIGRATION_KEY, 'true');

        return {
          ...initialProgress(studentId),
          ...progress,
          student_id: studentId,
        };
      }

      return initialProgress(studentId);
    }

    const progress = JSON.parse(saved);

    if (
      !Array.isArray(progress.materi_done) ||
      !Array.isArray(progress.soal)
    ) {
      throw new Error('Format progres belajar tidak valid.');
    }

    const defaults = initialProgress(studentId);

    return {
      ...defaults,
      ...progress,
      student_id: studentId,
      soal: defaults.soal.map((question) => ({
        ...question,
        ...progress.soal.find(
          (savedQuestion) => savedQuestion.id === question.id
        ),
      })),
      game: { ...defaults.game, ...progress.game },
    };
  } catch (error) {
    console.error('Tidak dapat membaca progres belajar tersimpan:', error);
    return initialProgress(studentId);
  }
}

export default function App() {
  const [student, setStudent] = useState(readStudent);
  const [progress, setProgress] = useState(() =>
    readProgress(student?.studentId)
  );
  const [screen, setScreen] = useState({ name: 'home' });
  const [kamus, setKamus] = useState(false);
  const [musicOn, setMusicOn] = useState(false);

  useEffect(() => {
    if (!student?.studentId) return;

    try {
      localStorage.setItem(
        progressKey(student.studentId),
        JSON.stringify({
          ...progress,
          student_id: student.studentId,
          student_name: student.name,
        })
      );
    } catch (error) {
      console.error(
        'Tidak dapat menyimpan progres belajar di perangkat ini:',
        error
      );
    }
  }, [progress, student]);

  useEffect(() => {
    const onPop = (e) =>
      setScreen(e.state?.screen || { name: 'home' });

    window.addEventListener('popstate', onPop);

    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = (s) => {
    window.history.pushState({ screen: s }, '');
    setScreen(s);
    window.scrollTo(0, 0);
  };

  const handleLogin = (nextStudent) => {
    migrateLegacyStudentProgress(nextStudent);

    try {
      localStorage.setItem(STUDENT_KEY, JSON.stringify(nextStudent));
    } catch (error) {
      console.error(
        'Tidak dapat menyimpan profil siswa tersimpan:',
        error
      );
    }

    setStudent(nextStudent);
    setProgress(readProgress(nextStudent.studentId));
    setScreen({ name: 'home' });
  };

  const changeStudent = () => {
    try {
      localStorage.removeItem(STUDENT_KEY);
    } catch (error) {
      console.error(
        'Tidak dapat menghapus profil siswa dari perangkat ini:',
        error
      );
    }

    setStudent(null);
    setScreen({ name: 'home' });
  };

  const markMateriDone = (cardId) => {
    if (progress.materi_done.includes(cardId)) return;

    setProgress((current) =>
      current.materi_done.includes(cardId)
        ? current
        : {
            ...current,
            materi_done: [...current.materi_done, cardId],
          }
    );

    saveMateriDone(student.studentId, cardId).catch((error) => {
      console.error('Gagal menyimpan progres materi ke Supabase:', error);
      window.alert('Gagal menyimpan materi ke Supabase: ' + error.message);
    });
  };

  const saveAttempt = ({
    questionId,
    score,
    level,
    stepsTotal,
    firstTry,
    hintsUsed,
  }) => {
    setProgress((current) => {
      const soal = current.soal.map((item) => {
        if (item.id !== questionId) return item;

        const best = Math.max(item.best ?? 0, score);

        return {
          ...item,
          best,
          last_score: score,
          attempts: (item.attempts ?? 0) + 1,
          dikuasai: best >= Math.round(0.7 * item.max),
        };
      });

      return {
        ...current,
        student_id: student?.studentId,
        soal,
        total_best: soal.reduce(
          (total, item) => total + (item.best ?? 0),
          0
        ),
      };
    });

    saveAttemptToSupabase({
      studentId: student.studentId,
      questionId,
      level,
      stepsTotal,
      firstTry,
      hintsUsed,
    }).catch((error) => {
      console.error('Gagal menyimpan hasil soal ke Supabase:', error);
      window.alert('Gagal menyimpan hasil soal ke Supabase: ' + error.message);
    });
  };

  const saveGameResult = ({ score, total, studentId, studentName }) => {
    setProgress((current) => {
      const best = Math.max(current.game?.best ?? 0, score);

      return {
        ...current,
        student_id: studentId,
        game: {
          attempts: (current.game?.attempts ?? 0) + 1,
          best,
          last: {
            student_id: studentId,
            student_name: studentName,
            score,
            total,
            completed_at: new Date().toISOString(),
          },
          total,
        },
      };
    });
  };

  const openKamus = () => setKamus(true);
  const audioSupported = isAudioSupported();

  const toggleMusic = () => {
    if (!audioSupported) return;

    if (musicOn) {
      stopAmbientMusic();
      setMusicOn(false);
    } else {
      startAmbientMusic();
      setMusicOn(true);
    }
  };

  let view;

  if (!student) {
    view = <Login onLogin={handleLogin} />;
  } else if (screen.name === 'materi') {
    view = (
      <Materi
        materi={content.materi}
        done={progress.materi_done}
        onProgress={markMateriDone}
        go={go}
        openKamus={openKamus}
      />
    );
  } else if (screen.name === 'latihan') {
    view = (
      <Latihan
        content={content}
        progress={progress}
        go={go}
        openKamus={openKamus}
      />
    );
  } else if (screen.name === 'soal') {
    const qs = content.questions;
    const q = qs[screen.idx];

    view = (
      <Soal
        key={`${q.id}-${screen.run || 0}`}
        q={q}
        hasNext={screen.idx + 1 < qs.length}
        onNext={() => go({ ...screen, idx: screen.idx + 1 })}
        onRetry={() =>
          setScreen({ ...screen, run: (screen.run || 0) + 1 })
        }
        onBack={() => go({ name: 'latihan' })}
        onProgress={saveAttempt}
      />
    );
  } else if (screen.name === 'game') {
    view = (
      <Game
        game={content.game}
        go={go}
        studentName={student.name}
        studentId={student.studentId}
        onComplete={saveGameResult}
      />
    );
  } else {
    view = (
      <Home
        content={content}
        progress={progress}
        go={go}
        openKamus={openKamus}
        studentName={student.name}
        onChangeStudent={changeStudent}
      />
    );
  }

  return (
    <>
      {student && screen.name !== 'home' && (
        <div className="student-chip" aria-label={`Siswa: ${student.name}`}>
          Halo, {student.name} 👋
        </div>
      )}

      <button
        className="btn music-toggle global-music-toggle"
        type="button"
        onClick={toggleMusic}
        disabled={!audioSupported}
        aria-pressed={musicOn}
        aria-label={
          !audioSupported
            ? 'Audio tidak didukung di perangkat ini'
            : musicOn
              ? 'Matikan musik'
              : 'Nyalakan musik'
        }
      >
        {!audioSupported
          ? '🔇 Audio tidak tersedia'
          : musicOn
            ? '🔊 Musik ON'
            : '🔇 Musik OFF'}
      </button>

      {view}

      {kamus && (
        <Kamus
          glossary={content.glossary}
          onClose={() => setKamus(false)}
        />
      )}

      {student && <KakUciChat key={student.studentId} />}
    </>
  );
}
