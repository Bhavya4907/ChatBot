import { useState } from "react"
import { T, S } from "../styles"

interface Props {
  characters: any[]
  charsLoading: boolean
  session: any
  onOpenChar: (c: any) => void
  onOpenForm: () => void
  setView: (v: "ai" | "people") => void
  onOpenProfile: () => void
  onSignOut: () => void
}

export default function AIGridView({ 
  characters, charsLoading, session, onOpenChar, onOpenForm, setView, onOpenProfile, onSignOut 
}: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  
  const filteredChars = characters.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const replicas = filteredChars.filter(c => c.is_replica)
  const privateBots = filteredChars.filter(c => !c.is_replica && !c.is_public)
  const publicBots = filteredChars.filter(c => !c.is_replica && c.is_public)

  const renderCard = (c: any) => (
    <div
      key={c.id}
      style={S.botCard}
      onClick={() => onOpenChar(c)}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.transform = S.botCardHover.transform as string
        el.style.borderColor = S.botCardHover.borderColor as string
        el.style.background = S.botCardHover.background as string
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.transform = "translateY(0)"
        el.style.borderColor = T.border
        el.style.background = T.surface
      }}
    >
      <div style={S.botAvatar}>{c.emoji}</div>
      <div>
        <div style={S.botName}>{c.name}</div>
        {c.is_replica && (
          <div style={{ fontSize: 10, color: "#a855f7", marginTop: 2, fontWeight: 600 }}>
            🪞 Replica
          </div>
        )}
      </div>
      <div style={S.botDesc}>
        {c.system_prompt 
          ? c.system_prompt.replace(/You are .*?\. /i, "").substring(0, 120) + (c.system_prompt.length > 120 ? "..." : "")
          : "An AI Persona ready to chat."}
      </div>
    </div>
  )

  return (
    <div style={S.aiGridWrap}>
      <div style={S.aiGridHeader}>
        {/* Top Left: People Button */}
        <button
          onClick={() => setView("people")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "rgba(168,85,247,0.1)",
            border: "1px solid rgba(168,85,247,0.3)",
            borderRadius: 10,
            color: "#a855f7",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: T.font,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.background = "rgba(168,85,247,0.2)"
            el.style.borderColor = "rgba(168,85,247,0.5)"
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.background = "rgba(168,85,247,0.1)"
            el.style.borderColor = "rgba(168,85,247,0.3)"
          }}
        >
          <span>◉</span>
          <span>People</span>
        </button>

        {/* Center: Search Bar */}
        <div style={{ flex: 1, maxWidth: 400, margin: "0 24px" }}>
          <input
            style={{
              width: "100%",
              padding: "10px 16px",
              background: T.bgAlt,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              color: T.text,
              fontSize: 14,
              fontFamily: T.font,
              outline: "none",
            }}
            placeholder="Search AI personas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={e => e.target.style.borderColor = "hsla(119,99%,46%,0.5)"}
            onBlur={e => e.target.style.borderColor = T.border}
          />
        </div>

        {/* Top Right: Profile, Sign Out, Create */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={onOpenProfile}
            title="Profile"
            style={{
              width: 36,
              height: 36,
              background: T.bgAlt,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              color: T.muted,
              cursor: "pointer",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = T.borderHover
              ;(e.currentTarget as HTMLElement).style.color = T.text
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = T.border
              ;(e.currentTarget as HTMLElement).style.color = T.muted
            }}
          >👤</button>
          <button
            onClick={onSignOut}
            title="Sign out"
            style={{
              padding: "0 12px",
              height: 36,
              background: T.bgAlt,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              color: T.muted,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: T.font,
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.borderColor = "rgba(248,113,113,0.4)"
              el.style.color = T.red
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.borderColor = T.border
              el.style.color = T.muted
            }}
          >OUT</button>
          
          <button
            onClick={onOpenForm}
            style={{
              padding: "10px 20px",
              height: 36,
              background: "linear-gradient(135deg, hsl(119,99%,46%) 0%, hsl(119,99%,38%) 100%)",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              color: T.primaryFg,
              fontFamily: T.font,
              letterSpacing: "0.01em",
              boxShadow: "0 4px 16px hsla(119,99%,46%,0.2)",
              transition: "opacity 0.15s, transform 0.12s",
            }}
          >
            + Create
          </button>
        </div>
      </div>

      <div style={S.aiGridContainer}>
        {charsLoading ? (
          // Shimmers
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ ...S.botCard, background: "transparent", borderColor: "transparent" }}>
              <div className="shimmer" style={{ width: 56, height: 56, borderRadius: 14 }} />
              <div className="shimmer" style={{ height: 16, borderRadius: 6, width: "70%", marginTop: 4 }} />
              <div className="shimmer" style={{ height: 12, borderRadius: 6, width: "100%" }} />
              <div className="shimmer" style={{ height: 12, borderRadius: 6, width: "90%" }} />
            </div>
          ))
        ) : filteredChars.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
            <h3 style={{ fontSize: 18, color: T.text, fontWeight: 600, marginBottom: 8 }}>No AI personas found</h3>
            <p style={{ color: T.muted, fontSize: 14 }}>Try a different search or create a new character.</p>
          </div>
        ) : (
          <>
            {/* Replicas Section */}
            {replicas.length > 0 && (
              <>
                <div style={{ gridColumn: "1 / -1", fontSize: 15, fontWeight: 700, color: T.text, marginTop: 12, borderBottom: `1px solid ${T.border}`, paddingBottom: 8, display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.01em" }}>
                  <span>🪞</span> Your Replicas ({replicas.length})
                </div>
                {replicas.map(renderCard)}
              </>
            )}

            {/* Private Bots Section */}
            {privateBots.length > 0 && (
              <>
                <div style={{ gridColumn: "1 / -1", fontSize: 15, fontWeight: 700, color: T.text, marginTop: 24, borderBottom: `1px solid ${T.border}`, paddingBottom: 8, display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.01em" }}>
                  <span>🔒</span> Private Characters ({privateBots.length})
                </div>
                {privateBots.map(renderCard)}
              </>
            )}

            {/* Public Bots Section */}
            {publicBots.length > 0 && (
              <>
                <div style={{ gridColumn: "1 / -1", fontSize: 15, fontWeight: 700, color: T.text, marginTop: 24, borderBottom: `1px solid ${T.border}`, paddingBottom: 8, display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.01em" }}>
                  <span>🌍</span> Public Characters ({publicBots.length})
                </div>
                {publicBots.map(renderCard)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
