import React from "react";
import ReactDOM from "react-dom/client";
import UserManagement from "./pages/UserManagement";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<UserManagement />);
}