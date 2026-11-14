const audioState = {
  ctx: null,
  musicGain: null,
  sfxGain: null,
  musicTimer: null,
  sfxReleaseTimer: null,
  activeSfx: new Set(),
  sfxGeneration: 0,
  musicGeneration: 0,
  musicOn: false,
};

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioState.ctx) {
    const ctx = new AudioCtor();
    audioState.ctx = ctx;
    audioState.musicGain = ctx.createGain();
    audioState.sfxGain = ctx.createGain();
    audioState.musicGain.gain.value = 0.3;
    audioState.sfxGain.gain.value = 0.7;
    audioState.musicGain.connect(ctx.destination);
    audioState.sfxGain.connect(ctx.destination);
  }
  return audioState.ctx;
}

function stopPreviousSfx() {
  if (audioState.sfxReleaseTimer) {
    clearTimeout(audioState.sfxReleaseTimer);
    audioState.sfxReleaseTimer = null;
  }
  audioState.activeSfx.forEach((oscillator) => {
    oscillator.onended = null;
    oscillator.stop();
    oscillator.disconnect();
  });
  audioState.activeSfx.clear();
}

function playMusicPluck(ctx, frequency, duration, volume, type = 'triangle') {
  const startsAt = ctx.currentTime;
  const endsAt = startsAt + duration;
  const oscillator = ctx.createOscillator();
  const envelope = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startsAt);
  envelope.gain.setValueAtTime(0.0001, startsAt);
  envelope.gain.exponentialRampToValueAtTime(volume, startsAt + 0.035);
  envelope.gain.exponentialRampToValueAtTime(0.0001, endsAt);
  oscillator.connect(envelope);
  envelope.connect(audioState.musicGain);
  oscillator.onended = () => {
    oscillator.disconnect();
    envelope.disconnect();
  };
  oscillator.start(startsAt);
  oscillator.stop(endsAt);

  const overtone = ctx.createOscillator();
  const overtoneEnvelope = ctx.createGain();
  overtone.type = 'sine';
  overtone.frequency.setValueAtTime(frequency * 2, startsAt);
  overtoneEnvelope.gain.setValueAtTime(0.0001, startsAt);
  overtoneEnvelope.gain.exponentialRampToValueAtTime(volume * 0.14, startsAt + 0.025);
  overtoneEnvelope.gain.exponentialRampToValueAtTime(0.0001, startsAt + Math.min(duration, 0.22));
  overtone.connect(overtoneEnvelope);
  overtoneEnvelope.connect(audioState.musicGain);
  overtone.onended = () => {
    overtone.disconnect();
    overtoneEnvelope.disconnect();
  };
  overtone.start(startsAt);
  overtone.stop(endsAt);
}

function playNotes(notes, destination, isEffect = false) {
  const ctx = getCtx();
  if (!ctx) return;
  let generation = audioState.sfxGeneration;

  if (isEffect) {
    generation = ++audioState.sfxGeneration;
    stopPreviousSfx();
    if (audioState.musicOn) {
      audioState.musicGain.gain.cancelScheduledValues(ctx.currentTime);
      audioState.musicGain.gain.setTargetAtTime(0.035, ctx.currentTime, 0.025);
    }
  }

  const schedule = () => {
    if (isEffect && generation !== audioState.sfxGeneration) return;

    const now = ctx.currentTime;
    let longest = 0;
    notes.forEach(({ freq, start, duration, volume, type }) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const startsAt = now + start;
      const endsAt = startsAt + duration;

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, startsAt);
      gainNode.gain.setValueAtTime(volume, startsAt);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, endsAt);
      oscillator.connect(gainNode);
      gainNode.connect(destination);
      if (isEffect) {
        audioState.activeSfx.add(oscillator);
        oscillator.onended = () => {
          audioState.activeSfx.delete(oscillator);
          oscillator.disconnect();
          gainNode.disconnect();
        };
      } else {
        oscillator.onended = () => {
          oscillator.disconnect();
          gainNode.disconnect();
        };
      }
      oscillator.start(startsAt);
      oscillator.stop(endsAt);
      longest = Math.max(longest, start + duration);
    });

    if (isEffect && audioState.musicOn) {
      audioState.sfxReleaseTimer = setTimeout(() => {
        const current = audioState.ctx;
        if (!current || !audioState.musicOn || generation !== audioState.sfxGeneration) return;
        audioState.musicGain.gain.cancelScheduledValues(current.currentTime);
        audioState.musicGain.gain.setTargetAtTime(0.3, current.currentTime, 0.12);
        audioState.sfxReleaseTimer = null;
      }, Math.ceil((longest + 0.08) * 1000));
    }
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(schedule).catch((error) => console.error('Tidak dapat memulai audio:', error));
  } else {
    schedule();
  }
}

