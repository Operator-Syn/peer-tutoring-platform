import React from "react";

export default function PopUpMessage({ message, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999
    }}>
      <div style={{
        background: "#fff",
        padding: "24px 32px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        minWidth: "250px",
        textAlign: "center"
      }}>
        <div style={{ marginBottom: "16px" }}>{message}</div>
        <button onClick={onClose} style={{
          padding: "8px 24px",
          borderRadius: "4px",
          border: "none",
          background: "#616DBE",
          color: "#fff",
          cursor: "pointer"
        }}>OK</button>
      </div>
    </div>
  );
}