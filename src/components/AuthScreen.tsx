"use client"
import { useState } from "react"
import { supabase } from "../lib/supabase"
import ElectricBorder from "./ElectricBorder"
import GlareHover from "./GlareHover"
import LandingHero from "./LandingHero"

export default function AuthScreen() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [showLanding, setShowLanding] = useState(true)

  async function handleAuth() {
    setAuthError(""); setAuthLoading(true)
    const { error } = await (authMode === "login"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password }))
    if (error) setAuthError(error.message)
    setAuthLoading(false)
  }

  if (showLanding) {
    return <LandingHero onLaunchApp={() => setShowLanding(false)} />
  }

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse at 50% 0%, hsla(119,99%,46%,0.1) 0%, #0d0d0d 70%)",
      padding: 20,
      fontFamily: "'Sora', -apple-system, sans-serif",
      position: "relative"
    }}>
      {/* Top Left Navigation Back to Landing Hero */}
      <button
        onClick={() => setShowLanding(true)}
        className="absolute top-6 left-6 z-20 text-white/60 hover:text-white text-xs font-medium uppercase tracking-widest flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-colors"
      >
        <span>← Back</span>
      </button>

      {/* GlareHover & Electric Border Wrapped Auth Card */}
      <GlareHover
        width="100%"
        height="auto"
        background="rgba(20, 20, 20, 0.95)"
        borderRadius="20px"
        borderColor="rgba(255, 255, 255, 0.08)"
        glareColor="#ffffff"
        glareOpacity={0.25}
        glareAngle={-30}
        glareSize={300}
        transitionDuration={800}
        playOnce={false}
        style={{
          maxWidth: 380,
          backdropFilter: "blur(24px)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
          display: "block",
        }}
      >
        <ElectricBorder
          color="hsl(119, 99%, 46%)"
          speed={1.4}
          chaos={0.14}
          borderRadius={20}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
          }}
        >
          <div style={{
            padding: "36px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            position: "relative",
            zIndex: 2,
          }}>

          {/* Logo */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "hsla(119,99%,46%,0.15)",
              border: "1px solid hsla(119,99%,46%,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              boxShadow: "0 0 24px hsla(119,99%,46%,0.2)",
            }}>✦</div>
            <div style={{ textAlign: "center" }}>
              <h1 style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 700,
                color: "#f0f0f0",
                letterSpacing: "-0.03em",
              }}>
                KIKAR <span style={{ color: "hsl(119,99%,46%)" }}>AI</span>
              </h1>
              <p style={{
                margin: "4px 0 0",
                color: "#888",
                fontSize: 13,
                fontWeight: 400,
              }}>
                {authMode === "login" ? "Sign in to your account" : "Create a new account"}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex",
            borderRadius: 10,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "#0d0d0d",
          }}>
            {(["login", "signup"] as const).map(m => (
              <button key={m}
                onClick={() => { setAuthMode(m); setAuthError("") }}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: authMode === m ? "hsla(119,99%,46%,0.12)" : "transparent",
                  border: authMode === m ? "1px solid hsla(119,99%,46%,0.3)" : "none",
                  color: authMode === m ? "hsl(119,99%,46%)" : "#888",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: authMode === m ? 600 : 400,
                  fontFamily: "'Sora', sans-serif",
                  transition: "all 0.18s ease",
                }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Email input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <label style={{
              fontSize: 11,
              color: "#888",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 6,
            }}>Email</label>
            <input
              style={{
                width: "100%",
                padding: "11px 14px",
                background: "#0d0d0d",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                color: "#f0f0f0",
                fontSize: 14,
                fontFamily: "'Sora', sans-serif",
                outline: "none",
                boxSizing: "border-box",
              }}
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAuth()}
            />
          </div>

          {/* Password input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <label style={{
              fontSize: 11,
              color: "#888",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 6,
            }}>Password</label>
            <input
              style={{
                width: "100%",
                padding: "11px 14px",
                background: "#0d0d0d",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                color: "#f0f0f0",
                fontSize: 14,
                fontFamily: "'Sora', sans-serif",
                outline: "none",
                boxSizing: "border-box",
              }}
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAuth()}
            />
          </div>

          {/* Error message */}
          {authError && (
            <div style={{
              padding: "10px 14px",
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.25)",
              borderRadius: 8,
              color: "#f87171",
              fontSize: 13,
              lineHeight: 1.5,
            }}>{authError}</div>
          )}

          {/* Signup hint */}
          {authMode === "signup" && (
            <p style={{
              color: "#888",
              fontSize: 12,
              margin: 0,
              lineHeight: 1.5,
              padding: "8px 12px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              ✉ Check your email to confirm your account after signing up.
            </p>
          )}

          {/* CTA Button */}
          <button
            style={{
              padding: "13px 0",
              background: authLoading
                ? "rgba(255,255,255,0.06)"
                : "linear-gradient(135deg, hsl(119,99%,46%) 0%, hsl(119,99%,38%) 100%)",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              cursor: authLoading ? "not-allowed" : "pointer",
              color: authLoading ? "#888" : "#0a0a0a",
              marginTop: 4,
              fontFamily: "'Sora', sans-serif",
              letterSpacing: "0.01em",
              transition: "opacity 0.15s, transform 0.12s",
              boxShadow: authLoading ? "none" : "0 4px 24px hsla(119,99%,46%,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            onClick={handleAuth}
            disabled={authLoading}
          >
            {authLoading ? (
              <>
                <span style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "2px solid #888",
                  borderTopColor: "transparent",
                  display: "inline-block",
                  animation: "spin 0.7s linear infinite",
                }} />
                {authMode === "login" ? "Signing in…" : "Creating account…"}
              </>
            ) : (
              authMode === "login" ? "Sign In →" : "Create Account →"
            )}
          </button>

        </div>
        </ElectricBorder>
      </GlareHover>
    </div>
  )
}