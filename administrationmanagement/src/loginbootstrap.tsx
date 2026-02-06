import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from './themes/ThemeProvider';

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(   
     <ThemeProvider 
      defaultTheme="dark"           // Start with dark mode
      storageKey="my-app-theme"     // Custom localStorage key
    >
      <App/>
    </ThemeProvider>);
}