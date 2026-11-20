import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installImageFallback } from "./lib/image-fallback";
import { installNativeBackHandler, notifyAppReady, reloadForNewVersion } from "./lib/native-app";
import { installPageTransitions } from "./lib/page-transitions";

installImageFallback();
installNativeBackHandler();
installPageTransitions();

// A page's code file can vanish when a new version is deployed while this one is
// open. Reload once to move onto the new version instead of showing a dead page.
window.addEventListener("vite:preloadError", (event) => {
  if (navigator.onLine && reloadForNewVersion()) event.preventDefault();
});

// An admin opening the app goes straight to the admin panel, before the
// customer home screen is ever drawn. The server still checks the session.
try {
  const lastUser = JSON.parse(localStorage.getItem("shirur_last_user") || "null");
  if (lastUser?.role === "admin" && window.location.pathname === "/") {
    window.history.replaceState(window.history.state, "", "/admin");
  }
} catch {
  // Storage unavailable: open normally.
}

createRoot(document.getElementById("root")!).render(<App />);

// Two frames after the first render the home screen is actually painted; the
// Android app waits for this before lifting its splash screen.
requestAnimationFrame(() => requestAnimationFrame(notifyAppReady));
