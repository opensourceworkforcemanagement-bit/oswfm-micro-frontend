import React from "react";
import ReactDOM from "react-dom/client";
import App from "./HostApp";

const rootElement = document.getElementById("app");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}