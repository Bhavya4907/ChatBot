"use client"
import { useRef, useState } from "react"
import { supabase } from "../lib/supabase"
import { S, WA } from "../styles"
import { showNotification } from "../lib/helpers"

interface Props {
  session: any
  activeChar: any
  messages: any[]
  setMessages: (msgs: any) => void
  onBack: () => void
  creating: boolean
  setCreating: (v: boolean) => void
}

export default function ChatWindow({
  session, activeChar, messages, setMessages, onBack, creating, setCreating
}: Props) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [generatingImg, setGeneratingImg] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function sendMessage() {
    if (!input.trim() || !activeChar || loading || !session) return
    const userMsg = { role:"user", content:input, character_id:activeChar.id, user_id:session.user.id }
    setMessages((prev: any) => [...prev, { ...userMsg, id:"temp-user" }])
    setInput(""); setLoading(true)

    try {
      await supabase.from("messages").insert(userMsg)
      const history = [...messages, userMsg].map(m => ({ role:m.role, content:m.content }))
      const res = await fetch("https://chat-bot-k6kp.vercel.app/api/chat", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ messages:history, systemPrompt:activeChar.system_prompt })
      })
      const data = await res.json()
      const aiMsg = { role:"assistant", content:data.reply, character_id:activeChar.id, user_id:session.user.id }
      await supabase.from("messages").insert(aiMsg)
      setMessages((prev: any) => [...prev.filter((m: any) => m.id !== "temp-user"), userMsg, { ...aiMsg, id:"temp-ai" }])
      showNotification(activeChar.name, data.reply)
    } catch (err) {
      console.error("sendMessage error:", err)
      setMessages((prev: any) => prev.filter((m: any) => m.id !== "temp-user"))
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateImage() {
    if (!input.trim() || !activeChar || !session) return
    setGeneratingImg(true)
    try {
      const res = await fetch("https://chat-bot-k6kp.vercel.app/api/generate-image", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ prompt: input }),
      })
      if (!res.ok) throw new Error(`Status: ${res.status}`)
      const data = await res.json()
      const msg = { role:"assistant", content:`[image]:${data.url}`, character_id:activeChar.id, user_id:session.user.id }
      await supabase.from("messages").insert(msg)
      setMessages((prev: any) => [...prev, { ...msg, id:"temp-img" }])
    } catch (err) {
      console.error("generateImage error:", err)
    } finally {
      setGeneratingImg(false)
    }
  }

  async function createReplica() {
    if (!session) return
    setCreating(true)
    const { data: msgs } = await supabase
      .from("messages")
      .select("content")
      .eq("user_id", session.user.id)
      .eq("role", "user")
      .order("created_at", { ascending: true })
      .limit(200)

    if (!msgs || msgs.length < 5) {
      alert("Send at least 5 messages before creating a replica!")
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
      .eq("replica_of", session.user.id)
      .eq("created_by", session.user.id)

    const { data: char, error } = await supabase.from("characters")
      .insert({
        name: `${session.user.email?.split("@")[0]}'s Replica`,
        emoji: "🪞",
        system_prompt,
        created_by: session.user.id,
        is_replica: true,
        replica_of: session.user.id
      })
      .select().single()

    if (!error && char) {
      setMessages([])
    }
    setCreating(false)
  }

  return (
    <div style={S.chatWrap}>
      <div style={S.chatHeader}>
        <button className="cc-back-btn" style={S.backBtn} onClick={onBack}>←</button>
        <span style={{ fontSize:26 }}>{activeChar.emoji}</span>
        <div style={{ flex:1 }}>
          <div style={S.chatName}>{activeChar.name}</div>
          <div style={S.chatSub}>AI · your chat is private</div>
        </div>
      </div>
      <div className="cc-messages" style={S.messages}>
        {messages.length === 0 && (
          <p style={S.dimText}>Start the conversation with {activeChar.name}…</p>
        )}
        {messages.map((m: any, i: number) => {
          const isImage = m.content?.startsWith("[image]:")
          const imageUrl = isImage ? m.content.replace("[image]:","") : null
          return (
            <div key={m.id ?? i} className="cc-bubble"
              style={{ ...S.bubble, ...(m.role==="user" ? S.bubbleUser : S.bubbleAI) }}>
              {isImage
                ? <img src={imageUrl!} style={{ width:"100%", maxWidth:240, borderRadius:10, display:"block" }} />
                : m.content}
            </div>
          )
        })}
        {loading && (
          <div className="cc-bubble" style={{ ...S.bubble, ...S.bubbleAI, opacity:0.5 }}>
            <span style={{ letterSpacing:2, color:WA.textMuted }}>●●●</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={S.inputRow}>
        <input className="cc-chat-input" style={S.chatInput} value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==="Enter" && sendMessage()}
          placeholder={`Message ${activeChar.name}…`} />
        <button style={S.imgBtn} onClick={handleGenerateImage} disabled={!input.trim() || generatingImg}>
          {generatingImg ? "⏳" : "🖼️"}
        </button>
        <button style={S.sendBtn} onClick={sendMessage} disabled={loading || !input.trim()}>↑</button>
      </div>
    </div>
  )
}