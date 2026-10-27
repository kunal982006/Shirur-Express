import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installImageFallback } from "./lib/image-fallback";

installImageFallback();

createRoot(document.getElementById("root")!).render(<App />);
