// Skeleton loading instan untuk seluruh rute (publik): landing, login, daftar.
// Menahan flash putih saat navigasi (fix lag persepsi). Tanpa teks (bebas
// register), token landing.css (dimuat layout induk) supaya bertema terang/gelap.
// Server component, nol JS. Belah ketupat = tanda merek (verdict merah 45deg).
export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Memuat"
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "var(--latar)",
      }}
    >
      <style>
        {"@keyframes prm-load{0%,100%{opacity:1;transform:rotate(45deg) scale(1)}" +
          "50%{opacity:.35;transform:rotate(45deg) scale(.82)}}" +
          "@media(prefers-reduced-motion:reduce){.prm-load-mark{animation:none!important}}"}
      </style>
      <div
        aria-hidden="true"
        className="prm-load-mark"
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: "var(--aksen)",
          transform: "rotate(45deg)",
          animation: "prm-load 1.1s ease-in-out infinite",
        }}
      />
    </div>
  );
}
