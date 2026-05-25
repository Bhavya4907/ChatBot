"use client"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://dhykgbrhfjdlkuyswmat.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoeWtnYnJoZmpkbGt1eXN3bWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MDkyOTIsImV4cCI6MjA5NTI4NTI5Mn0.gZz_lP56l4xNyFeESJDhtaXbQSksctgFGHr7zTttSQ0"
)

const EMOJIS = ["🤖","🧙","🦊","🐉","👾","🧠","🕵️","🧜","🦁","🎭","👻","🤡","🧛","🦸","🧝"]

export default function Home() {
  const [session, setSession] = useState<any>(null)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState("")
  const [authLoading, setAuthLoading] = useState(false)

  const [characters, setCharacters] = useState<any[]>([])
  const [activeChar, setActiveChar] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [charsLoading, setCharsLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [newChar, setNewChar] = useState({ name: "", emoji: "🤖", personality: "", speakingStyle: "" })
  const [creating, setCreating] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  // Load all characters (shared)
  useEffect(() => {
    async function load() {
      setCharsLoading(true)
      const { data } = await supabase
        .from("characters")
        .select("*")
        .order("created_at", { ascending: false })
      setCharacters(data || [])
      setCharsLoading(false)
    }
    load()
  }, [session])

  // Load messages for active character (private)
  useEffect(() => {
    if (!activeChar || !session) { setMessages([]); return }
    async function loadMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("character_id", activeChar.id)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: true })
      setMessages(data || [])
    }
    loadMessages()
  }, [activeChar, session])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function handleAuth() {
    setAuthError("")
    setAuthLoading(true)
    const fn = authMode === "login"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password })
    const { error } = await fn
    if (error) setAuthError(error.message)
    setAuthLoading(false)
  }

  async function sendMessage() {
    if (!input.trim() || !activeChar || loading || !session) return
    const userMsg = { role: "user", content: input, character_id: activeChar.id, user_id: session.user.id }
    setMessages(prev => [...prev, { ...userMsg, id: "temp-user" }])
    setInput("")
    setLoading(true)

    // Save user message
    await supabase.from("messages").insert(userMsg)

    // Call your existing API route
    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history, systemPrompt: activeChar.system_prompt })
    })
    const data = await res.json()
    const assistantMsg = { role: "assistant", content: data.reply, character_id: activeChar.id, user_id: session.user.id }

    // Save assistant message
    await supabase.from("messages").insert(assistantMsg)
    setMessages(prev => [...prev.filter(m => m.id !== "temp-user"), { ...userMsg }, { ...assistantMsg, id: "temp-ai" }])
    setLoading(false)
  }

  async function createCharacter() {
    if (!newChar.name.trim() || !newChar.personality.trim() || !session) return
    setCreating(true)
    const system_prompt = `You are ${newChar.name}. ${newChar.personality}.${newChar.speakingStyle ? " Speaking style: " + newChar.speakingStyle + "." : ""} Keep replies under 100 words. Never break character.`
    const { data, error } = await supabase.from("characters").insert({
      name: newChar.name,
      emoji: newChar.emoji,
      system_prompt,
      created_by: session.user.id
    }).select().single()
    if (!error && data) {
      setCharacters(prev => [data, ...prev])
      setActiveChar(data)
      setMessages([])
    }
    setNewChar({ name: "", emoji: "🤖", personality: "", speakingStyle: "" })
    setShowForm(false)
    setCreating(false)
  }

  async function deleteCharacter(id: string) {
    await supabase.from("characters").delete().eq("id", id)
    setCharacters(prev => prev.filter(c => c.id !== id))
    if (activeChar?.id === id) { setActiveChar(null); setMessages([]) }
  }

  // ── AUTH SCREEN ──────────────────────────────────────────────
  if (!session) return (
    <div style={styles.authWrap}>
      <div style={styles.authCard}>
        <div style={styles.authLogo}>🤖</div>
        <h1 style={styles.authTitle}>CharacterChat</h1>
        <p style={styles.authSub}>Talk to AI personas. Build your own.</p>

        <div style={styles.tabRow}>
          {(["login","signup"] as const).map(m => (
            <button key={m} onClick={() => { setAuthMode(m); setAuthError("") }}
              style={{ ...styles.tab, ...(authMode === m ? styles.tabActive : {}) }}>
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <input style={styles.input} placeholder="Email" type="email"
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAuth()} />
        <input style={styles.input} placeholder="Password" type="password"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAuth()} />

        {authError && <p style={styles.error}>{authError}</p>}
        {authMode === "signup" && <p style={styles.hint}>Check your email to confirm after signing up.</p>}

        <button style={styles.authBtn} onClick={handleAuth} disabled={authLoading}>
          {authLoading ? "..." : authMode === "login" ? "Sign In" : "Create Account"}
        </button>
      </div>
    </div>
  )

  // ── MAIN APP ─────────────────────────────────────────────────
  return (
    <div style={styles.app}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sideTop}>
          <span style={styles.brand}>🤖 CharacterChat</span>
          <button style={styles.signOutBtn} onClick={() => supabase.auth.signOut()}>Out</button>
        </div>

        <button style={styles.newBtn} onClick={() => setShowForm(true)}>+ New Character</button>

        <div style={styles.charList}>
          {charsLoading ? (
            <p style={styles.dimText}>Loading…</p>
          ) : characters.length === 0 ? (
            <p style={styles.dimText}>No characters yet. Create one!</p>
          ) : characters.map(c => (
            <div key={c.id}
              style={{ ...styles.charItem, ...(activeChar?.id === c.id ? styles.charItemActive : {}) }}
              onClick={() => { setActiveChar(c) }}>
              <span style={styles.charEmoji}>{c.emoji}</span>
              <span style={styles.charName}>{c.name}</span>
              {c.created_by === session.user.id && (
                <button style={styles.delBtn}
                  onClick={e => { e.stopPropagation(); deleteCharacter(c.id) }}>✕</button>
              )}
            </div>
          ))}
        </div>

        <p style={styles.userEmail}>{session.user.email}</p>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        {showForm ? (
          <div style={styles.formWrap}>
            <h2 style={styles.formTitle}>Create a Character</h2>

            <label style={styles.label}>Name</label>
            <input style={styles.input} placeholder="e.g. Socrates"
              value={newChar.name} onChange={e => setNewChar({ ...newChar, name: e.target.value })} />

            <label style={styles.label}>Pick an Emoji</label>
            <div style={styles.emojiGrid}>
              {EMOJIS.map(em => (
                <button key={em} style={{ ...styles.emojiBtn, ...(newChar.emoji === em ? styles.emojiBtnActive : {}) }}
                  onClick={() => setNewChar({ ...newChar, emoji: em })}>{em}</button>
              ))}
            </div>

            <label style={styles.label}>Personality *</label>
            <textarea style={styles.textarea} rows={3}
              placeholder="e.g. A wise ancient Greek philosopher who questions everything through Socratic dialogue"
              value={newChar.personality} onChange={e => setNewChar({ ...newChar, personality: e.target.value })} />

            <label style={styles.label}>Speaking Style (optional)</label>
            <input style={styles.input} placeholder="e.g. Uses rhetorical questions, formal and measured tone"
              value={newChar.speakingStyle} onChange={e => setNewChar({ ...newChar, speakingStyle: e.target.value })} />

            <div style={styles.formBtns}>
              <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={styles.createBtn} onClick={createCharacter} disabled={creating}>
                {creating ? "Creating…" : "Create & Chat"}
              </button>
            </div>
          </div>
        ) : !activeChar ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>💬</div>
            <p style={styles.emptyText}>Select a character to start chatting,<br />or create your own.</p>
            <button style={styles.createBtn} onClick={() => setShowForm(true)}>+ New Character</button>
          </div>
        ) : (
          <div style={styles.chatWrap}>
            <div style={styles.chatHeader}>
              <span style={{ fontSize: 28 }}>{activeChar.emoji}</span>
              <div>
                <div style={styles.chatName}>{activeChar.name}</div>
                <div style={styles.chatSub}>Your chat is private</div>
              </div>
            </div>

            <div style={styles.messages}>
              {messages.length === 0 && (
                <p style={styles.dimText}>Start the conversation with {activeChar.name}…</p>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{ ...styles.bubble, ...(m.role === "user" ? styles.bubbleUser : styles.bubbleAI) }}>
                  {m.content}
                </div>
              ))}
              {loading && (
                <div style={{ ...styles.bubble, ...styles.bubbleAI, opacity: 0.5 }}>
                  <span style={styles.typing}>●●●</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div style={styles.inputRow}>
              <input style={styles.chatInput}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder={`Message ${activeChar.name}…`}
              />
              <button style={styles.sendBtn} onClick={sendMessage} disabled={loading || !input.trim()}>
                ↑
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ── STYLES ────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  // Auth
  authWrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0f0f", fontFamily: "'Georgia', serif" },
  authCard: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 16, padding: "40px 36px", width: 380, display: "flex", flexDirection: "column", gap: 12 },
  authLogo: { fontSize: 40, textAlign: "center" },
  authTitle: { margin: 0, textAlign: "center", fontSize: 24, color: "#f5f5f5", fontWeight: 700 },
  authSub: { margin: 0, textAlign: "center", color: "#666", fontSize: 14 },
  tabRow: { display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid #2a2a2a" },
  tab: { flex: 1, padding: "10px 0", background: "transparent", border: "none", color: "#888", cursor: "pointer", fontSize: 14 },
  tabActive: { background: "#2a2a2a", color: "#f5f5f5", fontWeight: 600 },
  authBtn: { padding: "12px 0", background: "#e8ff00", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer", color: "#0f0f0f", marginTop: 4 },
  error: { color: "#ff6b6b", fontSize: 13, margin: 0 },
  hint: { color: "#888", fontSize: 12, margin: 0 },

  // Layout
  app: { display: "flex", height: "100vh", background: "#0f0f0f", fontFamily: "'Georgia', serif", color: "#f0f0f0" },

  // Sidebar
  sidebar: { width: 260, background: "#141414", borderRight: "1px solid #1e1e1e", display: "flex", flexDirection: "column", padding: 16, gap: 12, overflowY: "auto" },
  sideTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  brand: { fontWeight: 700, fontSize: 15, color: "#f0f0f0" },
  signOutBtn: { fontSize: 12, background: "transparent", border: "1px solid #333", color: "#888", borderRadius: 6, padding: "4px 10px", cursor: "pointer" },
  newBtn: { background: "#e8ff00", color: "#0f0f0f", border: "none", borderRadius: 8, padding: "10px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  charList: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  charItem: { display: "flex", alignItems: "center", gap: 8, padding: "10px 10px", borderRadius: 8, cursor: "pointer", transition: "background 0.15s" },
  charItemActive: { background: "#222" },
  charEmoji: { fontSize: 20, flexShrink: 0 },
  charName: { flex: 1, fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  delBtn: { background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: 12, padding: "2px 4px", flexShrink: 0 },
  userEmail: { fontSize: 11, color: "#444", margin: 0, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },

  // Main
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  empty: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 },
  emptyIcon: { fontSize: 56 },
  emptyText: { color: "#555", textAlign: "center", lineHeight: 1.8, fontSize: 15 },

  // Create form
  formWrap: { flex: 1, overflowY: "auto", padding: "40px 48px", maxWidth: 560, width: "100%" },
  formTitle: { fontSize: 22, fontWeight: 700, marginBottom: 24, color: "#f0f0f0" },
  label: { display: "block", fontSize: 12, color: "#888", marginBottom: 6, marginTop: 16, textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { width: "100%", padding: "10px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#f0f0f0", fontSize: 14, outline: "none", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "10px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#f0f0f0", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "Georgia, serif" },
  emojiGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  emojiBtn: { fontSize: 22, background: "#1a1a1a", border: "2px solid transparent", borderRadius: 8, padding: "6px 10px", cursor: "pointer" },
  emojiBtnActive: { borderColor: "#e8ff00" },
  formBtns: { display: "flex", gap: 12, marginTop: 28 },
  cancelBtn: { flex: 1, padding: "12px 0", background: "transparent", border: "1px solid #333", borderRadius: 8, color: "#888", cursor: "pointer", fontSize: 14 },
  createBtn: { flex: 2, padding: "12px 0", background: "#e8ff00", border: "none", borderRadius: 8, fontWeight: 700, color: "#0f0f0f", cursor: "pointer", fontSize: 14 },

  // Chat
  chatWrap: { flex: 1, display: "flex", flexDirection: "column", height: "100%" },
  chatHeader: { display: "flex", alignItems: "center", gap: 14, padding: "16px 24px", borderBottom: "1px solid #1e1e1e" },
  chatName: { fontWeight: 700, fontSize: 18 },
  chatSub: { fontSize: 12, color: "#555" },
  messages: { flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 12 },
  bubble: { maxWidth: "70%", padding: "12px 16px", borderRadius: 14, lineHeight: 1.6, fontSize: 15 },
  bubbleUser: { background: "#e8ff00", color: "#0f0f0f", alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleAI: { background: "#1e1e1e", color: "#e8e8e8", alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  typing: { letterSpacing: 4 },
  inputRow: { display: "flex", gap: 10, padding: "16px 24px", borderTop: "1px solid #1e1e1e" },
  chatInput: { flex: 1, padding: "12px 16px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 24, color: "#f0f0f0", fontSize: 15, outline: "none" },
  sendBtn: { width: 44, height: 44, borderRadius: "50%", background: "#e8ff00", border: "none", fontSize: 18, cursor: "pointer", color: "#0f0f0f", fontWeight: 700, flexShrink: 0 },

  dimText: { color: "#444", fontSize: 14 },
}