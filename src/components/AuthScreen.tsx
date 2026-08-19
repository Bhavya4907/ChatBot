"use client"
import { useState } from "react"
import { supabase } from "../lib/supabase"
import Link from "next/link"

export default function AuthScreen() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState("")
  const [authLoading, setAuthLoading] = useState(false)

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setAuthError(""); setAuthLoading(true)
    const { error } = await (authMode === "login"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password }))
    if (error) setAuthError(error.message)
    setAuthLoading(false)
  }

  return (
    <main style={{ minHeight: "100svh", position: "relative", overflowX: "hidden", background: "#000", margin: 0, padding: 0 }}>
      <style>{`
        @font-face {
          font-family: "Geist Mono:SemiBold";
          font-style: normal;
          font-weight: 600;
          font-display: swap;
          src: url("https://static.figma.com/font/GeistMono_wght__1") format("woff2");
        }
        .geist-mono {
          font-family: "Geist Mono:SemiBold", monospace;
        }
        .text-gradient {
          background-image: linear-gradient(247.3282658084845deg, rgb(255, 255, 255) 2.5334%, rgba(255, 255, 255, 0.4) 93.612%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .kikar-heading {
          font-size: 210px;
          line-height: 1.1;
          letter-spacing: -16px;
        }
        .kikar-msg {
          font-size: 24px;
          line-height: 1.1;
          letter-spacing: -2px;
        }
        @media (max-width: 640px) {
          .kikar-heading {
            font-size: clamp(70px, 22vw, 140px);
            letter-spacing: -0.09em;
          }
          .kikar-msg {
            font-size: clamp(16px, 4.5vw, 20px);
            letter-spacing: -1.3px;
          }
          .header-logo-container {
            top: 32px !important;
            transform: translateX(-50%) scale(0.75) !important;
            transform-origin: top center;
          }
          .center-content {
            width: min(100% - 40px, 360px) !important;
            gap: 28px !important;
          }
          .kikar-divider {
            width: 100% !important;
          }
        }
        .raw-input {
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.3);
          color: white;
          font-family: "Geist Mono:SemiBold", monospace;
          font-size: 16px;
          padding: 8px 0;
          width: 100%;
          outline: none;
          border-radius: 0;
          transition: border-color 0.2s;
        }
        .raw-input:focus {
          border-bottom-color: white;
        }
        .raw-input::placeholder {
          color: rgba(255,255,255,0.3);
        }
        .raw-btn {
          background: white;
          color: black;
          border: none;
          font-family: "Geist Mono:SemiBold", monospace;
          font-size: 16px;
          padding: 10px 24px;
          cursor: pointer;
          margin-top: 16px;
          width: 100%;
          transition: opacity 0.2s;
        }
        .raw-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
      
      <video
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260801_001207_ec20d138-aa45-4b2b-ab8c-bdc71607f240.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 1,
          zIndex: 0
        }}
      />

      {/* HEADER LOGO */}
      <div 
        className="header-logo-container"
        aria-label="LGPSM"
        style={{
          position: "absolute",
          top: 80,
          left: "50%",
          transform: "translateX(-50%)",
          width: 233,
          height: 40,
          zIndex: 10,
          display: "flex",
          alignItems: "center"
        }}
      >
        <svg viewBox="0 0 54 40" fill="none" aria-hidden="true" style={{ width: 54, height: 40, flexShrink: 0 }}>
          <path d="M38 0H26V12H38V0Z" fill="white"/>
          <path d="M54 12H38V28H54V12Z" fill="white"/>
          <path d="M38 28H26V40H38V28Z" fill="white"/>
          <path d="M26 12H16V22H26V12Z" fill="white"/>
          <path d="M16 22H8V30H16V22Z" fill="white"/>
          <path d="M16 2H6V12H16V2Z" fill="white"/>
          <path d="M6 12H0V18H6V12Z" fill="white"/>
        </svg>
        <svg viewBox="0 0 164.311 100" fill="none" aria-hidden="true" style={{ width: 164.311, height: 100, marginLeft: 14, flexShrink: 0 }}>
          <path d="M122.498 37.4573H131.321L139.533 51.6222L147.772 37.4573H156.595V56.0604H152.449V37.6433L141.739 56.0604H137.354L126.617 37.6433V56.0604H122.498V37.4573ZM95.921 48.8317C92.785 48.8317 90.261 46.307 90.261 43.1445C90.261 40.0086 92.785 37.4573 95.921 37.4573H119.972V41.6031H95.921C95.071 41.6031 94.38 42.2941 94.38 43.1445C94.38 44.0215 95.071 44.7125 95.921 44.7125H114.285C117.421 44.7125 119.972 47.2372 119.972 50.3997C119.972 53.5357 117.421 56.0604 114.285 56.0604H90.261V51.9411H114.285C115.136 51.9411 115.827 51.2501 115.827 50.3997C115.827 49.5227 115.136 48.8317 114.285 48.8317H95.921ZM80.857 37.4573C84.843 37.4573 88.086 40.6995 88.086 44.7125C88.086 48.6989 84.843 51.9411 80.857 51.9411H62.254V56.0604H58.135V37.4573H80.857ZM80.83 47.7953C82.558 47.7953 83.94 46.4133 83.94 44.7125C83.94 42.985 82.558 41.6031 80.83 41.6031H62.254V47.7953H80.83ZM35.975 41.6031C33.105 41.6031 30.7927 43.9152 30.7927 46.7588C30.7927 49.629 33.105 51.9411 35.975 51.9411H51.336V48.6989H35.576V44.5796H55.482V56.0604H35.975C30.8192 56.0604 26.6734 51.9145 26.6734 46.7588C26.6734 41.6297 30.8192 37.4573 35.975 37.4573H55.482V41.6031H35.975ZM0 56.0604V37.4573H4.1192V51.9411H24.9281V56.0604H0ZM164.311 36.4177C164.311 37.7529 163.228 38.8354 161.893 38.8354C160.558 38.8354 159.475 37.7529 159.475 36.4177C159.475 35.0824 160.558 34 161.893 34C163.228 34 164.311 35.0824 164.311 36.4177Z" fill="white"/>
        </svg>
      </div>

      <div 
        className="center-content geist-mono"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 483,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 44,
          zIndex: 10
        }}
      >
        <h1 
          className="kikar-heading text-gradient" 
          style={{ 
            margin: 0, 
            fontWeight: 600, 
            paddingBottom: 20 
          }}
        >
          KIKAR
        </h1>
        
        <div className="kikar-divider" style={{ width: 425, height: 1, background: "white" }} />
        
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24, alignItems: "center" }}>
          <p className="kikar-msg" style={{ margin: 0, color: "white", fontWeight: 600 }}>
            Clone real messaging styles into dynamic digital human replicas.
          </p>
          
          <form onSubmit={handleAuth} style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 8 }}>
              <button 
                type="button" 
                onClick={() => setAuthMode("login")}
                style={{ background: "none", border: "none", color: authMode === "login" ? "white" : "rgba(255,255,255,0.4)", fontFamily: "inherit", fontSize: 14, cursor: "pointer", fontWeight: 600, padding: 0 }}
              >Sign In</button>
              <button 
                type="button" 
                onClick={() => setAuthMode("signup")}
                style={{ background: "none", border: "none", color: authMode === "signup" ? "white" : "rgba(255,255,255,0.4)", fontFamily: "inherit", fontSize: 14, cursor: "pointer", fontWeight: 600, padding: 0 }}
              >Create Account</button>
            </div>
            <input 
              type="email" 
              placeholder="Email address" 
              className="raw-input" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="raw-input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
            {authError && <div style={{ color: "#ff4444", fontSize: 12, marginTop: 4 }}>{authError}</div>}
            <button type="submit" className="raw-btn" disabled={authLoading}>
              {authLoading ? "WAIT..." : authMode === "login" ? "ENTER" : "JOIN"}
            </button>
          </form>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, textAlign: "center", zIndex: 10 }}>
        <Link href="/privacy" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: 12, fontFamily: "'Geist Mono:SemiBold', monospace", textTransform: "uppercase", letterSpacing: 2 }}>
          Privacy Policy
        </Link>
      </div>
    </main>
  )
}