"use client"
import { useEffect, useRef, useState } from "react"
import { supabase } from "../lib/supabase"
import { S, WA } from "../styles"
import { formatTime, formatDate, showNotification } from "../lib/helpers"

interface Props {
  session: any
  activeConvo: any
  allProfiles: any[]
  onBack: () => void
  creating: boolean
  setCreating: (v: boolean) => void
  onReplicaCreated: (char: any) => void
}

export default function DMWindow({
  session, activeConvo, allProfiles, onBack, creating, setCreating, onReplicaCreated
}: Props) {
  const [input, setInput] = useState("")
  const [directMessages, setDirectMessages] = useState<any[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const other = activeConvo.user1_id === session.user.id
    ? activeConvo.user2
    : activeConvo.user1
  const otherProfile = allProfiles.find((p: any) => p.id === other?.id)

  useEffect(() => {
    if (!activeConvo) return
    supabase.from("direct_messages").select("*")
      .eq("conversation_id", activeConvo.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setDirectMessages(data || []))

    // Mark messages as read
    supabase.from("direct_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", activeConvo.id)
      .neq("sender_id", session.user.id)
      .is("read_at", null)
      .then(() => {})

    const ch = supabase
      .channel(`convo-${activeConvo.id}`)
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"direct_messages" },
        (p) => {
          if (p.new.conversation_id === activeConvo.id) {
            setDirectMessages(prev => [...prev, p.new])
            if (p.new.sender_id !== session.user.id) {
              const name = otherProfile?.display_name || otherProfile?.username || "Someone"
              const isImage = p.new.content?.startsWith("[image]:")
              showNotification(name, isImage ? "📷 Sent an image" : p.new.content)
            }
          }
        })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [activeConvo])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [directMessages])

  async function sendDirectMessage() {
    if (!input.trim() || !activeConvo || !session) return
    setInput("")
    await supabase.from("direct_messages").insert({
      conversation_id: activeConvo.id,
      sender_id: session.user.id,
      content: input
    })
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !activeConvo || !session) return
    setUploadingImage(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${session.user.id}-${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName)
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
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function createReplica() {
    if (!session || !other) return
    setCreating(true)
    const { data: msgs } = await supabase
      .from("direct_messages")
      .select("content")
      .eq("conversation_id", activeConvo.id)
      .eq("sender_id", other.id)
      .order("created_at", { ascending: true })
      .limit(200)

    if (!msgs || msgs.length < 5) {
      alert(`${other.username} needs to send at least 5 messages first!`)
      setCreating(false)
      return
    }

    const sampleMessages = msgs.map((m: any) => m.content).join("\n")
    const res = await fetch("https://chat-bot-k6kp.vercel.app/api/chat", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        messages: [{ role:"user", content:`Analyze the writing style, personality, tone, vocabulary, and communication patterns from these messages. Write a system prompt (max 200 words) for an AI to perfectly impersonate this person.\n\nMessages:\n${sampleMessages}` }],
        systemPrompt: "You are an expert at analyzing writing styles. Return only the system prompt text, nothing else."
      })
    })
    const data = await res.json()
    const system_prompt = `${data.reply} Never break character. Match the original person's typical message length and style exactly.`

    await supabase.from("characters")
      .delete()
      .eq("replica_of", other.id)
      .eq("created_by", session.user.id)

    const { data: char, error } = await supabase.from("characters")
      .insert({
        name: `${other.display_name || other.username}'s Replica`,
        emoji: "🪞",
        system_prompt,
        created_by: session.user.id,
        is_replica: true,
        replica_of: other.id
      })
      .select().single()

    if (!error && char) onReplicaCreated(char)
    setCreating(false)
  }

  return (
    <div style={S.chatWrap}>
      <div style={S.chatHeader}>
        <button className="cc-back-btn" style={S.backBtn} onClick={onBack}>←</button>
        <div style={{ position:"relative", flexShrink:0 }}>
          {otherProfile?.avatar_url
            ? <img src={otherProfile.avatar_url} style={{ width:38, height:38, borderRadius:"50%", objectFit:"cover" }} />
            : <div style={{ width:38, height:38, borderRadius:"50%", background:WA.surfaceAlt, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>👤</div>
          }
          <div style={{ position:"absolute", bottom:0, right:0, width:10, height:10, borderRadius:"50%",
            background: otherProfile?.is_online ? "#22c55e" : "#6b7280",
            border:`2px solid ${WA.surface}` }} />
        </div>
        <div style={{ flex:1 }}>
          <div style={S.chatName}>{other?.display_name || other?.username}</div>
          <div style={{ fontSize:11, color: otherProfile?.is_online ? "#22c55e" : WA.textMuted }}>
            {otherProfile?.is_online ? "● Online" : "● Offline"}
          </div>
        </div>
        <button
          style={{
            background:"transparent", border:"1px solid #a855f7",
            borderRadius:8, color:"#a855f7", fontSize:12, fontWeight:600,
            cursor:"pointer", padding:"6px 10px", flexShrink:0,
            opacity: creating ? 0.5 : 1
          }}
          disabled={creating}
          onClick={createReplica}
        >
          {creating ? "⏳" : "🪞 Replica"}
        </button>
      </div>

      <div className="cc-messages" style={S.messages}>
        {directMessages.map((m: any, i: number) => {
          const isUser = m.sender_id === session.user.id
          const isImage = m.content?.startsWith("[image]:")
          const imageUrl = isImage ? m.content.replace("[image]:", "") : null
          const showDate = i === 0 || formatDate(m.created_at) !== formatDate(directMessages[i-1].created_at)
          return (
            <div key={i}>
              {showDate && (
                <div style={{ textAlign:"center", color:WA.textMuted, fontSize:11, margin:"8px 0" }}>
                  {formatDate(m.created_at)}
                </div>
              )}
              <div style={{ display:"flex", flexDirection:"column", alignItems: isUser ? "flex-end" : "flex-start" }}>
                <div className="cc-bubble"
                  style={{
                    ...S.bubble,
                    ...(isUser ? S.bubbleUser : S.bubbleAI),
                    ...(isImage ? { padding:4, background:"transparent" } : {})
                  }}>
                  {isImage
                    ? <img src={imageUrl!}
                        style={{ maxWidth:220, maxHeight:280, borderRadius:10, display:"block", cursor:"pointer" }}
                        onClick={() => window.open(imageUrl!, '_blank')} />
                    : m.content}
                </div>
                <div style={{ display:"flex", gap:4, alignItems:"center", marginTop:2 }}>
                  <span style={{ fontSize:10, color:WA.textMuted }}>
                    {m.created_at ? formatTime(m.created_at) : ""}
                  </span>
                  {isUser && (
                    <span style={{ fontSize:10, color: m.read_at ? WA.green : WA.textMuted }}>
                      {m.read_at ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div style={S.inputRow}>
        <input type="file" accept="image/*" style={{ display:"none" }}
          ref={fileInputRef} onChange={handleImageUpload} />
        <button style={S.imgBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}>
          {uploadingImage ? "⏳" : "🖼️"}
        </button>
        <input className="cc-chat-input" style={S.chatInput} value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==="Enter" && sendDirectMessage()}
          placeholder="Type a message…" />
        <button style={S.sendBtn} onClick={sendDirectMessage} disabled={!input.trim()}>↑</button>
      </div>
    </div>
  )
}