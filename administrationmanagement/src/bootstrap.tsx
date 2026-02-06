import React from "react";
import ReactDOM from "react-dom/client";
import AbacPermissionManagement from "./pages/AbacPermissionManagement";
import "./index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<AbacPermissionManagement 
  theme="brand-a"
  apiBaseUrl="http://localhost:1110/api/v1"
/>);
}