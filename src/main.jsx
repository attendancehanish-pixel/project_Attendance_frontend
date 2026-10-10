import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./shared/context/AuthContext";
import { ThemeProvider } from "./shared/theme/ThemeContext";
import "./styles.css";
import "./layouts/layout.css";
import "./features/students/styles.css";
import "./features/attendance/styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);