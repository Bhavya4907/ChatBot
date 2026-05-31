"use client"
import { useState } from "react"
import { supabase } from "../lib/supabase"
import { S, WA } from "../styles"

export default function AuthScreen() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState("")
  const [authLoading, setAuthLoading] = useState(false)

  async function handleAuth() {
    setAuthError(""); setAuthLoading(true)
    const { error } = await (authMode === "login"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password }))
    if (error) setAuthError(error.message)
    setAuthLoading(false)
  }

  return (
    <div style={S.authWrap}>
      <div style={S.authCard}>
        <div style={{ fontSize: 40, textAlign: "center" }}>🤖</div>
        <h1 style={S.authTitle}>CharacterChat</h1>
        <p style={S.authSub}>Talk to AI personas. Build your own.</p>
        <div style={S.authTabRow}>
          {(["login", "signup"] as const).map(m => (
            <button key={m}
              onClick={() => { setAuthMode(m); setAuthError("") }}
              style={{ ...S.authTab, ...(authMode === m ? S.authTabActive : {}) }}>
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>
        <input style={S.authInput} placeholder="Email" type="email"
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAuth()} />
        <input style={S.authInput} placeholder="Password" type="password"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAuth()} />
        {authError && (
          <p style={{ color: "#ff6b6b", fontSize: 13, margin: 0 }}>{authError}</p>
        )}
        {authMode === "signup" && (
          <p style={{ color: WA.textMuted, fontSize: 12, margin: 0 }}>
            Check your email to confirm after signing up.
          </p>
        )}
        <button style={S.authBtn} onClick={handleAuth} disabled={authLoading}>
          {authLoading ? "..." : authMode === "login" ? "Sign In" : "Create Account"}
        </button>
      </div>
    </div>
  )
}