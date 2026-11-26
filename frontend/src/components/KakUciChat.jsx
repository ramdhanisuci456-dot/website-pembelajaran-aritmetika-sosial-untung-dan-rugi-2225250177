import { useState } from 'react';
import { api } from '../api.js';

export default function KakUciChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hai! Kita pecahkan soal untung-rugi sedikit demi sedikit. Apa yang ingin kamu tanyakan?', sent: false },
  ]);
  const [tutorState, setTutorState] = useState({
    phase: 'awal',
    intent: 'untung',
    harga_beli: null,
    harga_jual: null,
    wants_percent: false,
    hint_level: 0,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function send(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text || busy) return;

    setMessage('');
    setError('');
    setBusy(true);
    const history = messages.filter((item) => item.sent).slice(-10)
      .map(({ role, text: content }) => ({ role, text: content }));
    const userMessage = { role: 'user', text, sent: false };
    setMessages((current) => [...current, userMessage]);
    try {
      const result = await api.chat(text, history, tutorState);
      setTutorState(result.state);
      setMessages((current) => [
        ...current.map((item) => item === userMessage ? { ...item, sent: true } : item),
        { role: 'model', text: result.reply, rmtStage: result.rmt_stage, sent: true },
      ]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="kak-chat">
      {open && (
        <section className="kak-chat-panel" aria-label="Chat dengan Kak Uci">
          <header className="kak-chat-header">
            <div>
              <strong>Ngobrol dengan Kak Uci</strong>
              <div className="muted">Pendamping langkah demi langkah (RMT) · jangan kirim data pribadi</div>
            </div>
            <button className="btn ghost small" type="button" onClick={() => setOpen(false)} aria-label="Tutup chat">
              Tutup
            </button>
          </header>
          <div className="kak-chat-messages" aria-live="polite">
            {messages.map((item, index) => (
              <p className={`kak-chat-message ${item.role === 'user' ? 'from-user' : 'from-kak'}`} key={index}>
                {item.text}
                {item.rmtStage && <><br /><small className="muted">Tahap berpikir: {item.rmtStage}</small></>}
              </p>
            ))}
            {busy && <p className="kak-chat-message from-kak">Kak Uci sedang berpikir…</p>}
          </div>
          {error && <p className="error kak-chat-error" role="alert">{error}</p>}
          <form className="kak-chat-form" onSubmit={send}>
            <label className="sr-only" htmlFor="kak-chat-input">Tulis pertanyaan untuk Kak Uci</label>
            <input
              id="kak-chat-input"
              className="kak-chat-input"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tulis pertanyaan..."
              maxLength={1000}
              disabled={busy}
            />
            <button className="btn primary kak-chat-send" type="submit" disabled={busy || !message.trim()}>
              Kirim
            </button>
          </form>
        </section>
      )}
      <button
        className="btn primary kak-chat-toggle"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        {open ? 'Tutup chat' : '💬 Tanya Kak Uci'}
      </button>
    </div>
  );
}
