"use client"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://dhykgbrhfjdlkuyswmat.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoeWtnYnJoZmpkbGt1eXN3bWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MDkyOTIsImV4cCI6MjA5NTI4NTI5Mn0.gZz_lP56l4xNyFeESJDhtaXbQSksctgFGHr7zTttSQ0"
)

const EMOJIS = ["🤖", "🧙", "🦊", "🐉", "👾", "🧠", "🕵️", "🧜", "🦁", "🎭", "👻", "🤡", "🧛", "🦸", "🧝"]

export default function Home() {
  const [session, setSession] = useState<any>(null)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [generatingImg, setGeneratingImg] = useState(false)
  const [characters, setCharacters] = useState<any[]>([])
  const [activeChar, setActiveChar] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [charsLoading, setCharsLoading] = useState(true)

  const [conversations, setConversations] = useState<any[]>([])
  const [activeConvo, setActiveConvo] = useState<any>(null)
  const [directMessages, setDirectMessages] = useState<any[]>([])
  const [searchEmail, setSearchEmail] = useState("")
  const [searchResult, setSearchResult] = useState<any>(null)
  // "ai" | "people" — replaces the old "characters" | "people" view
  const [view, setView] = useState<"ai" | "people">("ai")

  const [showForm, setShowForm] = useState(false)
  const [newChar, setNewChar] = useState({ name: "", emoji: "🤖", personality: "", speakingStyle: "" })
  const [creating, setCreating] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])

  // Load conversations on login
  useEffect(() => {
    if (!session) return
    async function loadConversations() {
      const { data } = await supabase
        .from("conversations")
        .select(`*, user1:user1_id(id, email), user2:user2_id(id, email)`)
        .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
        .order("created_at", { ascending: false })
      setConversations(data || [])
    }
    loadConversations()
  }, [session])

  // Subscribe to direct messages
  useEffect(() => {
    if (!activeConvo) return
    async function loadDirectMessages() {
      const { data } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("conversation_id", activeConvo.id)
        .order("created_at", { ascending: true })
      setDirectMessages(data || [])
    }
    loadDirectMessages()
    const channel = supabase
      .channel(`convo-${activeConvo.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "direct_messages",
        filter: `conversation_id=eq.${activeConvo.id}`
      }, (payload) => {
        setDirectMessages(prev => [...prev, payload.new])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeConvo])

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  // Load all characters
  useEffect(() => {
    async function load() {
      setCharsLoading(true)
      const { data } = await supabase.from("characters").select("*").order("created_at", { ascending: false })
      setCharacters(data || [])
      setCharsLoading(false)
    }
    load()
  }, [session])

  // Load messages for active character
  useEffect(() => {
    if (!activeChar || !session) { setMessages([]); return }
    async function loadMessages() {
      const { data } = await supabase
        .from("messages").select("*")
        .eq("character_id", activeChar.id).eq("user_id", session.user.id)
        .order("created_at", { ascending: true })
      setMessages(data || [])
    }
    loadMessages()
  }, [activeChar, session])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, directMessages, loading])

  async function sendDirectMessage() {
    if (!input.trim() || !activeConvo || !session) return
    const msg = { conversation_id: activeConvo.id, sender_id: session.user.id, content: input }
    setInput("")
    await supabase.from("direct_messages").insert(msg)
  }

  async function searchUser() {
    if (!searchEmail.trim()) return
    const { data } = await supabase
      .from("profiles").select("*")
      .ilike("email", `%${searchEmail}%`)
      .neq("user_id", session.user.id).limit(5)
    setSearchResult(data?.[0] || null)
  }

  async function startConversation(otherUserId: string) {
    const { data: existing } = await supabase
      .from("conversations").select("*")
      .or(`and(user1_id.eq.${session.user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${session.user.id})`)
      .single()
    if (existing) { setActiveConvo(existing); return }
    const { data } = await supabase
      .from("conversations").insert({ user1_id: session.user.id, user2_id: otherUserId })
      .select().single()
    if (data) { setConversations(prev => [data, ...prev]); setActiveConvo(data) }
  }

  async function handleAuth() {
    setAuthError(""); setAuthLoading(true)
    const fn = authMode === "login"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password })
    const { error } = await fn
    if (error) setAuthError(error.message)
    setAuthLoading(false)
  }

  async function handleGenerateImage() {
    if (!input.trim() || !activeChar || !session) return
    setGeneratingImg(true)
    try {
      const data = await generateImage(input)
      const imageMsg = { role: "assistant", content: `[image]:${data.url}`, character_id: activeChar.id, user_id: session.user.id }
      await supabase.from("messages").insert(imageMsg)
      setMessages(prev => [...prev, { ...imageMsg, id: "temp-img" }])
    } finally { setGeneratingImg(false) }
  }

  async function sendMessage() {
    if (!input.trim() || !activeChar || loading || !session) return
    const userMsg = { role: "user", content: input, character_id: activeChar.id, user_id: session.user.id }
    setMessages(prev => [...prev, { ...userMsg, id: "temp-user" }])
    setInput(""); setLoading(true)
    await supabase.from("messages").insert(userMsg)
    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
    const res = await fetch("/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history, systemPrompt: activeChar.system_prompt })
    })
    const data = await res.json()
    const assistantMsg = { role: "assistant", content: data.reply, character_id: activeChar.id, user_id: session.user.id }
    await supabase.from("messages").insert(assistantMsg)
    setMessages(prev => [...prev.filter(m => m.id !== "temp-user"), { ...userMsg }, { ...assistantMsg, id: "temp-ai" }])
    setLoading(false)
  }

  async function generateImage(promptText: string) {
    const response = await fetch("/api/generate-image", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptText }),
    })
    if (!response.ok) throw new Error(`Server returned status: ${response.status}`)
    const text = await response.text()
    if (!text) throw new Error("Empty response body")
    return JSON.parse(text)
  }

  async function createCharacter() {
    if (!newChar.name.trim() || !newChar.personality.trim() || !session) return
    setCreating(true)
    const system_prompt = `You are ${newChar.name}. ${newChar.personality}.${newChar.speakingStyle ? " Speaking style: " + newChar.speakingStyle + "." : ""} Keep replies under 100 words. Never break character.`
    const { data, error } = await supabase.from("characters").insert({
      name: newChar.name, emoji: newChar.emoji, system_prompt, created_by: session.user.id
    }).select().single()
    if (!error && data) {
      setCharacters(prev => [data, ...prev])
      setActiveChar(data); setMessages([])
    }
    setNewChar({ name: "", emoji: "🤖", personality: "", speakingStyle: "" })
    setShowForm(false); setCreating(false)
  }

  
async function loadConversations() {
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      *,
      user1:user1_id(id, email),
      user2:user2_id(id, email)
    `)
    .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
    .order("created_at", { ascending: false })

  console.log("convos error:", error)  // ← add this to see exact error
  setConversations(data || [])
}


  async function deleteCharacter(id: string) {
    await supabase.from("characters").delete().eq("id", id)
    setCharacters(prev => prev.filter(c => c.id !== id))
    if (activeChar?.id === id) { setActiveChar(null); setMessages([]) }
  }

  // ── AUTH SCREEN ──────────────────────────────────────────────
  if (!session) return (
    <div style={s.authWrap}>
      <div style={s.authCard}>
        <div style={s.authLogo}>🤖</div>
        <h1 style={s.authTitle}>CharacterChat</h1>
        <p style={s.authSub}>Talk to AI personas. Build your own.</p>
        <div style={s.authTabRow}>
          {(["login", "signup"] as const).map(m => (
            <button key={m} onClick={() => { setAuthMode(m); setAuthError("") }}
              style={{ ...s.authTab, ...(authMode === m ? s.authTabActive : {}) }}>
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>
        <input style={s.authInput} placeholder="Email" type="email"
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAuth()} />
        <input style={s.authInput} placeholder="Password" type="password"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAuth()} />
        {authError && <p style={s.authError}>{authError}</p>}
        {authMode === "signup" && <p style={s.authHint}>Check your email to confirm after signing up.</p>}
        <button style={s.authBtn} onClick={handleAuth} disabled={authLoading}>
          {authLoading ? "..." : authMode === "login" ? "Sign In" : "Create Account"}
        </button>
      </div>
    </div>
  )

  // ── MAIN APP ─────────────────────────────────────────────────
  return (
    <div style={s.app}>

      {/* ── SIDEBAR ── */}
      <aside style={s.sidebar}>

        {isMobile ? (
          /* ── MOBILE LAYOUT ── */
          <>
            <div style={s.mobileTopbar}>
              <span style={s.brand}>🤖 CharacterChat</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={s.userEmailSmall}>{session.user.email?.split("@")[0]}</span>
                <button style={s.signOutBtn} onClick={() => supabase.auth.signOut()}>Out</button>
              </div>
            </div>
            {/* Mobile tabs */}
            <div style={s.mobileTabs}>
              <button style={{ ...s.mobileTab, ...(view === "ai" ? s.mobileTabActive : {}) }}
                onClick={() => { setView("ai"); setActiveConvo(null) }}>🤖 AI</button>
              <button style={{ ...s.mobileTab, ...(view === "people" ? s.mobileTabActive : {}) }}
                onClick={() => { setView("people"); setActiveChar(null); setShowForm(false) }}>👥 People</button>
            </div>
            {view === "ai" ? (
              <div style={s.charStrip}>
                {characters.map(c => (
                  <div key={c.id}
                    style={{ ...s.charPill, ...(activeChar?.id === c.id ? s.charPillActive : {}) }}
                    onClick={() => { setActiveChar(c); setShowForm(false) }}>
                    <span>{c.emoji}</span>
                    <span style={s.charPillName}>{c.name}</span>
                    {c.created_by === session.user.id && (
                      <button style={s.delBtn} onClick={e => { e.stopPropagation(); deleteCharacter(c.id) }}>✕</button>
                    )}
                  </div>
                ))}
                <button style={s.newPillBtn} onClick={() => { setShowForm(true); setActiveChar(null) }}>+ New</button>
              </div>
            ) : (
              <div style={s.charStrip}>
                {conversations.map(c => {
                  const other = c.user1_id === session.user.id ? c.user2 : c.user1
                  return (
                    <div key={c.id}
                      style={{ ...s.charPill, ...(activeConvo?.id === c.id ? s.charPillActive : {}) }}
                      onClick={() => setActiveConvo(c)}>
                      <span>👤</span>
                      <span style={s.charPillName}>{other?.email?.split("@")[0]}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          /* ── DESKTOP LAYOUT ── */
          <>
            {/* Top bar */}
            <div style={s.sideTop}>
              <span style={s.brand}>🤖 CharacterChat</span>
              <button style={s.signOutBtn} onClick={() => supabase.auth.signOut()}>Out</button>
            </div>

            {/* AI / People tabs — directly below top bar */}
            <div style={s.tabBar}>
              <button
                style={{ ...s.tabBtn, ...(view === "ai" ? s.tabBtnActive : {}) }}
                onClick={() => { setView("ai"); setActiveConvo(null) }}>
                🤖 AI Characters
              </button>
              <button
                style={{ ...s.tabBtn, ...(view === "people" ? s.tabBtnActive : {}) }}
                onClick={() => { setView("people"); setActiveChar(null); setShowForm(false) }}>
                👥 People
              </button>
            </div>

            {/* AI tab content */}
            {view === "ai" ? (
              <div style={s.listWrap}>
                {/* New Character button — always visible at top of AI list */}
                <button style={s.newCharBtn} onClick={() => { setShowForm(true); setActiveChar(null) }}>
                  + New Character
                </button>
                <div style={s.charList}>
                  {charsLoading ? (
                    <p style={s.dimText}>Loading…</p>
                  ) : characters.map(c => (
                    <div key={c.id}
                      style={{ ...s.charItem, ...(activeChar?.id === c.id && !showForm ? s.charItemActive : {}) }}
                      onClick={() => { setActiveChar(c); setShowForm(false) }}>
                      <span style={s.charEmoji}>{c.emoji}</span>
                      <span style={s.charName}>{c.name}</span>
                      {c.created_by === session.user.id && (
                        <button style={s.delBtn}
                          onClick={e => { e.stopPropagation(); deleteCharacter(c.id) }}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* People tab content */
              <div style={s.listWrap}>
                <div style={s.searchRow}>
                  <input style={s.searchInput}
                    placeholder="Search by username…"
                    value={searchEmail}
                    onChange={e => setSearchEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && searchUser()} />
                  <button style={s.searchBtn} onClick={searchUser}>→</button>
                </div>
                {searchResult && (
                  <div style={s.charItem} onClick={() => startConversation(searchResult.user_id)}>
                    <span style={s.charEmoji}>👤</span>
                    <div>
                      <span style={s.charName}>{searchResult.display_name}</span>
                      <span style={s.emailHint}>{searchResult.email}</span>
                    </div>
                  </div>
                )}
                <div style={s.charList}>
                  {conversations.map(c => {
                    const other = c.user1_id === session.user.id ? c.user2 : c.user1
                    return (
                      <div key={c.id}
                        style={{ ...s.charItem, ...(activeConvo?.id === c.id ? s.charItemActive : {}) }}
                        onClick={() => setActiveConvo(c)}>
                        <span style={s.charEmoji}>👤</span>
                        <span style={s.charName}>{other?.email?.split("@")[0]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <p style={s.userEmail}>{session.user.email}</p>
          </>
        )}
      </aside>

      {/* ── MAIN ── */}
      <main style={s.main}>

        {/* People view — active DM */}
        {view === "people" && activeConvo ? (
          <div style={s.chatWrap}>
            <div style={s.chatHeader}>
              <span style={{ fontSize: 28 }}>👤</span>
              <div>
                <div style={s.chatName}>
                  {activeConvo.user1_id === session.user.id
                    ? activeConvo.user2?.email?.split("@")[0]
                    : activeConvo.user1?.email?.split("@")[0]}
                </div>
                <div style={s.chatSub}>Online</div>
              </div>
            </div>
            <div style={s.messages}>
              {directMessages.map((m, i) => (
                <div key={i} style={{
                  ...s.bubble,
                  ...(m.sender_id === session.user.id ? s.bubbleUser : s.bubbleAI)
                }}>
                  {m.content}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div style={s.inputRow}>
              <input style={s.chatInput}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendDirectMessage()}
                placeholder="Type a message…" />
              <button style={s.sendBtn} onClick={sendDirectMessage} disabled={!input.trim()}>↑</button>
            </div>
          </div>

        ) : view === "people" && !activeConvo ? (
          /* People tab, no convo selected */
          <div style={s.empty}>
            <div style={s.emptyIcon}>👥</div>
            <p style={s.emptyText}>Search for someone above,<br />or select an existing conversation.</p>
          </div>

        ) : showForm ? (
          /* Create character form */
          <div style={s.formWrap}>
            <h2 style={s.formTitle}>Create a Character</h2>
            <label style={s.label}>Name</label>
            <input style={s.input} placeholder="e.g. Socrates"
              value={newChar.name} onChange={e => setNewChar({ ...newChar, name: e.target.value })} />
            <label style={s.label}>Pick an Emoji</label>
            <div style={s.emojiGrid}>
              {EMOJIS.map(em => (
                <button key={em}
                  style={{ ...s.emojiBtn, ...(newChar.emoji === em ? s.emojiBtnActive : {}) }}
                  onClick={() => setNewChar({ ...newChar, emoji: em })}>{em}</button>
              ))}
            </div>
            <label style={s.label}>Personality *</label>
            <textarea style={s.textarea} rows={3}
              placeholder="e.g. A wise Athenian philosopher who questions everything"
              value={newChar.personality} onChange={e => setNewChar({ ...newChar, personality: e.target.value })} />
            <label style={s.label}>Speaking Style (optional)</label>
            <input style={s.input} placeholder="e.g. Uses rhetorical questions, formal and measured tone"
              value={newChar.speakingStyle} onChange={e => setNewChar({ ...newChar, speakingStyle: e.target.value })} />
            <div style={s.formBtns}>
              <button style={s.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={s.createBtn} onClick={createCharacter} disabled={creating}>
                {creating ? "Creating…" : "Create & Chat"}
              </button>
            </div>
          </div>

        ) : !activeChar ? (
          /* AI tab, nothing selected */
          <div style={s.empty}>
            <div style={s.emptyIcon}>💬</div>
            <p style={s.emptyText}>Select a character to start chatting,<br />or create your own.</p>
            <button style={s.createBtn} onClick={() => setShowForm(true)}>+ New Character</button>
          </div>

        ) : (
          /* AI chat */
          <div style={s.chatWrap}>
            <div style={s.chatHeader}>
              <span style={{ fontSize: 28 }}>{activeChar.emoji}</span>
              <div>
                <div style={s.chatName}>{activeChar.name}</div>
                <div style={s.chatSub}>AI · your chat is private</div>
              </div>
            </div>
            <div style={s.messages}>
              {messages.length === 0 && (
                <p style={s.dimText}>Start the conversation with {activeChar.name}…</p>
              )}
              {messages.map((m, i) => {
                const isImage = m.content?.startsWith("[image]:")
                const imageUrl = isImage ? m.content.replace("[image]:", "") : null
                return (
                  <div key={m.id ?? i} style={{ ...s.bubble, ...(m.role === "user" ? s.bubbleUser : s.bubbleAI) }}>
                    {isImage ? (
                      <img src={imageUrl} style={{ width: "100%", maxWidth: 260, borderRadius: 10, display: "block" }} />
                    ) : m.content}
                  </div>
                )
              })}
              {loading && (
                <div style={{ ...s.bubble, ...s.bubbleAI, opacity: 0.5 }}>
                  <span style={s.typing}>●●●</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div style={s.inputRow}>
              <input style={s.chatInput}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder={`Message ${activeChar.name}…`} />
              <button style={s.imgBtn} onClick={handleGenerateImage} disabled={!input.trim() || generatingImg}>
                {generatingImg ? "⏳" : "🖼️"}
              </button>
              <button style={s.sendBtn} onClick={sendMessage} disabled={loading || !input.trim()}>↑</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ── STYLES ────────────────────────────────────────────────────
const WA = {
  bg: "#111b21",
  surface: "#202c33",
  surfaceAlt: "#2a3942",
  border: "#2a3942",
  green: "#00a884",
  greenDark: "#005c4b",
  textPrimary: "#e9edef",
  textMuted: "#8696a0",
  bubbleIn: "#202c33",
}

const s: Record<string, React.CSSProperties> = {
  // ── Auth
  authWrap: { minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: WA.bg, fontFamily: "-apple-system, 'Segoe UI', sans-serif", padding: 16 },
  authCard: { background: WA.surface, border: `1px solid ${WA.border}`, borderRadius: 16, padding: "40px 28px", width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 12 },
  authLogo: { fontSize: 40, textAlign: "center" },
  authTitle: { margin: 0, textAlign: "center", fontSize: 22, color: WA.textPrimary, fontWeight: 700 },
  authSub: { margin: 0, textAlign: "center", color: WA.textMuted, fontSize: 14 },
  authTabRow: { display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${WA.border}` },
  authTab: { flex: 1, padding: "10px 0", background: "transparent", border: "none", color: WA.textMuted, cursor: "pointer", fontSize: 14 },
  authTabActive: { background: WA.surfaceAlt, color: WA.textPrimary, fontWeight: 600 },
  authInput: { width: "100%", padding: "11px 14px", background: WA.surfaceAlt, border: `1px solid ${WA.border}`, borderRadius: 10, color: WA.textPrimary, fontSize: 15, outline: "none", boxSizing: "border-box" },
  authBtn: { padding: "14px 0", background: WA.green, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer", color: WA.bg, marginTop: 4 },
  authError: { color: "#ff6b6b", fontSize: 13, margin: 0 },
  authHint: { color: WA.textMuted, fontSize: 12, margin: 0 },

  // ── App shell
  app: { display: "flex", height: "100dvh", background: WA.bg, fontFamily: "-apple-system, 'Segoe UI', sans-serif", color: WA.textPrimary, flexDirection: "row" as const },
  main: { flex: 1, display: "flex", flexDirection: "column" as const, overflow: "hidden", background: "#0b141a" },

  // ── Sidebar
  sidebar: { width: 340, flexShrink: 0, display: "flex", flexDirection: "column" as const, background: WA.bg, borderRight: `1px solid ${WA.border}` },
  sideTop: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: WA.surface, flexShrink: 0 },
  brand: { fontWeight: 700, fontSize: 15, color: WA.textPrimary },
  signOutBtn: { background: WA.surfaceAlt, border: `1px solid ${WA.border}`, color: WA.textMuted, fontSize: 12, borderRadius: 6, padding: "4px 10px", cursor: "pointer" },

  // ── Desktop tabs (AI / People)
  tabBar: { display: "flex", borderBottom: `1px solid ${WA.border}`, flexShrink: 0 },
  tabBtn: { flex: 1, padding: "11px 0", background: "transparent", border: "none", borderBottom: "2px solid transparent", color: WA.textMuted, fontSize: 13, fontWeight: 500, cursor: "pointer" },
  tabBtnActive: { color: WA.green, borderBottomColor: WA.green },

  // ── List area (scrollable, includes new btn)
  listWrap: { flex: 1, display: "flex", flexDirection: "column" as const, overflow: "hidden" },
  newCharBtn: { margin: "10px 12px 4px", padding: "10px 0", background: "transparent", border: `1px dashed ${WA.green}55`, borderRadius: 8, color: WA.green, fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 },
  charList: { flex: 1, overflowY: "auto" as const, display: "flex", flexDirection: "column" as const },
  charItem: { display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", cursor: "pointer", borderBottom: `1px solid ${WA.border}22` },
  charItemActive: { background: WA.surfaceAlt },
  charEmoji: { fontSize: 22, flexShrink: 0 },
  charName: { fontSize: 14, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, color: WA.textPrimary },
  delBtn: { background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: 12, padding: "2px 6px", flexShrink: 0 },
  userEmail: { fontSize: 11, color: "#444", padding: "8px 16px", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  userEmailSmall: { fontSize: 11, color: WA.textMuted },

  // ── People search
  searchRow: { display: "flex", gap: 6, padding: "10px 12px", flexShrink: 0 },
  searchInput: { flex: 1, padding: "9px 12px", background: WA.surface, border: `1px solid ${WA.border}`, borderRadius: 8, color: WA.textPrimary, fontSize: 13, outline: "none" },
  searchBtn: { width: 36, height: 36, background: WA.green, border: "none", borderRadius: 8, color: WA.bg, fontWeight: 700, cursor: "pointer", fontSize: 16, flexShrink: 0 },
  emailHint: { fontSize: 11, color: WA.textMuted, display: "block" },

  // ── Mobile topbar + tabs + strip
  mobileTopbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: WA.surface, borderBottom: `1px solid ${WA.border}` },
  mobileTabs: { display: "flex", borderBottom: `1px solid ${WA.border}` },
  mobileTab: { flex: 1, padding: "9px 0", background: "transparent", border: "none", borderBottom: "2px solid transparent", color: WA.textMuted, fontSize: 13, cursor: "pointer" },
  mobileTabActive: { color: WA.green, borderBottomColor: WA.green },
  charStrip: { display: "flex", gap: 8, padding: "8px 10px", overflowX: "auto" as const, background: WA.bg, borderBottom: `1px solid ${WA.border}` },
  charPill: { display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: WA.surface, border: `1px solid ${WA.border}`, borderRadius: 20, whiteSpace: "nowrap" as const, cursor: "pointer", fontSize: 13, flexShrink: 0, color: WA.textPrimary },
  charPillActive: { borderColor: WA.green, color: WA.green },
  charPillName: { maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis" },
  newPillBtn: { display: "flex", alignItems: "center", padding: "6px 12px", background: "transparent", border: `1px dashed ${WA.green}55`, borderRadius: 20, color: WA.green, fontSize: 13, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" as const },

  // ── Chat
  chatWrap: { display: "flex", flexDirection: "column" as const, flex: 1, overflow: "hidden" },
  chatHeader: { display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: WA.surface, borderBottom: `1px solid ${WA.border}`, flexShrink: 0 },
  chatName: { fontSize: 15, fontWeight: 600, color: WA.textPrimary },
  chatSub: { fontSize: 11, color: WA.textMuted },
  messages: { flex: 1, overflowY: "auto" as const, padding: "14px 10%", display: "flex", flexDirection: "column" as const, gap: 4 },
  bubble: { maxWidth: "65%", padding: "8px 12px", borderRadius: 8, lineHeight: 1.5, fontSize: 14, wordBreak: "break-word" as const },
  bubbleUser: { background: WA.greenDark, color: WA.textPrimary, alignSelf: "flex-end", borderTopRightRadius: 0 },
  bubbleAI: { background: WA.bubbleIn, color: WA.textPrimary, alignSelf: "flex-start", borderTopLeftRadius: 0 },
  inputRow: { display: "flex", gap: 8, padding: "8px 12px", background: WA.surface, borderTop: `1px solid ${WA.border}`, flexShrink: 0, paddingBottom: "max(8px, env(safe-area-inset-bottom))" },
  chatInput: { flex: 1, padding: "10px 16px", background: WA.surfaceAlt, border: "none", borderRadius: 24, color: WA.textPrimary, fontSize: 15, outline: "none" },
  sendBtn: { width: 44, height: 44, borderRadius: "50%", background: WA.green, border: "none", fontSize: 20, cursor: "pointer", color: WA.bg, fontWeight: 700, flexShrink: 0 },
  imgBtn: { width: 44, height: 44, borderRadius: "50%", background: WA.surfaceAlt, border: `1px solid ${WA.border}`, fontSize: 18, cursor: "pointer", flexShrink: 0 },

  // ── Empty / form states
  empty: { flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: WA.textMuted, fontSize: 15, textAlign: "center", lineHeight: 1.6 },
  formWrap: { flex: 1, overflowY: "auto" as const, padding: 24 },
  formTitle: { fontSize: 18, fontWeight: 700, color: WA.textPrimary, marginBottom: 16 },
  label: { fontSize: 12, color: WA.textMuted, display: "block", marginBottom: 4, marginTop: 14, textTransform: "uppercase" as const, letterSpacing: "0.5px" },
  input: { width: "100%", padding: "11px 14px", background: WA.surface, border: `1px solid ${WA.border}`, borderRadius: 10, color: WA.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box" as const },
  textarea: { width: "100%", padding: "11px 14px", background: WA.surface, border: `1px solid ${WA.border}`, borderRadius: 10, color: WA.textPrimary, fontSize: 14, outline: "none", resize: "vertical" as const, boxSizing: "border-box" as const },
  emojiGrid: { display: "flex", flexWrap: "wrap" as const, gap: 8, marginTop: 4 },
  emojiBtn: { fontSize: 22, padding: 8, background: WA.surface, border: `1px solid ${WA.border}`, borderRadius: 8, cursor: "pointer" },
  emojiBtnActive: { borderColor: WA.green, background: `${WA.green}18` },
  formBtns: { display: "flex", gap: 10, marginTop: 24 },
  cancelBtn: { flex: 1, padding: "12px 0", background: "transparent", border: `1px solid ${WA.border}`, borderRadius: 8, color: WA.textMuted, fontSize: 14, cursor: "pointer" },
  createBtn: { flex: 2, padding: "12px 0", background: WA.green, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", color: WA.bg },
  dimText: { color: WA.textMuted, fontSize: 14, padding: "20px 16px" },
  typing: { letterSpacing: 2, color: WA.textMuted },
}
