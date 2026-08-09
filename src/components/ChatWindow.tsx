"use client"
import { useEffect, useRef, useState } from "react"
import { supabase } from "../lib/supabase"
import { T } from "../styles"
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function sendMessage() {
    if (!input.trim() || !activeChar || loading || !session) return
    const userMsg = { role: "user", content: input, character_id: activeChar.id, user_id: session.user.id }
    setMessages((prev: any) => [...prev, { ...userMsg, id: "temp-user" }])
    setInput(""); setLoading(true)

    try {
      await supabase.from("messages").insert(userMsg)
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
      const res = await fetch("https://chat-bot-k6kp.vercel.app/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, systemPrompt: activeChar.system_prompt })
      })
      const data = await res.json()
      const aiMsg = { role: "assistant", content: data.reply, character_id: activeChar.id, user_id: session.user.id }
      await supabase.from("messages").insert(aiMsg)
      setMessages((prev: any) => [...prev.filter((m: any) => m.id !== "temp-user"), userMsg, { ...aiMsg, id: "temp-ai" }])
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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      })
      if (!res.ok) throw new Error(`Status: ${res.status}`)
      const data = await res.json()
      const msg = { role: "assistant", content: `[image]:${data.url}`, character_id: activeChar.id, user_id: session.user.id }
      await supabase.from("messages").insert(msg)
      setMessages((prev: any) => [...prev, { ...msg, id: "temp-img" }])
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
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: `Analyze the writing style, personality, tone, vocabulary, and communication patterns from these messages. Write a system prompt (max 200 words) for an AI to perfectly impersonate this person.\n\nMessages:\n${sampleMessages}` }],
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
    <div style={{
      display: "flex",
      flexDirection: "column",
      flex: 1,
      overflow: "hidden",
      height: "100%",
      fontFamily: T.font,
    }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        flexShrink: 0,
      }}>
        <button
          className="cc-back-btn"
          onClick={onBack}
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            background: T.bgAlt,
            border: `1px solid ${T.border}`,
            color: T.text,
            fontSize: 16,
            cursor: "pointer",
            width: 34,
            height: 34,
            borderRadius: 8,
            flexShrink: 0,
            lineHeight: 1,
            fontFamily: T.font,
          }}
        >←</button>

        {/* Character avatar */}
        <div style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: "hsla(119,99%,46%,0.12)",
          border: "1px solid hsla(119,99%,46%,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          boxShadow: "0 0 16px hsla(119,99%,46%,0.15)",
          flexShrink: 0,
        }}>{activeChar.emoji}</div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text, letterSpacing: "-0.02em" }}>
            {activeChar.name}
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
            ✦ AI Character · your chat is private
          </div>
        </div>

        {/* Create Replica button */}
        <button
          disabled={creating}
          onClick={createReplica}
          style={{
            background: "transparent",
            border: "1px solid rgba(168,85,247,0.4)",
            borderRadius: 8,
            color: "#a855f7",
            fontSize: 12,
            fontWeight: 600,
            cursor: creating ? "not-allowed" : "pointer",
            padding: "7px 12px",
            flexShrink: 0,
            opacity: creating ? 0.5 : 1,
            fontFamily: T.font,
            transition: "background 0.15s, border-color 0.15s",
            letterSpacing: "0.01em",
          }}
          onMouseEnter={e => {
            if (!creating) {
              const el = e.currentTarget
              el.style.background = "rgba(168,85,247,0.12)"
              el.style.borderColor = "rgba(168,85,247,0.6)"
            }
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.background = "transparent"
            el.style.borderColor = "rgba(168,85,247,0.4)"
          }}
        >
          {creating ? "⏳ Creating…" : "🪞 My Replica"}
        </button>
      </div>

      {/* ── Messages ───────────────────────────────────────────── */}
      <div
        className="cc-messages"
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          background: T.bgAlt,
        }}
      >
        {messages.length === 0 && !loading && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            gap: 12,
            color: T.muted,
            fontSize: 13,
            textAlign: "center",
            lineHeight: 1.7,
            padding: 24,
          }}>
            <div style={{
              fontSize: 36,
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "hsla(119,99%,46%,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid hsla(119,99%,46%,0.2)",
            }}>{activeChar.emoji}</div>
            <div>
              <div style={{ fontWeight: 600, color: T.text, marginBottom: 4, fontSize: 14 }}>
                Start chatting with {activeChar.name}
              </div>
              Say hello or ask anything — this chat is just between you two.
            </div>
          </div>
        )}

        {messages.map((m: any, i: number) => {
          const isImage = m.content?.startsWith("[image]:")
          const imageUrl = isImage ? m.content.replace("[image]:", "") : null
          const isUser = m.role === "user"
          return (
            <div key={m.id ?? i}
              className="cc-bubble"
              style={{
                padding: isImage ? 4 : "10px 14px",
                borderRadius: 14,
                lineHeight: 1.55,
                fontSize: 14,
                wordBreak: "break-word",
                alignSelf: isUser ? "flex-end" : "flex-start",
                borderBottomRightRadius: isUser ? 4 : 14,
                borderBottomLeftRadius: isUser ? 14 : 4,
                background: isImage
                  ? "transparent"
                  : isUser
                  ? "linear-gradient(135deg, hsl(119,99%,46%) 0%, hsl(119,99%,38%) 100%)"
                  : T.surface,
                color: isUser ? T.primaryFg : T.text,
                border: isUser ? "none" : `1px solid ${T.border}`,
                boxShadow: isUser ? "0 2px 12px hsla(119,99%,46%,0.2)" : "none",
                fontWeight: isUser ? 500 : 400,
                animation: "fade-in 0.2s ease both",
                maxWidth: "65%",
              }}
            >
              {isImage
                ? <img src={imageUrl!} style={{ width: "100%", maxWidth: 240, borderRadius: 10, display: "block" }} />
                : m.content}
            </div>
          )
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="cc-bubble" style={{
            padding: "12px 16px",
            borderRadius: 14,
            borderBottomLeftRadius: 4,
            background: T.surface,
            border: `1px solid ${T.border}`,
            alignSelf: "flex-start",
            display: "flex",
            alignItems: "center",
            gap: 5,
            maxWidth: "65%",
          }}>
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        )}

        <div ref={bottomRef} style={{ height: 4 }} />
      </div>

      {/* ── Input Bar ──────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        gap: 8,
        padding: "10px 14px",
        background: T.surface,
        borderTop: `1px solid ${T.border}`,
        flexShrink: 0,
        paddingBottom: "max(10px,env(safe-area-inset-bottom))",
        alignItems: "center",
      }}>
        {/* Image generation button */}
        <button
          onClick={handleGenerateImage}
          disabled={!input.trim() || generatingImg}
          title="Generate image"
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: T.bgAlt,
            border: `1px solid ${T.border}`,
            fontSize: 17,
            cursor: !input.trim() || generatingImg ? "not-allowed" : "pointer",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: !input.trim() || generatingImg ? 0.5 : 1,
            transition: "border-color 0.15s, opacity 0.15s",
          }}
        >
          {generatingImg ? "⏳" : "🖼️"}
        </button>

        <input
          className="cc-chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder={`Message ${activeChar.name}…`}
          style={{
            flex: 1,
            padding: "11px 16px",
            background: T.bgAlt,
            border: `1px solid ${T.border}`,
            borderRadius: 999,
            color: T.text,
            outline: "none",
            fontSize: 14,
            fontFamily: T.font,
            transition: "border-color 0.18s, box-shadow 0.18s",
          }}
          onFocus={e => {
            e.target.style.borderColor = "hsla(119,99%,46%,0.4)"
            e.target.style.boxShadow = "0 0 0 3px hsla(119,99%,46%,0.07)"
          }}
          onBlur={e => {
            e.target.style.borderColor = T.border
            e.target.style.boxShadow = "none"
          }}
        />

        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: loading || !input.trim()
              ? T.surface
              : "linear-gradient(135deg, hsl(119,99%,46%), hsl(119,99%,38%))",
            border: `1px solid ${loading || !input.trim() ? T.border : "transparent"}`,
            fontSize: 17,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            color: loading || !input.trim() ? T.muted : T.primaryFg,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.18s",
            boxShadow: loading || !input.trim() ? "none" : "0 2px 12px hsla(119,99%,46%,0.3)",
          }}
        >↑</button>
      </div>
    </div>
  )
}