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
  const [view, setView] = useState<"characters" | "people">("characters")

  const [showForm, setShowForm] = useState(false)
  const [newChar, setNewChar] = useState({ name: "", emoji: "🤖", personality: "", speakingStyle: "" })
  const [creating, setCreating] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)

  // ── Put this INSIDE your component (reactive, not module-level) ──
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])

  //Load Conversations on Login

  useEffect(() => {
    if (!session) return
    async function loadConversations() {
      const { data } = await supabase
        .from("conversations")
        .select(`
        *,
        user1:user1_id(id, email),
        user2:user2_id(id, email)
      `)
        .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
        .order("created_at", { ascending: false })
      setConversations(data || [])
    }
    loadConversations()
  }, [session])


  //Subscribe to new message

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
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
        filter: `conversation_id=eq.${activeConvo.id}`
      }, (payload) => {
        setDirectMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    // ✅ return a sync function, removeChannel is called but promise is ignored
    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeConvo])


  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])

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

  //Send a direct message

  async function sendDirectMessage() {
    if (!input.trim() || !activeConvo || !session) return

    const msg = {
      conversation_id: activeConvo.id,
      sender_id: session.user.id,
      content: input
    }

    setInput("")
    await supabase.from("direct_messages").insert(msg)
    // No need to update state manually — the realtime subscription above catches it
  }

