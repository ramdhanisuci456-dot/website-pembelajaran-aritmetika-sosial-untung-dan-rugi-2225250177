export default function KakUci({ small = false }) {
  return (
    <svg
      className={`kak-uci-illustration${small ? ' small' : ''}`}
      viewBox="0 0 180 180"
      role="img"
      aria-label="Kak Uci, perempuan berhijab yang menyapa dengan ramah"
    >
      <circle cx="90" cy="90" r="84" fill="#e9f8f3" />
      <circle cx="90" cy="90" r="72" fill="#fff5df" />
      <path d="M37 161c4-30 20-45 53-45s49 15 53 45" fill="#b9a2f5" />
      <path d="M54 132c-10-12-13-28-10-47 4-28 22-48 46-48s42 20 46 48c3 19 0 35-10 47l-11-18H65z" fill="#e88db5" />
      <ellipse cx="90" cy="83" rx="31" ry="38" fill="#f3c5a5" />
      <path d="M58 84c0-25 13-43 32-43s32 18 32 43c-8-4-14-12-18-22-9 12-24 19-46 22z" fill="#8d75c8" />
      <path d="M61 92c5-25 10-39 19-48 7-7 18-7 25 0 9 9 14 23 19 48l-8 29c-6 8-15 13-27 13s-21-5-27-13z" fill="#f1a2c2" />
      <ellipse cx="90" cy="82" rx="25" ry="32" fill="#f6cdb1" />
      <path d="M76 83c3 3 6 3 9 0M96 83c3 3 6 3 9 0" fill="none" stroke="#573e59" strokeWidth="2.7" strokeLinecap="round" />
      <path d="M84 98c4 5 9 5 13 0" fill="none" stroke="#bd6682" strokeWidth="3" strokeLinecap="round" />
      <circle cx="78" cy="92" r="4" fill="#ef9aa8" opacity=".65" />
      <circle cx="103" cy="92" r="4" fill="#ef9aa8" opacity=".65" />
      <path d="M64 132c10 9 20 13 26 13s16-4 26-13l18 29H46z" fill="#c4b5fd" />
      <g className="kak-uci-wave">
        <path d="M130 126c8-12 12-25 10-39" fill="none" stroke="#f3c5a5" strokeWidth="12" strokeLinecap="round" />
        <path d="M139 84l-4-12m7 11 2-13m3 14 7-10" fill="none" stroke="#f3c5a5" strokeWidth="6" strokeLinecap="round" />
        <path d="M120 133l11-11" fill="none" stroke="#c4b5fd" strokeWidth="13" strokeLinecap="round" />
      </g>
      <path d="M38 52l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#f0c96b" />
      <path d="M145 45l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#9bded2" />
    </svg>
  );
}
