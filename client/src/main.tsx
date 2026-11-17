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

createRoot(document.getElementById("root")!).render(<App />);

// Two frames after the first render the home screen is actually painted; the
// Android app waits for this before lifting its splash screen.
requestAnimationFrame(() => requestAnimationFrame(notifyAppReady));
