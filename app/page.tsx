"use client"
import React from "react";
import { useState } from "react"

export default function Home() {
  const [characters, setCharacters] = useState<any[]>([]) 
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
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
    background: "#0f0f13", color: "#e8e8f0",
    position: "relative", overflow: "hidden"
  }}>

    {/* Sidebar */}
    <div className={`sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{
      background: "#16161e",
      borderRight: "1px solid #2a2a3a",
      display: "flex", flexDirection: "column", padding: "0",
      height: "100%", zIndex: 10
    }}>
      <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #2a2a3a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", color: "#666", textTransform: "uppercase", margin: 0 }}>
          Characters
        </p>
        {/* Mobile close button inside sidebar */}
        <button 
          className="mobile-only-btn"
          onClick={() => setMobileMenuOpen(false)}
          style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer", fontSize: "16px" }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
        {characters.map(c => (
          <div
            key={c.id}
            onClick={() => { setActiveChar(c); setMessages([]); setMobileMenuOpen(false); }}
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
          onClick={() => { setShowForm(!showForm); if(!showForm) setMobileMenuOpen(false); }}
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
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>

      {/* Header */}
      <div style={{
        padding: "14px 20px", borderBottom: "1px solid #2a2a3a",
        background: "#16161e", display: "flex", alignItems: "center", gap: "12px",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
          {/* Mobile Hamburg Menu Trigger */}
          <button
            className="mobile-only-btn menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: "#1e1e28", border: "1px solid #2a2a3a", color: "#e8e8f0",
              padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "14px"
            }}
          >
            ☰
          </button>
          
          {activeChar ? (
            <>
              <span style={{ fontSize: "24px", flexShrink: 0 }}>{activeChar.emoji}</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "#e8e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeChar.name}</p>
                <p style={{ margin: 0, fontSize: "11px", color: "#666" }}>AI Character · Online</p>
              </div>
            </>
          ) : (
            <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "#666" }}>Character AI</p>
          )}
        </div>
      </div>

      {/* Create character form */}
      {showForm && (
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #2a2a3a",
          background: "#13131a", maxHeight: "60vh", overflowY: "auto"
        }}>
          <p style={{ fontWeight: 600, fontSize: "14px", marginBottom: "12px", color: "#c8c8ff" }}>
            Create a character
          </p>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              placeholder="🤖"
              value={newChar.emoji}
              onChange={e => setNewChar({ ...newChar, emoji: e.target.value })}
              style={{
                width: "54px", padding: "9px 0", borderRadius: "8px", fontSize: "18px",
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
                color: "#e8e8f0", fontSize: "14px", outline: "none", minWidth: 0
              }}
            />
          </div>
          <textarea
            placeholder="Personality & backstory — be detailed! (e.g. A sarcastic witch...)"
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
            placeholder="Speaking style (e.g. dramatic, uses 'mortal')"
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
              width: "100%", marginTop: "12px", padding: "10px 20px",
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
        flex: 1, overflowY: "auto", padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: "14px"
      }}>
        {!activeChar && !showForm && (
          <div style={{ margin: "auto", textAlign: "center", color: "#444", padding: "0 20px" }}>
            <p style={{ fontSize: "36px", marginBottom: "8px" }}>💬</p>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#666", margin: "0 0 4px" }}>Pick a character to start chatting</p>
            <p style={{ fontSize: "12px", color: "#444", margin: 0 }}>or create your own via the menu button.</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            gap: "8px", alignItems: "flex-end"
          }}>
            {m.role === "assistant" && (
              <span style={{ fontSize: "18px", flexShrink: 0, marginBottom: "2px" }}>{activeChar?.emoji}</span>
            )}
            <div style={{
              background: m.role === "user" ? "#5b5bd6" : "#1e1e2e",
              color: "#e8e8f0",
              padding: "10px 14px",
              borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              maxWidth: "85%", fontSize: "13.5px", lineHeight: "1.5",
              border: m.role === "assistant" ? "1px solid #2a2a3a" : "none",
              wordBreak: "break-word"
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>{activeChar?.emoji}</span>
            <div style={{
              background: "#1e1e2e", border: "1px solid #2a2a3a",
              padding: "10px 14px", borderRadius: "18px 18px 18px 4px",
              display: "flex", gap: "5px", alignItems: "center"
            }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: "5px", height: "5px", borderRadius: "50%",
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
        padding: "12px 16px", borderTop: "1px solid #2a2a3a",
        background: "#16161e", display: "flex", gap: "8px", alignItems: "center"
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder={activeChar ? `Message ${activeChar.name}...` : "Pick a character first"}
          disabled={!activeChar}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: "12px",
            background: "#1e1e28", border: "1px solid #2a2a3a",
            color: "#e8e8f0", fontSize: "14px", outline: "none",
            fontFamily: "inherit", minWidth: 0
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!activeChar || loading}
          style={{
            padding: "10px 16px", background: "#5b5bd6", color: "white",
            border: "none", borderRadius: "12px", cursor: "pointer",
            fontSize: "14px", fontWeight: 600, opacity: (!activeChar || loading) ? 0.4 : 1,
            transition: "opacity 0.15s", flexShrink: 0
          }}
        >
          Send
        </button>
      </div>

    </div>

    {/* Media Queries and Mobile overrides embedded natively in the style block */}
    <style>{`
      @keyframes pulse {
        0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
        40% { opacity: 1; transform: scale(1); }
      }
      input::placeholder, textarea::placeholder { color: #444; }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 4px; }

      /* Desktop layouts default */
      .sidebar {
        width: 240px;
        transition: transform 0.3s ease;
      }
      .mobile-only-btn {
        display: none !important;
      }

      /* Mobile Device Adjustments */
      @media (max-width: 768px) {
        .sidebar {
          position: absolute;
          left: 0;
          top: 0;
          width: 280px;
          transform: translateX(-100%);
          box-shadow: 5px 0 15px rgba(0,0,0,0.5);
        }
        .sidebar.open {
          transform: translateX(0);
        }
        .mobile-only-btn {
          display: inline-block !important;
        }
      }
    `}</style>
  </div>
)