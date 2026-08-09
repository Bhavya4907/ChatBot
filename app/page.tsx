"use client"
import { useEffect, useRef, useState } from "react"
import { supabase } from "../src/lib/supabase"
import { requestNotificationPermission, showNotification } from "../src/lib/helpers"
import AuthScreen from "../src/components/AuthScreen"
import Sidebar from "../src/components/Sidebar"
import ChatWindow from "../src/components/ChatWindow"
import DMWindow from "../src/components/DMWIndow"
import CharacterForm from "../src/components/CharacterForm"
import ProfileForm from "../src/components/ProfileForm"
import ElectricBorder from "../src/components/ElectricBorder"
import { T } from "../src/styles"

export default function Home() {
  const [session,       setSession]       = useState<any>(null)
  const [characters,    setCharacters]    = useState<any[]>([])
  const [activeChar,    setActiveChar]    = useState<any>(null)
  const [messages,      setMessages]      = useState<any[]>([])
  const [charsLoading,  setCharsLoading]  = useState(true)
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConvo,   setActiveConvo]   = useState<any>(null)
  const [allProfiles,   setAllProfiles]   = useState<any[]>([])
  const [searchEmail,   setSearchEmail]   = useState("")
  const [searchResult,  setSearchResult]  = useState<any>(null)
  const [view,          setView]          = useState<"ai"|"people">("ai")
  const [showForm,      setShowForm]      = useState(false)
  const [showProfile,   setShowProfile]   = useState(false)
  const [profile,       setProfile]       = useState<any>(null)
  const [creating,      setCreating]      = useState(false)
  const [chatOpen,      setChatOpen]      = useState(false)

  // ── Auth ─────────────────────────────────────────────────────
  useEffect(() => {
    requestNotificationPermission()
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user?.id) initPushNotifications(data.session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s?.user?.id) initPushNotifications(s.user.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function initPushNotifications(userId: string) {
    if (!(window as any).Capacitor) return
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications')
      const permission = await PushNotifications.requestPermissions()
      if (permission.receive !== 'granted') return
      await PushNotifications.register()
      PushNotifications.addListener('registration', token => {
        supabase.from("profiles")
          .update({ push_token: token.value })
          .eq("id", userId)
          .then(() => {})
      })
    } catch (err) {
      console.log('Push notifications not available:', err)
    }
  }

  // ── Load characters ───────────────────────────────────────────
  useEffect(() => {
    if (!session) return
    setCharsLoading(true)
    supabase.from("characters").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setCharacters(data || []); setCharsLoading(false) })
  }, [session])

  // ── Load messages for active character ────────────────────────
  useEffect(() => {
    if (!activeChar || !session) { setMessages([]); return }
    supabase.from("messages").select("*")
      .eq("character_id", activeChar.id).eq("user_id", session.user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages(data || []))
  }, [activeChar, session])

  // ── Load conversations ────────────────────────────────────────
  useEffect(() => {
    if (!session) return
    supabase
      .from("conversations")
      .select("*")
      .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
      .order("created_at", { ascending: false })
      .then(async ({ data }) => {
        if (!data) return
        const ids = [...new Set(data.flatMap(c => [c.user1_id, c.user2_id]))]
        const { data: profiles } = await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", ids)
        const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]))
        const enriched = data.map(c => ({
          ...c,
          user1: profileMap[c.user1_id] || null,
          user2: profileMap[c.user2_id] || null,
        }))
        setConversations(enriched)
      })
  }, [session])

  // ── Load profile ──────────────────────────────────────────────
  useEffect(() => {
    if (!session) return
    supabase.from("profiles").select("*").eq("id", session.user.id).single()
      .then(({ data }) => { if (data) setProfile(data) })
  }, [session])

  // ── Online status + all profiles ─────────────────────────────
  useEffect(() => {
    if (!session) return

    supabase.from("profiles")
      .update({ is_online: true, last_seen: new Date().toISOString() })
      .eq("id", session.user.id).then(() => {})

    supabase.from("profiles").select("*")
      .neq("id", session.user.id)
      .order("is_online", { ascending: false })
      .then(({ data }) => setAllProfiles(data || []))

    const ch = supabase
      .channel("profiles-online")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" },
        (p) => {
          setAllProfiles(prev => prev.map(profile =>
            profile.id === p.new.id ? { ...profile, ...p.new } : profile
          ))
        })
      .subscribe()

    const handleOffline = () => {
      supabase.from("profiles")
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq("id", session.user.id).then(() => {})
    }
    window.addEventListener("beforeunload", handleOffline)

    const heartbeat = setInterval(() => {
      supabase.from("profiles")
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq("id", session.user.id).then(() => {})
    }, 30000)

    return () => {
      supabase.removeChannel(ch)
      window.removeEventListener("beforeunload", handleOffline)
      clearInterval(heartbeat)
      handleOffline()
    }
  }, [session])

  // ── Global DM notifications ───────────────────────────────────
  useEffect(() => {
    if (!session) return
    const ch = supabase
      .channel("global-dm-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" },
        (p) => {
          if (p.new.sender_id === session.user.id) return
          if (activeConvo?.id === p.new.conversation_id) return
          const convo = conversations.find(c => c.id === p.new.conversation_id)
          if (!convo) return
          const other = convo.user1_id === session.user.id ? convo.user2 : convo.user1
          const name = other?.display_name || other?.username || "Someone"
          const isImage = p.new.content?.startsWith("[image]:")
          showNotification(`New message from ${name}`, isImage ? "📷 Sent an image" : p.new.content)
        })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [session, conversations, activeConvo])

  // ── Navigation ────────────────────────────────────────────────
  function openChar(c: any) {
    setActiveChar(c); setShowForm(false); setActiveConvo(null)
    setShowProfile(false); setChatOpen(true)
  }
  function openConvo(c: any) {
    setActiveConvo(c); setActiveChar(null); setShowForm(false)
    setShowProfile(false); setChatOpen(true)
  }
  function openForm() {
    setShowForm(true); setActiveChar(null); setActiveConvo(null)
    setShowProfile(false); setChatOpen(true)
  }
  function goBack() { setChatOpen(false) }

  // ── Actions ───────────────────────────────────────────────────
  async function searchUser() {
    if (!searchEmail.trim()) return
    const { data } = await supabase.from("profiles").select("*")
      .ilike("username", `%${searchEmail}%`)
      .neq("id", session.user.id).limit(5)
    setSearchResult(data?.[0] || null)
  }

  async function startConversation(otherUserId: string) {
    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .or(`and(user1_id.eq.${session.user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${session.user.id})`)
      .maybeSingle()

    if (existing) {
      const ids = [existing.user1_id, existing.user2_id]
      const { data: profiles } = await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", ids)
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]))
      openConvo({ ...existing, user1: profileMap[existing.user1_id], user2: profileMap[existing.user2_id] })
      return
    }

    const { data } = await supabase
      .from("conversations")
      .insert({ user1_id: session.user.id, user2_id: otherUserId })
      .select("*")
      .single()

    if (data) {
      const ids = [data.user1_id, data.user2_id]
      const { data: profiles } = await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", ids)
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]))
      const enriched = { ...data, user1: profileMap[data.user1_id], user2: profileMap[data.user2_id] }
      setConversations(prev => [enriched, ...prev])
      openConvo(enriched)
    }
  }

  async function deleteCharacter(id: string) {
    await supabase.from("characters").delete().eq("id", id)
    setCharacters(prev => prev.filter(c => c.id !== id))
    if (activeChar?.id === id) { setActiveChar(null); setMessages([]) }
  }

  // ── Auth guard ────────────────────────────────────────────────
  if (!session) return <AuthScreen />

  // ── Main app ──────────────────────────────────────────────────
  return (
    <div className={`cc-app${chatOpen ? " chat-open" : ""}`}>

      <Sidebar
        session={session}
        view={view}
        setView={setView}
        characters={characters}
        charsLoading={charsLoading}
        activeChar={activeChar}
        activeConvo={activeConvo}
        conversations={conversations}
        allProfiles={allProfiles}
        showForm={showForm}
        searchEmail={searchEmail}
        setSearchEmail={setSearchEmail}
        searchResult={searchResult}
        onOpenChar={openChar}
        onOpenConvo={openConvo}
        onOpenForm={openForm}
        onOpenProfile={() => { setShowProfile(true); setChatOpen(true) }}
        onStartConversation={startConversation}
        onSearchUser={searchUser}
        onDeleteCharacter={deleteCharacter}
        onSignOut={() => supabase.auth.signOut()}
      />

      <main className="cc-main">
        {view === "people" && activeConvo ? (
          <DMWindow
            session={session}
            activeConvo={activeConvo}
            allProfiles={allProfiles}
            onBack={goBack}
            creating={creating}
            setCreating={setCreating}
            onReplicaCreated={(char) => {
              setCharacters(prev => [char, ...prev.filter(c => c.replica_of !== char.replica_of)])
              setView("ai")
              openChar(char)
            }}
          />

        ) : view === "people" && !activeConvo ? (
          /* ── People empty state ─────────────────────────────── */
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
            background: T.bgAlt,
            fontFamily: T.font,
          }}>
            <ElectricBorder
              color="#a855f7"
              speed={1}
              chaos={0.12}
              borderRadius={20}
              style={{
                background: "rgba(22, 22, 22, 0.9)",
                backdropFilter: "blur(16px)",
                padding: "36px 32px",
                maxWidth: 360,
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  background: "rgba(168,85,247,0.12)",
                  border: "1px solid rgba(168,85,247,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  boxShadow: "0 0 32px rgba(168,85,247,0.18)",
                }}>◉</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 6, letterSpacing: "-0.02em" }}>
                    Connect with People
                  </div>
                  <p style={{ color: T.muted, fontSize: 13, textAlign: "center", lineHeight: 1.7, margin: 0 }}>
                    Search for someone by username or select an existing direct message to start chatting.
                  </p>
                </div>
              </div>
            </ElectricBorder>
          </div>

        ) : showProfile ? (
          <ProfileForm
            session={session}
            profile={profile}
            onSaved={(updated) => {
              setProfile(updated)
              setShowProfile(false)
              goBack()
            }}
            onCancel={() => { setShowProfile(false); goBack() }}
          />

        ) : showForm ? (
          <CharacterForm
            session={session}
            onCreated={(char) => {
              setCharacters(prev => [char, ...prev])
              openChar(char)
              setMessages([])
            }}
            onCancel={() => { setShowForm(false); goBack() }}
          />

        ) : !activeChar ? (
          /* ── AI empty state ─────────────────────────────────── */
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
            background: T.bgAlt,
            fontFamily: T.font,
          }}>
            <ElectricBorder
              color="hsl(119, 99%, 46%)"
              speed={1.2}
              chaos={0.14}
              borderRadius={20}
              style={{
                background: "rgba(22, 22, 22, 0.9)",
                backdropFilter: "blur(16px)",
                padding: "40px 36px",
                maxWidth: 380,
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  background: "hsla(119,99%,46%,0.12)",
                  border: "1px solid hsla(119,99%,46%,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  boxShadow: "0 0 32px hsla(119,99%,46%,0.2)",
                }}>✦</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 6, letterSpacing: "-0.02em" }}>
                    SENTINEL / Kikar <span style={{ color: T.primary }}>AI</span>
                  </div>
                  <p style={{ color: T.muted, fontSize: 13, textAlign: "center", lineHeight: 1.7, margin: 0 }}>
                    Select an AI persona from the sidebar or create your own custom character.
                  </p>
                </div>
                <button
                  onClick={openForm}
                  style={{
                    marginTop: 8,
                    padding: "12px 28px",
                    background: "linear-gradient(135deg, hsl(119,99%,46%) 0%, hsl(119,99%,38%) 100%)",
                    border: "none",
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    color: T.primaryFg,
                    fontFamily: T.font,
                    letterSpacing: "0.01em",
                    boxShadow: "0 4px 20px hsla(119,99%,46%,0.25)",
                    transition: "opacity 0.15s, transform 0.12s",
                  }}
                >+ Create Character</button>
              </div>
            </ElectricBorder>
          </div>

        ) : (
          <ChatWindow
            session={session}
            activeChar={activeChar}
            messages={messages}
            setMessages={setMessages}
            onBack={goBack}
            creating={creating}
            setCreating={setCreating}
          />
        )}
      </main>
    </div>
  )
}
