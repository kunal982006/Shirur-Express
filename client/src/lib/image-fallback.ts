// Shown in place of any image that fails to load (e.g. image host unavailable),
// so customers see a neutral placeholder instead of a broken-image icon.
const PLACEHOLDER_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
    <rect width="400" height="300" fill="#f1f5f9"/>
    <g fill="none" stroke="#cbd5e1" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" transform="translate(150 100)">
      <rect x="0" y="0" width="100" height="100" rx="14"/>
      <circle cx="32" cy="34" r="10"/>
      <path d="M0 80 L35 52 L60 72 L78 58 L100 76"/>
    </g>
  </svg>`
)}`;

export function installImageFallback() {
  // Image "error" events don't bubble, so listen in the capture phase.
  document.addEventListener(
    "error",
    (event) => {
      const img = event.target;
      if (!(img instanceof HTMLImageElement) || img.dataset.fallbackApplied) return;
      img.dataset.fallbackApplied = "true";
      img.removeAttribute("srcset");
      img.src = PLACEHOLDER_SRC;
    },
    true
  );
}
