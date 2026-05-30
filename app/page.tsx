"use client"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { PushNotifications } from '@capacitor/push-notifications'

const supabase = createClient(
  "https://dhykgbrhfjdlkuyswmat.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoeWtnYnJoZmpkbGt1eXN3bWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MDkyOTIsImV4cCI6MjA5NTI4NTI5Mn0.gZz_lP56l4xNyFeESJDhtaXbQSksctgFGHr7zTttSQ0"
)

const EMOJIS = ["🤖", "🧙", "🦊", "🐉", "👾", "🧠", "🕵️", "🧜", "🦁", "🎭", "👻", "🤡", "🧛", "🦸", "🧝"]

const WA = {
  bg: "#111b21",
  surface: "#202c33",
  surfaceAlt: "#2a3942",
  border: "#2a3942",
  green: "#00a884",
  greenDark: "#005c4b",
  textPrimary: "#e9edef",
  textMuted: "#8696a0",
  chatBg: "#0b141a",
}

// Inject CSS once for responsive layout — avoids JS-based isMobile hydration issues
const CSS = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; height: 100%; }

  .cc-app { display: flex; height: 100dvh; font-family: -apple-system,'Segoe UI',sans-serif; background: ${WA.bg}; color: ${WA.textPrimary}; overflow: hidden; }

  /* Desktop: sidebar fixed width, main fills rest */
  .cc-sidebar { width: 340px; flex-shrink: 0; display: flex; flex-direction: column; background: ${WA.bg}; border-right: 1px solid ${WA.border}; height: 100dvh; }
  .cc-main    { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: ${WA.chatBg}; height: 100dvh; }

  /* Mobile: both take full width, toggled via class */
  @media (max-width: 767px) {
    .cc-app     { position: relative; overflow: hidden; }
    .cc-sidebar { position: absolute; inset: 0; width: 100%; z-index: 10; transform: translateX(0); transition: transform 0.25s ease; }
    .cc-main    { position: absolute; inset: 0; width: 100%; z-index: 10; transform: translateX(100%); transition: transform 0.25s ease; }

    /* When chat is active on mobile, slide sidebar out and chat in */
    .cc-app.chat-open .cc-sidebar { transform: translateX(-100%); }
    .cc-app.chat-open .cc-main    { transform: translateX(0); }
  }

  /* Scrollbars */
  .cc-charlist::-webkit-scrollbar, .cc-messages::-webkit-scrollbar { width: 4px; }
  .cc-charlist::-webkit-scrollbar-thumb, .cc-messages::-webkit-scrollbar-thumb { background: ${WA.surfaceAlt}; border-radius: 4px; }

  /* Chat bubble width: narrower on desktop, wider on mobile */
  .cc-bubble { max-width: 65%; }
  @media (max-width: 767px) { .cc-bubble { max-width: 80%; } }

  /* Messages padding */
  .cc-messages { padding: 14px 10%; }
  @media (max-width: 767px) { .cc-messages { padding: 12px 4%; } }

  /* Input font size — 16px on mobile prevents iOS zoom */
  .cc-chat-input { font-size: 15px; }
  @media (max-width: 767px) { .cc-chat-input { font-size: 16px; } }

  /* Back button — only visible on mobile */
  .cc-back-btn { display: none; }
  @media (max-width: 767px) { .cc-back-btn { display: flex; } }
