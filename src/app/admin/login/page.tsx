"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.replace("/admin");
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a1523",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        background: "#fff",
        borderRadius: 12,
        padding: "2.5rem",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            background: "#2070B8",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.5rem", margin: "0 auto 1rem",
          }}>
            ✝
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0a1523", marginBottom: 4 }}>
            Admin Panel
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#6c757d" }}>
            Wesley Paul International Ministries
          </p>
        </div>

        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 6,
            padding: "0.75rem 1rem",
            color: "#dc2626",
            fontSize: "0.875rem",
            marginBottom: "1rem",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              style={{
                width: "100%",
                padding: "0.65rem 0.9rem",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: "0.95rem",
                outline: "none",
                boxSizing: "border-box",
              }}
              placeholder="admin"
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: "100%",
                padding: "0.65rem 0.9rem",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: "0.95rem",
                outline: "none",
                boxSizing: "border-box",
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: loading ? "#93c5fd" : "#2070B8",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: "1rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