export function playTone(freq, start = 0, duration = 0.18, volume = 0.04, type = 'sine') {
  const ctx = getCtx();
  if (!ctx) return;
  playNotes([{ freq, start, duration, volume, type }], audioState.musicGain);
}

export function playSuccess() {
  playNotes([
    { freq: 523.25, start: 0, duration: 0.16, volume: 0.055, type: 'triangle' },
    { freq: 659.25, start: 0.1, duration: 0.2, volume: 0.05, type: 'triangle' },
    { freq: 783.99, start: 0.2, duration: 0.28, volume: 0.045, type: 'triangle' },
  ], audioState.sfxGain, true);
}

export function playFail() {
  playNotes([
    { freq: 293.66, start: 0, duration: 0.18, volume: 0.035, type: 'sine' },
    { freq: 261.63, start: 0.12, duration: 0.2, volume: 0.03, type: 'sine' },
  ], audioState.sfxGain, true);
}

export function startAmbientMusic() {
  const ctx = getCtx();
  if (!ctx || audioState.musicOn) return;

  const eighthNoteMs = 312.5;
  const melody = [
    523.25, 659.25, 783.99, null, 659.25, 587.33, 659.25, 783.99,
    659.25, null, 523.25, 587.33, 659.25, null, 783.99, null,
    440, 523.25, 659.25, null, 587.33, 523.25, 440, null,
    523.25, 587.33, 659.25, 783.99, 659.25, null, 523.25, null,
    349.23, 440, 523.25, null, 440, 523.25, 587.33, null,
    523.25, null, 440, 392, 440, 523.25, null, null,
    587.33, 523.25, 493.88, null, 392, 440, 523.25, null,
    493.88, 440, 392, null, 440, 523.25, null, null,
  ];
  const chords = [
    { bass: 130.81, notes: [261.63, 329.63, 392, 440] },
    { bass: 110, notes: [220, 261.63, 329.63, 392] },
    { bass: 87.31, notes: [174.61, 220, 261.63, 329.63] },
    { bass: 98, notes: [196, 246.94, 293.66, 349.23] },
  ];
  let step = 0;
  audioState.musicOn = true;

  const playNext = () => {
    if (!audioState.musicOn) return;
    const current = getCtx();
    if (!current) return;
    const generation = ++audioState.musicGeneration;
    const play = () => {
      if (!audioState.musicOn || generation !== audioState.musicGeneration) return;
      const position = step % melody.length;
      const chord = chords[Math.floor(position / 16)];
      if (melody[position]) {
        playMusicPluck(current, melody[position], 0.34, 0.12);
      }
      if (position % 16 === 0) {
        playMusicPluck(current, chord.bass, 0.72, 0.075, 'sine');
      }
      if (position % 8 === 0) {
        chord.notes.forEach((frequency, index) => {
          window.setTimeout(() => {
            if (audioState.musicOn && generation === audioState.musicGeneration) {
              playMusicPluck(current, frequency, 0.48, 0.024);
            }
          }, index * 55);
        });
      }
      step += 1;
    };
    if (current.state === 'suspended') {
      current.resume().then(play).catch((error) => console.error('Tidak dapat melanjutkan musik:', error));
    } else {
      play();
    }
  };
  const begin = () => {
    if (!audioState.musicOn || audioState.musicTimer) return;
    audioState.musicGain.gain.cancelScheduledValues(ctx.currentTime);
    audioState.musicGain.gain.setTargetAtTime(audioState.activeSfx.size ? 0.035 : 0.3, ctx.currentTime, 0.1);
    playNext();
    audioState.musicTimer = setInterval(playNext, eighthNoteMs);
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(begin).catch((error) => {
      audioState.musicOn = false;
      console.error('Tidak dapat memulai musik:', error);
    });
  } else {
    begin();
  }
}

export function stopAmbientMusic() {
  audioState.musicGeneration += 1;
  if (audioState.musicTimer) {
    clearInterval(audioState.musicTimer);
    audioState.musicTimer = null;
  }
  audioState.musicOn = false;
  if (audioState.sfxReleaseTimer) {
    clearTimeout(audioState.sfxReleaseTimer);
    audioState.sfxReleaseTimer = null;
  }
  const ctx = audioState.ctx;
  if (ctx && audioState.musicGain) {
    audioState.musicGain.gain.cancelScheduledValues(ctx.currentTime);
    audioState.musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
  }
}

export function isAudioSupported() {
  return typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext);
}