`

export default function Home() {
  const [allProfiles, setAllProfiles] = useState<any[]>([])
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
  const [view, setView] = useState<"ai" | "people">("ai")
  const [showForm, setShowForm] = useState(false)
  const [newChar, setNewChar] = useState({ name: "", emoji: "🤖", personality: "", speakingStyle: "" })
  const [creating, setCreating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  // CSS class drives the slide animation — no JS isMobile needed
  const [chatOpen, setChatOpen] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)

  // ── Data loading ─────────────────────────────────────────────

  useEffect(() => {
    if (!session) return
    supabase
      .from("conversations")
      .select("*, user1:user1_id(id,username), user2:user2_id(id,username)")
      .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
      .order("created_at", { ascending: false })
      .then(({ data }) => setConversations(data || []))
  }, [session])

  useEffect(() => {
    if (!activeConvo) return
    supabase.from("direct_messages").select("*")
      .eq("conversation_id", activeConvo.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setDirectMessages(data || []))
    const ch = supabase
      .channel(`convo-${activeConvo.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" },
        (p) => {
          if (p.new.conversation_id === activeConvo.id) {
            setDirectMessages(prev => [...prev, p.new])
            // Notify if message is from the other person
            if (p.new.sender_id !== session.user.id) {
              const other = activeConvo.user1_id === session.user.id
                ? activeConvo.user2
                : activeConvo.user1
              const name = other?.display_name || other?.username || "Someone"
              const isImage = p.new.content?.startsWith("[image]:")
              showNotification(name, isImage ? "📷 Sent an image" : p.new.content)
            }
          }
        })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [activeConvo])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    setCharsLoading(true)
    supabase.from("characters").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setCharacters(data || []); setCharsLoading(false) })
  }, [session])

  useEffect(() => {
    if (!activeChar || !session) { setMessages([]); return }
    supabase.from("messages").select("*")
      .eq("character_id", activeChar.id).eq("user_id", session.user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages(data || []))
  }, [activeChar, session])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, directMessages, loading])

  useEffect(() => {
    if (!session) return
    const ch = supabase
      .channel("global-dm-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" },
        async (p) => {
          // Only notify if message is for us and we're not already in that convo
          if (p.new.sender_id === session.user.id) return
          if (activeConvo?.id === p.new.conversation_id) return

          // Check if this message is in one of our conversations
          const convo = conversations.find(c => c.id === p.new.conversation_id)
          if (!convo) return

          const other = convo.user1_id === session.user.id ? convo.user2 : convo.user1
          const name = other?.display_name || other?.username || "Someone"
          const isImage = p.new.content?.startsWith("[image]:")
          showNotification(
            `New message from ${name}`,
            isImage ? "📷 Sent an image" : p.new.content
          )
        })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [session, conversations, activeConvo])

  useEffect(() => {
    if (!session) return

    // Mark self as online
    supabase.from("profiles")
      .update({ is_online: true, last_seen: new Date().toISOString() })
      .eq("id", session.user.id)
      .then(() => { })

    // Load all profiles except self
    supabase.from("profiles")
      .select("*")
      .neq("id", session.user.id)
      .order("is_online", { ascending: false })
      .then(({ data }) => setAllProfiles(data || []))

    // Subscribe to profile changes for live online status
    const ch = supabase
      .channel("profiles-online")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" },
        (p) => {
          setAllProfiles(prev => prev.map(profile =>
            profile.id === p.new.id ? { ...profile, ...p.new } : profile
          ))
        })
      .subscribe()

    // Mark self as offline when tab closes
    const handleOffline = () => {
      supabase.from("profiles")
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq("id", session.user.id)
        .then(() => { })
    }
    window.addEventListener("beforeunload", handleOffline)

    // Heartbeat every 30s to keep online status fresh
    const heartbeat = setInterval(() => {
      supabase.from("profiles")
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq("id", session.user.id)
        .then(() => { })
    }, 30000)

    return () => {
      supabase.removeChannel(ch)
      window.removeEventListener("beforeunload", handleOffline)
      clearInterval(heartbeat)
      handleOffline()
    }
  }, [session])


  useEffect(() => {
  requestNotificationPermission()
  
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session)
    if (data.session) initPushNotifications(data.session.user.id)
  })

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
    setSession(s)
    if (s) initPushNotifications(s.user.id)
  })

  return () => subscription.unsubscribe()
}, [])
  // ── Navigation helpers ────────────────────────────────────────

  function openChar(c: any) {
    setActiveChar(c); setShowForm(false); setActiveConvo(null)
    setChatOpen(true)
  }
  function openConvo(c: any) {
    setActiveConvo(c); setActiveChar(null); setShowForm(false)
    setChatOpen(true)
  }
  function openForm() {
    setShowForm(true); setActiveChar(null); setActiveConvo(null)
    setChatOpen(true)
  }
  function goBack() {
    setChatOpen(false)
  }

  // ── Actions ───────────────────────────────────────────────────

  async function sendDirectMessage() {
    if (!input.trim() || !activeConvo || !session) return
    setInput("")
    await supabase.from("direct_messages").insert({
      conversation_id: activeConvo.id, sender_id: session.user.id, content: input
    })
  }

  async function searchUser() {
    if (!searchEmail.trim()) return
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${searchEmail}%`)
      .neq("id", session.user.id)  // "id" not "user_id"
      .limit(5)
    setSearchResult(data?.[0] || null)
  }

  async function createReplica(otherUser: any, convoId: string) {
    if (!session) return
    setCreating(true)
    console.log("1. otherUser:", otherUser)
    console.log("2. convoId:", convoId)
    // Fetch messages sent by the OTHER user in this conversation

    const { data: msgs } = await supabase
      .from("direct_messages")
      .select("content")
      .eq("conversation_id", convoId)
      .eq("sender_id", otherUser.id)
      .order("created_at", { ascending: true })
      .limit(200)


    console.log("3. msgs count:", msgs?.length)
    console.log("4. msgs data:", msgs)

    if (!msgs || msgs.length < 5) {
      alert(`${otherUser.username} needs to send at least 5 messages before you can create their replica!`)
      setCreating(false)
      return
    }

    const sampleMessages = msgs.map(m => m.content).join("\n")

    // Ask Claude to analyze their writing style
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content: `Analyze the writing style, personality, tone, vocabulary, and communication patterns from these messages written by one person. Then write a system prompt (max 200 words) for an AI to perfectly impersonate this person's texting style. Be specific about quirks, phrases, emoji usage, response length, topics they care about.\n\nMessages:\n${sampleMessages}`
        }],
        systemPrompt: "You are an expert at analyzing writing styles and creating AI persona prompts. Return only the system prompt text, nothing else."

      }
      )
    })

    const data = await res.json()
    console.log("5. API response:", data)
    const system_prompt = `${data.reply} Never break character. Match the original person's typical message length and style exactly.`
    console.log("6. system_prompt:", system_prompt)
    // Delete old replica of this person if exists
    await supabase.from("characters")
      .delete()
      .eq("replica_of", otherUser.id)
      .eq("created_by", session.user.id)

    // Create new replica character
    const { data: char, error } = await supabase.from("characters")
      .insert({
        name: `${otherUser.username}'s Replica`,
        emoji: "🪞",
        system_prompt,
        created_by: session.user.id,
        is_replica: true,
        replica_of: otherUser.id
      })
      .select().single()

    console.log("7. insert result - char:", char)
    console.log("8. insert result - error:", error)

    if (!error && char) {
      setCharacters(prev => [char, ...prev.filter(c => c.replica_of !== otherUser.id)])
      setView("ai")
      openChar(char)
    }
    setCreating(false)
  }

  async function requestNotificationPermission() {
    if (!("Notification" in window)) return
    if (Notification.permission === "default") {
      await Notification.requestPermission()
    }
  }

  function showNotification(title: string, body: string, icon = "🤖") {
    if (Notification.permission !== "granted") return
    if (document.visibilityState === "visible") return // don't show if app is open
    new Notification(title, { body, icon: "/favicon.ico" })
  }

  async function startConversation(otherUserId: string) {
    const { data: existing } = await supabase
      .from("conversations")
      .select("*, user1:user1_id(id,username), user2:user2_id(id,username)")
      .or(`and(user1_id.eq.${session.user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${session.user.id})`)
      .maybeSingle()
    if (existing) { openConvo(existing); return }
    const { data } = await supabase
      .from("conversations")
      .insert({ user1_id: session.user.id, user2_id: otherUserId })
      .select("*, user1:user1_id(id,username), user2:user2_id(id,username)")
      .single()
    if (data) { setConversations(prev => [data, ...prev]); openConvo(data) }
  }

  async function handleAuth() {
    setAuthError(""); setAuthLoading(true)
    const { error } = await (authMode === "login"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password }))
    if (error) setAuthError(error.message)
    setAuthLoading(false)
  }

  async function generateImage(promptText: string) {
    const res = await fetch("/api/generate-image", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptText }),
    })
    if (!res.ok) throw new Error(`Status: ${res.status}`)
    const text = await res.text()
    if (!text) throw new Error("Empty response")
    return JSON.parse(text)
  }

  async function handleGenerateImage() {
    if (!input.trim() || !activeChar || !session) return
    setGeneratingImg(true)
    try {
      const data = await generateImage(input)
      const msg = { role: "assistant", content: `[image]:${data.url}`, character_id: activeChar.id, user_id: session.user.id }
      await supabase.from("messages").insert(msg)
      setMessages(prev => [...prev, { ...msg, id: "temp-img" }])
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
    const aiMsg = { role: "assistant", content: data.reply, character_id: activeChar.id, user_id: session.user.id }
    await supabase.from("messages").insert(aiMsg)
    setMessages(prev => [...prev.filter(m => m.id !== "temp-user"), userMsg, { ...aiMsg, id: "temp-ai" }])
    showNotification(activeChar.name, data.reply) // ← add this
    setLoading(false)
  }

  async function createCharacter() {
    if (!newChar.name.trim() || !newChar.personality.trim() || !session) return
    setCreating(true)
    const system_prompt = `You are ${newChar.name}. ${newChar.personality}.${newChar.speakingStyle ? " Speaking style: " + newChar.speakingStyle + "." : ""} Keep replies under 100 words. Never break character.`
    const { data, error } = await supabase.from("characters")
      .insert({ name: newChar.name, emoji: newChar.emoji, system_prompt, created_by: session.user.id })
      .select().single()
    if (!error && data) { setCharacters(prev => [data, ...prev]); openChar(data); setMessages([]) }
    setNewChar({ name: "", emoji: "🤖", personality: "", speakingStyle: "" })
    setShowForm(false); setCreating(false)
  }

  async function deleteCharacter(id: string) {
    await supabase.from("characters").delete().eq("id", id)
    setCharacters(prev => prev.filter(c => c.id !== id))
    if (activeChar?.id === id) { setActiveChar(null); setMessages([]) }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !activeConvo || !session) return
    setUploadingImage(true)

    try {
      // Upload to Supabase Storage
      const ext = file.name.split('.').pop()
      const fileName = `${session.user.id}-${Date.now()}.${ext}`
      const { data, error } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName)

      // Send as message with [image]: prefix
      await supabase.from("direct_messages").insert({
        conversation_id: activeConvo.id,
        sender_id: session.user.id,
        content: `[image]:${publicUrl}`
      })
    } catch (err) {
      alert("Failed to upload image")
      console.error(err)
    } finally {
      setUploadingImage(false)
      // Reset file input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

async function initPushNotifications(userId: string) {
  if (!(window as any).Capacitor) return

  const permission = await PushNotifications.requestPermissions()
  if (permission.receive !== 'granted') return

  await PushNotifications.register()

  PushNotifications.addListener('registration', token => {
    supabase.from("profiles")
      .update({ push_token: token.value })
      .eq("id", userId)  // ← uses the parameter not session
      .then(() => {})
  })

  PushNotifications.addListener('pushNotificationReceived', notification => {
    console.log('Push received:', notification)
  })

  PushNotifications.addListener('pushNotificationActionPerformed', action => {
    console.log('Push action:', action)
  })
}

  // ── AUTH SCREEN ───────────────────────────────────────────────
  if (!session) return (
    <>
      <style>{CSS}</style>
      <div style={S.authWrap}>
        <div style={S.authCard}>
          <div style={{ fontSize: 40, textAlign: "center" }}>🤖</div>
          <h1 style={S.authTitle}>CharacterChat</h1>
          <p style={S.authSub}>Talk to AI personas. Build your own.</p>
          <div style={S.authTabRow}>
            {(["login", "signup"] as const).map(m => (
              <button key={m} onClick={() => { setAuthMode(m); setAuthError("") }}
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
          {authError && <p style={{ color: "#ff6b6b", fontSize: 13, margin: 0 }}>{authError}</p>}
          {authMode === "signup" && <p style={{ color: WA.textMuted, fontSize: 12, margin: 0 }}>Check your email to confirm after signing up.</p>}
          <button style={S.authBtn} onClick={handleAuth} disabled={authLoading}>
            {authLoading ? "..." : authMode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>
    </>
  )

  // ── MAIN APP ──────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className={`cc-app${chatOpen ? " chat-open" : ""}`}>

        {/* ── SIDEBAR ── */}
        <aside className="cc-sidebar">

          {/* Top bar */}
          <div style={S.sideTop}>
            <span style={S.brand}>Kikar</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: WA.textMuted, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session.user.email?.split("@")[0]}
              </span>
              <button style={S.signOutBtn} onClick={() => supabase.auth.signOut()}>Out</button>
            </div>
          </div>

          {/* AI / People tabs */}
          <div style={S.tabBar}>
            <button style={{ ...S.tabBtn, ...(view === "ai" ? S.tabBtnActive : {}) }}
              onClick={() => { setView("ai"); setActiveConvo(null) }}>
              🤖 AI Characters
            </button>
            <button style={{ ...S.tabBtn, ...(view === "people" ? S.tabBtnActive : {}) }}
              onClick={() => { setView("people"); setActiveChar(null); setShowForm(false) }}>
              👥 People
            </button>
          </div>

          {/* AI list */}
          {view === "ai" ? (
            <div style={S.listWrap}>
              <button style={S.newCharBtn} onClick={openForm}>+ New Character</button>
              <div className="cc-charlist" style={S.charList}>
                {charsLoading
                  ? <p style={S.dimText}>Loading…</p>
                  : characters.map(c => (
                    <div key={c.id}
                      style={{ ...S.charItem, ...(activeChar?.id === c.id && !showForm ? S.charItemActive : {}) }}
                      onClick={() => openChar(c)}>
                      <span style={S.charEmoji}>{c.emoji}</span>
                      <span style={S.charName}>{c.name}</span>
                      {c.created_by === session.user.id && (
                        <button style={S.delBtn}
                          onClick={e => { e.stopPropagation(); deleteCharacter(c.id) }}>✕</button>
                      )}
                    </div>
                  ))
                }
              </div>
            </div>
          ) : (
            /* People list */
            <div style={S.listWrap}>
              {/* Search bar */}
              <div style={S.searchRow}>
                <input style={S.searchInput} placeholder="Search by username…"
                  value={searchEmail} onChange={e => setSearchEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchUser()} />
                <button style={S.searchBtn} onClick={searchUser}>→</button>
              </div>

              {/* Search result */}
              {searchResult && (
                <div style={{ ...S.charItem, background: WA.surfaceAlt }} onClick={() => startConversation(searchResult.id)}>
                  <div style={{ position: "relative" }}>
                    {searchResult.avatar_url
                      ? <img src={searchResult.avatar_url} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} />
                      : <div style={{ width: 38, height: 38, borderRadius: "50%", background: WA.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👤</div>
                    }
                    <div style={{
                      position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%",
                      background: searchResult.is_online ? "#22c55e" : WA.textMuted,
                      border: `2px solid ${WA.bg}`
                    }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={S.charName}>{searchResult.display_name || searchResult.username}</div>
                    <div style={{ fontSize: 11, color: searchResult.is_online ? "#22c55e" : WA.textMuted }}>
                      {searchResult.is_online ? "Online" : "Offline"}
                    </div>
                  </div>
                </div>
              )}

              {/* All People header */}
              <div style={{ padding: "10px 16px 4px", fontSize: 11, color: WA.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", flexShrink: 0 }}>
                All People ({allProfiles.length})
              </div>

              <div className="cc-charlist" style={S.charList}>
                {/* Online users first */}
                {allProfiles.map(p => {
                  const existingConvo = conversations.find(c =>
                    (c.user1_id === session.user.id && c.user2_id === p.id) ||
                    (c.user2_id === session.user.id && c.user1_id === p.id)
                  )
                  return (
                    <div key={p.id}
                      style={{ ...S.charItem, ...(activeConvo?.id === existingConvo?.id ? S.charItemActive : {}) }}
                      onClick={() => startConversation(p.id)}>
                      {/* Avatar with online dot */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        {p.avatar_url
                          ? <img src={p.avatar_url} style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }} />
                          : <div style={{ width: 42, height: 42, borderRadius: "50%", background: WA.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👤</div>
                        }
                        <div style={{
                          position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: "50%",
                          background: p.is_online ? "#22c55e" : "#6b7280",
                          border: `2px solid ${WA.bg}`
                        }} />
                      </div>
                      {/* Name + status */}
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={S.charName}>{p.display_name || p.username}</div>
                        <div style={{ fontSize: 11, color: p.is_online ? "#22c55e" : WA.textMuted }}>
                          {p.is_online ? "Online" : p.last_seen
                            ? `Last seen ${new Date(p.last_seen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                            : "Offline"}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          )}

          <p style={S.userEmail}>{session.user.email}</p>
        </aside>

        {/* ── MAIN ── */}
        <main className="cc-main">

          {view === "people" && activeConvo ? (
            /* Active DM */
            <div style={S.chatWrap}>
              <div style={S.chatHeader}>
                <button className="cc-back-btn" style={S.backBtn} onClick={goBack}>←</button>
                <span style={{ fontSize: 26 }}>👤</span>
                <div style={{ flex: 1 }}>
                  <div style={S.chatName}>
                    {activeConvo.user1_id === session.user.id
                      ? activeConvo.user2?.username
                      : activeConvo.user1?.username}
                  </div>
                  <div style={{
                    fontSize: 11, color: (() => {
                      const other = activeConvo.user1_id === session.user.id ? activeConvo.user2 : activeConvo.user1
                      const profile = allProfiles.find(p => p.id === other?.id)
                      return profile?.is_online ? "#22c55e" : WA.textMuted
                    })()
                  }}>
                    {(() => {
                      const other = activeConvo.user1_id === session.user.id ? activeConvo.user2 : activeConvo.user1
                      const profile = allProfiles.find(p => p.id === other?.id)
                      return profile?.is_online ? "● Online" : "● Offline"
                    })()}
                  </div>
                </div>
                <button
                  style={{
                    background: "transparent",
                    border: "1px solid #a855f7",
                    borderRadius: 8,
                    color: "#a855f7",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "6px 10px",
                    flexShrink: 0,
                    opacity: creating ? 0.5 : 1
                  }}
                  disabled={creating}
                  onClick={() => {
                    const other = activeConvo.user1_id === session.user.id
                      ? activeConvo.user2
                      : activeConvo.user1
                    createReplica(other, activeConvo.id)
                  }}
                >
                  {creating ? "⏳" : "🪞 Replica"}
                </button>
              </div>
              <div className="cc-messages" style={S.messages}>
                {directMessages.map((m, i) => {
                  const isUser = m.sender_id === session.user.id
                  const isImage = m.content?.startsWith("[image]:")
                  const imageUrl = isImage ? m.content.replace("[image]:", "") : null
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
                      <div className="cc-bubble"
                        style={{
                          ...S.bubble,
                          ...(isUser ? S.bubbleUser : S.bubbleAI),
                          ...(isImage ? { padding: 4, background: "transparent" } : {})
                        }}>
                        {isImage
                          ? <img
                            src={imageUrl!}
                            style={{ maxWidth: 220, maxHeight: 280, borderRadius: 10, display: "block", cursor: "pointer" }}
                            onClick={() => window.open(imageUrl!, '_blank')}
                          />
                          : m.content}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              <div style={S.inputRow}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
                <button style={S.imgBtn} onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                  {uploadingImage ? "⏳" : "🖼️"}
                </button>
                <input className="cc-chat-input" style={S.chatInput} value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendDirectMessage()}
                  placeholder="Type a message…" />
                <button style={S.sendBtn} onClick={sendDirectMessage} disabled={!input.trim()}>↑</button>
              </div>
            </div>

          ) : view === "people" && !activeConvo ? (
            <div style={S.empty}>
              <div style={{ fontSize: 48 }}>👥</div>
              <p style={S.emptyText}>Search for someone,<br />or select a conversation.</p>
            </div>

          ) : showForm ? (
            /* Create character form */
            <div style={S.formWrap}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <button className="cc-back-btn" style={S.backBtn} onClick={() => { setShowForm(false); goBack() }}>←</button>
                <h2 style={{ ...S.formTitle, marginBottom: 0 }}>Create a Character</h2>
              </div>
              <label style={S.label}>Name</label>
              <input style={S.input} placeholder="e.g. Socrates"
                value={newChar.name} onChange={e => setNewChar({ ...newChar, name: e.target.value })} />
              <label style={S.label}>Pick an Emoji</label>
              <div style={S.emojiGrid}>
                {EMOJIS.map(em => (
                  <button key={em}
                    style={{ ...S.emojiBtn, ...(newChar.emoji === em ? S.emojiBtnActive : {}) }}
                    onClick={() => setNewChar({ ...newChar, emoji: em })}>{em}</button>
                ))}
              </div>
              <label style={S.label}>Personality *</label>
              <textarea style={S.textarea} rows={3}
                placeholder="e.g. A wise philosopher who questions everything"
                value={newChar.personality} onChange={e => setNewChar({ ...newChar, personality: e.target.value })} />
              <label style={S.label}>Speaking Style (optional)</label>
              <input style={S.input} placeholder="e.g. Uses rhetorical questions, formal tone"
                value={newChar.speakingStyle} onChange={e => setNewChar({ ...newChar, speakingStyle: e.target.value })} />
              <div style={S.formBtns}>
                <button style={S.cancelBtn} onClick={() => { setShowForm(false); goBack() }}>Cancel</button>
                <button style={S.createBtn} onClick={createCharacter} disabled={creating}>
                  {creating ? "Creating…" : "Create & Chat"}
                </button>
              </div>
            </div>

          ) : !activeChar ? (
            <div style={S.empty}>
              <div style={{ fontSize: 48 }}>💬</div>
              <p style={S.emptyText}>Select a character to start chatting,<br />or create your own.</p>
              <button style={S.createBtn} onClick={openForm}>+ New Character</button>
            </div>

          ) : (
            /* AI Chat */
            <div style={S.chatWrap}>
              <div style={S.chatHeader}>
                <button className="cc-back-btn" style={S.backBtn} onClick={goBack}>←</button>
                <span style={{ fontSize: 26 }}>{activeChar.emoji}</span>
                <div>
                  <div style={S.chatName}>{activeChar.name}</div>
                  <div style={S.chatSub}>AI · your chat is private</div>
                </div>
              </div>
              <div className="cc-messages" style={S.messages}>
                {messages.length === 0 && (
                  <p style={S.dimText}>Start the conversation with {activeChar.name}…</p>
                )}
                {messages.map((m, i) => {
                  const isImage = m.content?.startsWith("[image]:")
                  const imageUrl = isImage ? m.content.replace("[image]:", "") : null
                  return (
                    <div key={m.id ?? i} className="cc-bubble"
                      style={{ ...S.bubble, ...(m.role === "user" ? S.bubbleUser : S.bubbleAI) }}>
                      {isImage
                        ? <img src={imageUrl} style={{ width: "100%", maxWidth: 240, borderRadius: 10, display: "block" }} />
                        : m.content}
                    </div>
                  )
                })}
                {loading && (
                  <div className="cc-bubble" style={{ ...S.bubble, ...S.bubbleAI, opacity: 0.5 }}>
                    <span style={{ letterSpacing: 2, color: WA.textMuted }}>●●●</span>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <div style={S.inputRow}>
                <input className="cc-chat-input" style={S.chatInput} value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder={`Message ${activeChar.name}…`} />
                <button style={S.imgBtn} onClick={handleGenerateImage} disabled={!input.trim() || generatingImg}>
                  {generatingImg ? "⏳" : "🖼️"}
                </button>
                <button style={S.sendBtn} onClick={sendMessage} disabled={loading || !input.trim()}>↑</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}

// ── STYLES ────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  authWrap: { minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: WA.bg, padding: 16 },
  authCard: { background: WA.surface, border: `1px solid ${WA.border}`, borderRadius: 16, padding: "40px 28px", width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 12 },
  authTitle: { margin: 0, textAlign: "center", fontSize: 22, color: WA.textPrimary, fontWeight: 700 },
  authSub: { margin: 0, textAlign: "center", color: WA.textMuted, fontSize: 14 },
  authTabRow: { display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${WA.border}` },
  authTab: { flex: 1, padding: "10px 0", background: "transparent", border: "none", color: WA.textMuted, cursor: "pointer", fontSize: 14 },
  authTabActive: { background: WA.surfaceAlt, color: WA.textPrimary, fontWeight: 600 },
  authInput: { width: "100%", padding: "11px 14px", background: WA.surfaceAlt, border: `1px solid ${WA.border}`, borderRadius: 10, color: WA.textPrimary, fontSize: 15, outline: "none", boxSizing: "border-box" },
  authBtn: { padding: "14px 0", background: WA.green, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer", color: WA.bg, marginTop: 4 },

  sideTop: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: WA.surface, flexShrink: 0 },
  brand: { fontWeight: 700, fontSize: 15, color: WA.textPrimary },
  signOutBtn: { background: WA.surfaceAlt, border: `1px solid ${WA.border}`, color: WA.textMuted, fontSize: 12, borderRadius: 6, padding: "4px 10px", cursor: "pointer" },

  tabBar: { display: "flex", borderBottom: `1px solid ${WA.border}`, flexShrink: 0 },
  tabBtn: { flex: 1, padding: "11px 0", background: "transparent", border: "none", borderBottom: "2px solid transparent", color: WA.textMuted, fontSize: 13, fontWeight: 500, cursor: "pointer" },
  tabBtnActive: { color: WA.green, borderBottomColor: WA.green },

  listWrap: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  newCharBtn: { margin: "10px 12px 4px", padding: "10px 0", background: "transparent", border: `1px dashed ${WA.green}55`, borderRadius: 8, color: WA.green, fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 },
  charList: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" },
  charItem: { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer", borderBottom: `1px solid ${WA.border}22` },
  charItemActive: { background: WA.surfaceAlt },
  charEmoji: { fontSize: 22, flexShrink: 0 },
  charName: { fontSize: 14, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: WA.textPrimary },
  delBtn: { background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: 12, padding: "2px 6px", flexShrink: 0 },
  userEmail: { fontSize: 11, color: "#444", padding: "8px 16px", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },

  searchRow: { display: "flex", gap: 6, padding: "10px 12px", flexShrink: 0 },
  searchInput: { flex: 1, padding: "9px 12px", background: WA.surface, border: `1px solid ${WA.border}`, borderRadius: 8, color: WA.textPrimary, fontSize: 13, outline: "none" },
  searchBtn: { width: 36, height: 36, background: WA.green, border: "none", borderRadius: 8, color: WA.bg, fontWeight: 700, cursor: "pointer", fontSize: 16, flexShrink: 0 },

  backBtn: { alignItems: "center", justifyContent: "center", background: "transparent", border: "none", color: WA.textPrimary, fontSize: 22, cursor: "pointer", padding: "0 10px 0 0", flexShrink: 0, lineHeight: 1 },

  chatWrap: { display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", height: "100%" },
  chatHeader: { display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: WA.surface, borderBottom: `1px solid ${WA.border}`, flexShrink: 0 },
  chatName: { fontSize: 15, fontWeight: 600, color: WA.textPrimary },
  chatSub: { fontSize: 11, color: WA.textMuted },
  messages: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 },
  bubble: { padding: "8px 12px", borderRadius: 8, lineHeight: 1.5, fontSize: 14, wordBreak: "break-word" },
  bubbleUser: { background: WA.greenDark, color: WA.textPrimary, alignSelf: "flex-end", borderTopRightRadius: 0 },
  bubbleAI: { background: WA.surface, color: WA.textPrimary, alignSelf: "flex-start", borderTopLeftRadius: 0 },
  inputRow: { display: "flex", gap: 8, padding: "8px 12px", background: WA.surface, borderTop: `1px solid ${WA.border}`, flexShrink: 0, paddingBottom: "max(8px,env(safe-area-inset-bottom))" },
  chatInput: { flex: 1, padding: "10px 14px", background: WA.surfaceAlt, border: "none", borderRadius: 24, color: WA.textPrimary, outline: "none" },
  sendBtn: { width: 44, height: 44, borderRadius: "50%", background: WA.green, border: "none", fontSize: 20, cursor: "pointer", color: WA.bg, fontWeight: 700, flexShrink: 0 },
  imgBtn: { width: 44, height: 44, borderRadius: "50%", background: WA.surfaceAlt, border: `1px solid ${WA.border}`, fontSize: 18, cursor: "pointer", flexShrink: 0 },

  empty: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  emptyText: { color: WA.textMuted, fontSize: 15, textAlign: "center", lineHeight: 1.6 },
  formWrap: { flex: 1, overflowY: "auto", padding: 24 },
  formTitle: { fontSize: 18, fontWeight: 700, color: WA.textPrimary, marginBottom: 16 },
  label: { fontSize: 12, color: WA.textMuted, display: "block", marginBottom: 4, marginTop: 14, textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { width: "100%", padding: "11px 14px", background: WA.surface, border: `1px solid ${WA.border}`, borderRadius: 10, color: WA.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "11px 14px", background: WA.surface, border: `1px solid ${WA.border}`, borderRadius: 10, color: WA.textPrimary, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" },
  emojiGrid: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 },
  emojiBtn: { fontSize: 22, padding: 8, background: WA.surface, border: `1px solid ${WA.border}`, borderRadius: 8, cursor: "pointer" },
  emojiBtnActive: { borderColor: WA.green, background: `${WA.green}18` },
  formBtns: { display: "flex", gap: 10, marginTop: 24 },
  cancelBtn: { flex: 1, padding: "12px 0", background: "transparent", border: `1px solid ${WA.border}`, borderRadius: 8, color: WA.textMuted, fontSize: 14, cursor: "pointer" },
  createBtn: { flex: 2, padding: "12px 0", background: WA.green, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", color: WA.bg },
  dimText: { color: WA.textMuted, fontSize: 14, padding: "20px 16px" },
}