async function searchUser() {
  if (!searchEmail.trim()) return

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .ilike("email", `%${searchEmail}%`)
    .neq("user_id", session.user.id)
    .limit(5)

  setSearchResult(data?.[0] || null)
}

  async function startConversation(otherUserId: string) {
    // Check if conversation already exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .or(`and(user1_id.eq.${session.user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${session.user.id})`)
      .single()

    if (existing) {
      setActiveConvo(existing)
      return
    }

    // Create new conversation
    const { data } = await supabase
      .from("conversations")
      .insert({ user1_id: session.user.id, user2_id: otherUserId })
      .select()
      .single()

    if (data) {
      setConversations(prev => [data, ...prev])
      setActiveConvo(data)
    }
  }


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


  async function handleGenerateImage() {
    if (!input.trim() || !activeChar || !session) return
    setGeneratingImg(true)
    try {
      const data = await generateImage(input)
      const imageMsg = { role: "assistant", content: `[image]:${data.url}`, character_id: activeChar.id, user_id: session.user.id }
      await supabase.from("messages").insert(imageMsg)
      setMessages(prev => [...prev, { ...imageMsg, id: "temp-img" }])
    } finally {
      setGeneratingImg(false)
    }
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

  async function generateImage(promptText: string) {
    console.log("What is promptText?", typeof promptText, promptText);
    try {
      // 1. Pass the correct configuration options to fetch
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: promptText }), // Sends data to your route.js
      });

      // 2. Check for HTTP errors first (like 404, 405, 500)
      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      // 3. Safe check for empty response bodies
      const text = await response.text();
      if (!text) {
        throw new Error("Server returned an empty response body instead of JSON.");
      }

      // 4. Parse safely now that we know text exists
      const data = JSON.parse(text);
      return data;

    } catch (error) {
      console.error("Failed to generate image:", error);
      throw error; // Re-throw so your UI component knows the action failed
    }
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
          {(["login", "signup"] as const).map(m => (
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
      {/* ── SIDEBAR ── */}
      <aside style={styles.sidebar}>
        {isMobile ? (
          <>
            <div style={styles.mobileTopbar}>
              <span style={styles.brand}>🤖 CharacterChat</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <p style={styles.userEmail}>{session.user.email?.split("@")[0]}</p>
                <button style={styles.signOutBtn} onClick={() => supabase.auth.signOut()}>Out</button>
              </div>
            </div>
            <div style={styles.charStrip}>
              {characters.map(c => (
                <div key={c.id}
                  style={{ ...styles.charPill, ...(activeChar?.id === c.id ? styles.charPillActive : {}) }}
                  onClick={() => setActiveChar(c)}>
                  <span>{c.emoji}</span>
                  <span style={styles.charPillName}>{c.name}</span>
                  {c.created_by === session.user.id && (
                    <button style={styles.delBtn}
                      onClick={e => { e.stopPropagation(); deleteCharacter(c.id) }}>✕</button>
                  )}
                </div>

              ))}
              <button style={styles.newPillBtn} onClick={() => setShowForm(true)}>+ New</button>
            </div>
          </>
        ) : (
          <>
            <div style={styles.sideTop}>
              <span style={styles.brand}>🤖 CharacterChat</span>
              <button style={styles.signOutBtn} onClick={() => supabase.auth.signOut()}>Out</button>
            </div>
            <button style={styles.newBtn} onClick={() => setShowForm(true)}>+ New Character</button>
            <div style={styles.charList}>
              {characters.map(c => (
                <div key={c.id}
                  style={{ ...styles.charItem, ...(activeChar?.id === c.id ? styles.charItemActive : {}) }}
                  onClick={() => setActiveChar(c)}>
                  <span style={styles.charEmoji}>{c.emoji}</span>
                  <span style={styles.charName}>{c.name}</span>
                  {c.created_by === session.user.id && (
                    <button style={styles.delBtn}
                      onClick={e => { e.stopPropagation(); deleteCharacter(c.id) }}>✕</button>
                  )}
                </div>
              ))}
            </div>

            {/* Toggle tabs */}
            <div style={styles.viewToggle}>
              <button
                style={{ ...styles.toggleBtn, ...(view === "characters" ? styles.toggleActive : {}) }}
                onClick={() => setView("characters")}>
                🤖 Characters
              </button>
              <button
                style={{ ...styles.toggleBtn, ...(view === "people" ? styles.toggleActive : {}) }}
                onClick={() => setView("people")}>
                👥 People
              </button>
            </div>

            {/* List — switches based on view */}
            {view === "characters" ? (
              <div style={styles.charList}>
                {characters.map(c => (
                  <div key={c.id}
                    style={{ ...styles.charItem, ...(activeChar?.id === c.id ? styles.charItemActive : {}) }}
                    onClick={() => setActiveChar(c)}>
                    <span style={styles.charEmoji}>{c.emoji}</span>
                    <span style={styles.charName}>{c.name}</span>
                    {c.created_by === session.user.id && (
                      <button style={styles.delBtn}
                        onClick={e => { e.stopPropagation(); deleteCharacter(c.id) }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.charList}>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <input style={{ ...styles.input, fontSize: 12, padding: "8px 10px" }}
                    placeholder="Search by username…"
                    value={searchEmail}
                    onChange={e => setSearchEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && searchUser()}
                  />
                  <button style={{ ...styles.sendBtn, width: 36, height: 36, fontSize: 14 }} onClick={searchUser}>→</button>
                </div>

                {searchResult && (
  <div style={styles.charItem} onClick={() => startConversation(searchResult.user_id)}>
    <span style={styles.charEmoji}>👤</span>
    <div>
      <span style={styles.charName}>{searchResult.display_name}</span>
      <span style={{ fontSize: 11, color: "#555", display: "block" }}>{searchResult.email}</span>
    </div>
  </div>
)}

                {conversations.map(c => {
                  const other = c.user1_id === session.user.id ? c.user2 : c.user1
                  return (
                    <div key={c.id}
                      style={{ ...styles.charItem, ...(activeConvo?.id === c.id ? styles.charItemActive : {}) }}
                      onClick={() => setActiveConvo(c)}>
                      <span style={styles.charEmoji}>👤</span>
                      <span style={styles.charName}>{other?.email?.split("@")[0]}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <p style={styles.userEmail}>{session.user.email}</p>
            <p style={styles.userEmail}>{session.user.email}</p>
          </>
        )}
      </aside>  {/* ← closes here, NOT after <main> */}

      {/* ── MAIN ── */}
      <main style={styles.main}>

        {activeConvo && view !== "characters" ? (
          <div style={styles.chatWrap}>
            <div style={styles.chatHeader}>
              <span style={{ fontSize: 28 }}>👤</span>
              <div>
                <div style={styles.chatName}>
                  {activeConvo.user1_id === session.user.id
                    ? activeConvo.user2?.email?.split("@")[0]
                    : activeConvo.user1?.email?.split("@")[0]}
                </div>
                <div style={styles.chatSub}>Online</div>
              </div>
            </div>

            <div style={styles.messages}>
              {directMessages.map((m, i) => (
                <div key={i} style={{
                  ...styles.bubble,
                  ...(m.sender_id === session.user.id ? styles.bubbleUser : styles.bubbleAI)
                }}>
                  {m.content}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div style={styles.inputRow}>
              <input style={styles.chatInput}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendDirectMessage()}
                placeholder="Type a message…"
              />
              <button style={styles.sendBtn} onClick={sendDirectMessage} disabled={!input.trim()}>
                ↑
              </button>
            </div>
          </div>
        )



          : showForm ? (
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
                placeholder="e.g."
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
                {messages.map((m, i) => {
                  const isImage = m.content?.startsWith("[image]:")
                  const imageUrl = isImage ? m.content.replace("[image]:", "") : null

                  return (
                    <div key={m.id ?? m.created_at} style={{ ...styles.bubble, ...(m.role === "user" ? styles.bubbleUser : styles.bubbleAI) }}>
                      {isImage ? (
                        <img
                          src={imageUrl}
                          style={{ width: "100%", maxWidth: 260, borderRadius: 10, display: "block" }}
                        />
                      ) : (
                        m.content
                      )}
                    </div>
                  )
                })}
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
                <button style={styles.imgBtn} onClick={() => handleGenerateImage()} disabled={!input.trim() || generatingImg}>
                  {generatingImg ? "⏳" : "🖼️"}
                </button>
                <button style={styles.sendBtn} onClick={sendMessage} disabled={loading || !input.trim()}>
                  ↑
                </button>
              </div>
            </div>
          )}
      </main>  {/* ← closes here */}

    </div>
  )
}
// ── STYLES ────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  // Auth
  authWrap: { minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0f0f", fontFamily: "'Georgia', serif", padding: "16px" },
  authCard: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 16, padding: "40px 28px", width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 12 },
  authLogo: { fontSize: 40, textAlign: "center" },
  authTitle: { margin: 0, textAlign: "center", fontSize: 24, color: "#f5f5f5", fontWeight: 700 },
  authSub: { margin: 0, textAlign: "center", color: "#666", fontSize: 14 },
  tabRow: { display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid #2a2a2a" },
  tab: { flex: 1, padding: "10px 0", background: "transparent", border: "none", color: "#888", cursor: "pointer", fontSize: 14 },
  tabActive: { background: "#2a2a2a", color: "#f5f5f5", fontWeight: 600 },
  authBtn: { padding: "14px 0", background: "#e8ff00", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer", color: "#0f0f0f", marginTop: 4 },
  error: { color: "#ff6b6b", fontSize: 13, margin: 0 },
  hint: { color: "#888", fontSize: 12, margin: 0 },

  // Layout
  app: { display: "flex", flexDirection: "column", height: "100dvh", background: "#0f0f0f", fontFamily: "'Georgia', serif", color: "#f0f0f0" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },

  // Desktop sidebar
  sidebar: { background: "#141414", flexShrink: 0 },
  sideTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  brand: { fontWeight: 700, fontSize: 16, color: "#f5f5f5" },
  signOutBtn: { background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#888", fontSize: 12, borderRadius: 6, padding: "4px 8px", cursor: "pointer" },
  newBtn: { width: "100%", padding: "10px 0", background: "#e8ff00", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#0f0f0f", marginBottom: 12 },
  charList: { display: "flex", flexDirection: "column", gap: 6, flex: 1, overflowY: "auto" },
  charItem: { display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, cursor: "pointer", background: "#1a1a1a" },
  charItemActive: { background: "#252525", outline: "1px solid #e8ff0055" },
  charEmoji: { fontSize: 18, flexShrink: 0 },
  charName: { fontSize: 14, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  delBtn: { background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: 12, padding: "2px 4px", flexShrink: 0 },
  userEmail: { fontSize: 11, color: "#444", marginTop: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  imgBtn: { width: 44, height: 44, borderRadius: "50%", background: "#1a1a1a", border: "1px solid #2a2a2a", fontSize: 18, cursor: "pointer", flexShrink: 0 },
  // Mobile topbar + char strip
  mobileTopbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #1e1e1e", background: "#141414" },
  charStrip: { display: "flex", gap: 8, padding: "8px 10px", overflowX: "auto", background: "#141414", borderBottom: "1px solid #1e1e1e" },
  charPill: { display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 20, whiteSpace: "nowrap", cursor: "pointer", fontSize: 13, flexShrink: 0 },
  charPillActive: { borderColor: "#e8ff00", color: "#e8ff00" },
  charPillName: { maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis" },
  newPillBtn: { display: "flex", alignItems: "center", padding: "6px 12px", background: "transparent", border: "1px dashed #e8ff0055", borderRadius: 20, color: "#e8ff00", fontSize: 13, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" },

  // Chat
  chatWrap: { display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" },
  chatHeader: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #1e1e1e", flexShrink: 0 },
  chatName: { fontSize: 16, fontWeight: 600, color: "#f5f5f5" },
  chatSub: { fontSize: 11, color: "#555" },
  messages: { flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 10 },
  bubble: { maxWidth: "82%", padding: "10px 14px", borderRadius: 14, lineHeight: 1.5, fontSize: 14, wordBreak: "break-word" },
  bubbleUser: { background: "#e8ff00", color: "#0f0f0f", alignSelf: "flex-end", fontWeight: 500 },
  bubbleAI: { background: "#1a1a1a", color: "#e0e0e0", alignSelf: "flex-start" },
  inputRow: { display: "flex", gap: 8, padding: "10px 12px", borderTop: "1px solid #1e1e1e", flexShrink: 0, paddingBottom: "max(10px, env(safe-area-inset-bottom))" },
  chatInput: { flex: 1, padding: "11px 16px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 24, color: "#f0f0f0", fontSize: 16, outline: "none" },
  sendBtn: { width: 44, height: 44, borderRadius: "50%", background: "#e8ff00", border: "none", fontSize: 20, cursor: "pointer", color: "#0f0f0f", fontWeight: 700, flexShrink: 0 },

  // States
  empty: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: "#666", fontSize: 15, textAlign: "center", lineHeight: 1.6 },
  formWrap: { flex: 1, overflowY: "auto", padding: 20 },
  formTitle: { fontSize: 20, fontWeight: 700, color: "#f5f5f5", marginBottom: 16 },
  label: { fontSize: 13, color: "#888", display: "block", marginBottom: 4, marginTop: 12 },
  input: { width: "100%", padding: "11px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#f0f0f0", fontSize: 15, outline: "none" },
  textarea: { width: "100%", padding: "11px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#f0f0f0", fontSize: 15, outline: "none", resize: "vertical" },
  emojiGrid: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 },
  emojiBtn: { fontSize: 22, padding: "8px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, cursor: "pointer" },
  emojiBtnActive: { borderColor: "#e8ff00", background: "#e8ff0011" },
  formBtns: { display: "flex", gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, padding: "12px 0", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 8, color: "#888", fontSize: 14, cursor: "pointer" },
  createBtn: { flex: 2, padding: "12px 0", background: "#e8ff00", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#0f0f0f" },
  dimText: { color: "#555", fontSize: 14 },
  typing: { letterSpacing: 2, color: "#555" },

  viewToggle: { display: "flex", gap: 4, padding: "8px", background: "#1a1a1a", borderRadius: 10, margin: "8px 0" },
  toggleBtn: { flex: 1, padding: "8px 0", background: "transparent", border: "none", color: "#666", fontSize: 13, cursor: "pointer", borderRadius: 8 },
  toggleActive: { background: "#2a2a2a", color: "#f5f5f5", fontWeight: 600 },
}