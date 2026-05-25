"use client"
import { useState } from "react"

export default function Home() {
  const [characters, setCharacters] = useState<any[]>([]) 
  const [activeChar, setActiveChar] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newChar, setNewChar] = useState({ name: "", emoji: "🤖", personality: "", speakingStyle: "" })

  async function sendMessage() {
    if (!input.trim() || !activeChar || loading) return
    const newMessages = [...messages, { role: "user", content: input }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages, systemPrompt: activeChar.systemPrompt })
    })
    const data = await res.json()
    setMessages([...newMessages, { role: "assistant", content: data.reply }])
    setLoading(false)
  }

  function createCharacter() {
    if (!newChar.name.trim() || !newChar.personality.trim()) return
    const systemPrompt = `You are ${newChar.name}. ${newChar.personality}. ${newChar.speakingStyle ? "Speaking style: " + newChar.speakingStyle + "." : ""} Keep replies under 100 words. Never break character.`
    const created = {
      id: Date.now().toString(),
      name: newChar.name,
      emoji: newChar.emoji,
      systemPrompt
    }
    setCharacters([...characters, created])
    setActiveChar(created)
    setMessages([])
    setNewChar({ name: "", emoji: "🤖", personality: "", speakingStyle: "" })
    setShowForm(false)
  }

  return (
    <div style={{
      display: "flex", height: "100vh",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      background: "#0f0f13", color: "#e8e8f0"
    }}>

      {/* Sidebar */}
      <div style={{
        width: "240px", background: "#16161e",
        borderRight: "1px solid #2a2a3a",
        display: "flex", flexDirection: "column", padding: "0"
      }}>
        <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #2a2a3a" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", color: "#666", textTransform: "uppercase", margin: 0 }}>
            Characters
          </p>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
          {characters.map(c => (
            <div
              key={c.id}
              onClick={() => { setActiveChar(c); setMessages([]) }}
              style={{
                padding: "10px 12px",
                marginBottom: "4px",
                borderRadius: "10px",
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: "10px",
                background: activeChar?.id === c.id ? "#2a2a3a" : "transparent",
                border: activeChar?.id === c.id ? "1px solid #3a3a5a" : "1px solid transparent",
                transition: "all 0.15s"
              }}
              onMouseEnter={e => { if (activeChar?.id !== c.id) (e.currentTarget as HTMLElement).style.background = "#1e1e28" }}
              onMouseLeave={e => { if (activeChar?.id !== c.id) (e.currentTarget as HTMLElement).style.background = "transparent" }}
            >
              <span style={{ fontSize: "22px", lineHeight: 1 }}>{c.emoji}</span>
              <span style={{ fontSize: "13.5px", fontWeight: 500, color: activeChar?.id === c.id ? "#c8c8ff" : "#b0b0c8" }}>
                {c.name}
              </span>
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 8px", borderTop: "1px solid #2a2a3a" }}>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              width: "100%", padding: "10px",
              background: showForm ? "#2a2a3a" : "#5b5bd6",
              color: "white", border: "none", borderRadius: "10px",
              cursor: "pointer", fontSize: "13px", fontWeight: 600,
              letterSpacing: "0.02em", transition: "background 0.15s"
            }}
          >
            {showForm ? "✕ Cancel" : "+ New Character"}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Header */}
        {activeChar && (
          <div style={{
            padding: "14px 24px", borderBottom: "1px solid #2a2a3a",
            background: "#16161e", display: "flex", alignItems: "center", gap: "12px"
          }}>
            <span style={{ fontSize: "28px" }}>{activeChar.emoji}</span>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "15px", color: "#e8e8f0" }}>{activeChar.name}</p>
              <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>AI Character · Online</p>
            </div>
          </div>
        )}

        {/* Create character form */}
        {showForm && (
          <div style={{
            padding: "20px 24px", borderBottom: "1px solid #2a2a3a",
            background: "#13131a"
          }}>
            <p style={{ fontWeight: 600, fontSize: "14px", marginBottom: "14px", color: "#c8c8ff" }}>
              Create a character
            </p>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <input
                placeholder="🤖"
                value={newChar.emoji}
                onChange={e => setNewChar({ ...newChar, emoji: e.target.value })}
                style={{
                  width: "64px", padding: "9px", borderRadius: "8px", fontSize: "20px",
                  background: "#1e1e28", border: "1px solid #2a2a3a", color: "#e8e8f0",
                  textAlign: "center", outline: "none"
                }}
              />
              <input
                placeholder="Character name"
                value={newChar.name}
                onChange={e => setNewChar({ ...newChar, name: e.target.value })}
                style={{
                  flex: 1, padding: "9px 12px", borderRadius: "8px",
                  background: "#1e1e28", border: "1px solid #2a2a3a",
                  color: "#e8e8f0", fontSize: "14px", outline: "none"
                }}
              />
            </div>
            <textarea
              placeholder="Personality & backstory — be detailed! (e.g. A sarcastic witch, 500 years old, tired of love potion requests)"
              value={newChar.personality}
              onChange={e => setNewChar({ ...newChar, personality: e.target.value })}
              rows={2}
              style={{
                width: "100%", padding: "9px 12px", borderRadius: "8px",
                background: "#1e1e28", border: "1px solid #2a2a3a",
                color: "#e8e8f0", fontSize: "13px", resize: "none",
                fontFamily: "inherit", outline: "none", boxSizing: "border-box"
              }}
            />
            <textarea
              placeholder="Speaking style (e.g. dramatic, uses 'mortal', old English)"
              value={newChar.speakingStyle}
              onChange={e => setNewChar({ ...newChar, speakingStyle: e.target.value })}
              rows={2}
              style={{
                width: "100%", marginTop: "8px", padding: "9px 12px", borderRadius: "8px",
                background: "#1e1e28", border: "1px solid #2a2a3a",
                color: "#e8e8f0", fontSize: "13px", resize: "none",
                fontFamily: "inherit", outline: "none", boxSizing: "border-box"
              }}
            />
            <button
              onClick={createCharacter}
              style={{
                marginTop: "12px", padding: "9px 20px",
                background: "#5b5bd6", color: "white", border: "none",
                borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600
              }}
            >
              Create & Chat →
            </button>
          </div>
        )}

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "24px",
          display: "flex", flexDirection: "column", gap: "14px"
        }}>
          {!activeChar && !showForm && (
            <div style={{ margin: "auto", textAlign: "center", color: "#444" }}>
              <p style={{ fontSize: "40px", marginBottom: "12px" }}>💬</p>
              <p style={{ fontSize: "15px", fontWeight: 500, color: "#666" }}>Pick a character to start chatting</p>
              <p style={{ fontSize: "13px", color: "#444", marginTop: "6px" }}>or create your own</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              gap: "10px", alignItems: "flex-end"
            }}>
              {m.role === "assistant" && (
                <span style={{ fontSize: "22px", flexShrink: 0, marginBottom: "2px" }}>{activeChar?.emoji}</span>
              )}
              <div style={{
                background: m.role === "user" ? "#5b5bd6" : "#1e1e2e",
                color: "#e8e8f0",
                padding: "10px 14px",
                borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                maxWidth: "460px", fontSize: "14px", lineHeight: "1.6",
                border: m.role === "assistant" ? "1px solid #2a2a3a" : "none"
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
              <span style={{ fontSize: "22px" }}>{activeChar?.emoji}</span>
              <div style={{
                background: "#1e1e2e", border: "1px solid #2a2a3a",
                padding: "12px 16px", borderRadius: "18px 18px 18px 4px",
                display: "flex", gap: "5px", alignItems: "center"
              }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: "#666", display: "inline-block",
                    animation: `pulse 1.2s ${i * 0.2}s infinite`
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{
          padding: "16px 24px", borderTop: "1px solid #2a2a3a",
          background: "#16161e", display: "flex", gap: "10px", alignItems: "center"
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder={activeChar ? `Message ${activeChar.name}...` : "Pick a character first"}
            disabled={!activeChar}
            style={{
              flex: 1, padding: "11px 16px", borderRadius: "12px",
              background: "#1e1e28", border: "1px solid #2a2a3a",
              color: "#e8e8f0", fontSize: "14px", outline: "none",
              fontFamily: "inherit"
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!activeChar || loading}
            style={{
              padding: "11px 20px", background: "#5b5bd6", color: "white",
              border: "none", borderRadius: "12px", cursor: "pointer",
              fontSize: "14px", fontWeight: 600, opacity: (!activeChar || loading) ? 0.4 : 1,
              transition: "opacity 0.15s"
            }}
          >
            Send
          </button>
        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        input::placeholder, textarea::placeholder { color: #444; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 4px; }
      `}</style>
    </div>
  )
}