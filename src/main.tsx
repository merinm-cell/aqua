// import { StrictMode } from 'react';
// import { createRoot } from 'react-dom/client';
// import App from './App.tsx';
// import './index.css';

// createRoot(document.getElementById('root')!).render(
//   <StrictMode>
//     <App />
//   </StrictMode>
// );
import React from "react";
import ReactDOM from "react-dom/client";

function Maintenance() {
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      fontFamily: "sans-serif"
    }}>
      <h1>🚧 Site Under Maintenance</h1>
      <p>We’ll be back shortly.</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Maintenance />
);