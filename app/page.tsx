"use client"
import { useEffect, useRef, useState } from "react"
import { supabase } from "../src/lib/supabase"
import { CSS } from "../src/styles"
import { requestNotificationPermission, showNotification } from "../src/lib/helpers"
import AuthScreen from "../src/components/AuthScreen"
import Sidebar from "../src/components/Sidebar"
import ChatWindow from "../src/components/ChatWindow"
import DMWindow from "../src/components/DMWIndow"
import CharacterForm from "../src/components/CharacterForm"
import ProfileForm from "../src/components/ProfileForm"

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
  // Load conversations — no join, just raw IDs
  supabase
    .from("conversations")
    .select("*")
    .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
    .order("created_at", { ascending: false })
    .then(async ({ data }) => {
      if (!data) return
      // Enrich with profile data
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
      .on("postgres_changes", { event:"UPDATE", schema:"public", table:"profiles" },
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
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"direct_messages" },
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
  if (!session) return (
    <>
      <style>{CSS}</style>
      <AuthScreen />
    </>
  )

  // ── Main app ──────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
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
          {view==="people" && activeConvo ? (
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

          ) : view==="people" && !activeConvo ? (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, padding:24 }}>
              <div style={{ fontSize:48 }}>👥</div>
              <p style={{ color:"#8696a0", fontSize:15, textAlign:"center", lineHeight:1.6 }}>
                Search for someone,<br />or select a conversation.
              </p>
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
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, padding:24 }}>
              <div style={{ fontSize:48 }}>💬</div>
              <p style={{ color:"#8696a0", fontSize:15, textAlign:"center", lineHeight:1.6 }}>
                Select a character to start chatting,<br />or create your own.
              </p>
              <button style={{ flex:2, padding:"12px 24px", background:"#00a884", border:"none", borderRadius:8, fontWeight:700, fontSize:14, cursor:"pointer", color:"#111b21" }}
                onClick={openForm}>
                + New Character
              </button>
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
    </>
  )
}
