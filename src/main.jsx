import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Preload the main JS bundle so the browser fetches it immediately
const mainScript = document.querySelector('script[type="module"][src*="main"]');
if (mainScript) {
  const link = document.createElement("link");
  link.rel = "modulepreload";
  link.href = mainScript.src;
  document.head.appendChild(link);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);