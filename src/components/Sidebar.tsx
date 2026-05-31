"use client"
import { S, WA } from "../styles"

interface Props {
  session: any
  view: "ai" | "people"
  setView: (v: "ai" | "people") => void
  characters: any[]
  charsLoading: boolean
  activeChar: any
  activeConvo: any
  conversations: any[]
  allProfiles: any[]
  showForm: boolean
  searchEmail: string
  setSearchEmail: (v: string) => void
  searchResult: any
  onOpenChar: (c: any) => void
  onOpenConvo: (c: any) => void
  onOpenForm: () => void
  onOpenProfile: () => void
  onStartConversation: (id: string) => void
  onSearchUser: () => void
  onDeleteCharacter: (id: string) => void
  onSignOut: () => void
}

export default function Sidebar({
  session, view, setView, characters, charsLoading,
  activeChar, activeConvo, conversations, allProfiles,
  showForm, searchEmail, setSearchEmail, searchResult,
  onOpenChar, onOpenConvo, onOpenForm, onOpenProfile,
  onStartConversation, onSearchUser, onDeleteCharacter, onSignOut
}: Props) {
  return (
    <aside className="cc-sidebar">

      {/* Top bar */}
      <div style={S.sideTop}>
        <span style={S.brand}>🤖 CharacterChat</span>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:11, color:WA.textMuted, maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {session.user.email?.split("@")[0]}
          </span>
          <button style={S.signOutBtn} onClick={onOpenProfile}>👤</button>
          <button style={S.signOutBtn} onClick={onSignOut}>Out</button>
        </div>
      </div>

      {/* AI / People tabs */}
      <div style={S.tabBar}>
        <button style={{ ...S.tabBtn, ...(view==="ai" ? S.tabBtnActive : {}) }}
          onClick={() => { setView("ai") }}>
          🤖 AI Characters
        </button>
        <button style={{ ...S.tabBtn, ...(view==="people" ? S.tabBtnActive : {}) }}
          onClick={() => { setView("people") }}>
          👥 People
        </button>
      </div>

      {/* AI list */}
      {view === "ai" ? (
        <div style={S.listWrap}>
          <button style={S.newCharBtn} onClick={onOpenForm}>+ New Character</button>
          <div className="cc-charlist" style={S.charList}>
            {charsLoading
              ? <p style={S.dimText}>Loading…</p>
              : characters.map(c => (
                <div key={c.id}
                  style={{ ...S.charItem, ...(activeChar?.id===c.id && !showForm ? S.charItemActive : {}) }}
                  onClick={() => onOpenChar(c)}>
                  <span style={S.charEmoji}>{c.emoji}</span>
                  <span style={S.charName}>{c.name}</span>
                  {c.created_by === session.user.id && (
                    <button style={S.delBtn}
                      onClick={e => { e.stopPropagation(); onDeleteCharacter(c.id) }}>✕</button>
                  )}
                </div>
              ))
            }
          </div>
        </div>

      ) : (
        /* People list */
        <div style={S.listWrap}>
          <div style={S.searchRow}>
            <input style={S.searchInput} placeholder="Search by username…"
              value={searchEmail} onChange={e => setSearchEmail(e.target.value)}
              onKeyDown={e => e.key==="Enter" && onSearchUser()} />
            <button style={S.searchBtn} onClick={onSearchUser}>→</button>
          </div>

          {searchResult && (
            <div style={{ ...S.charItem, background: WA.surfaceAlt }}
              onClick={() => onStartConversation(searchResult.id)}>
              <div style={{ position:"relative" }}>
                {searchResult.avatar_url
                  ? <img src={searchResult.avatar_url} style={{ width:38, height:38, borderRadius:"50%", objectFit:"cover" }} />
                  : <div style={{ width:38, height:38, borderRadius:"50%", background:WA.surface, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>👤</div>
                }
                <div style={{ position:"absolute", bottom:0, right:0, width:10, height:10, borderRadius:"50%",
                  background: searchResult.is_online ? "#22c55e" : WA.textMuted,
                  border:`2px solid ${WA.bg}` }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={S.charName}>{searchResult.display_name || searchResult.username}</div>
                <div style={{ fontSize:11, color: searchResult.is_online ? "#22c55e" : WA.textMuted }}>
                  {searchResult.is_online ? "Online" : "Offline"}
                </div>
              </div>
            </div>
          )}

          <div style={{ padding:"10px 16px 4px", fontSize:11, color:WA.textMuted, textTransform:"uppercase", letterSpacing:"0.5px", flexShrink:0 }}>
            All People ({allProfiles.length})
          </div>

          <div className="cc-charlist" style={S.charList}>
            {allProfiles.map(p => {
              const existingConvo = conversations.find(c =>
                (c.user1_id === session.user.id && c.user2_id === p.id) ||
                (c.user2_id === session.user.id && c.user1_id === p.id)
              )
              return (
                <div key={p.id}
                  style={{ ...S.charItem, ...(activeConvo?.id === existingConvo?.id ? S.charItemActive : {}) }}
                  onClick={() => onStartConversation(p.id)}>
                  <div style={{ position:"relative", flexShrink:0 }}>
                    {p.avatar_url
                      ? <img src={p.avatar_url} style={{ width:42, height:42, borderRadius:"50%", objectFit:"cover" }} />
                      : <div style={{ width:42, height:42, borderRadius:"50%", background:WA.surfaceAlt, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>👤</div>
                    }
                    <div style={{ position:"absolute", bottom:1, right:1, width:11, height:11, borderRadius:"50%",
                      background: p.is_online ? "#22c55e" : "#6b7280",
                      border:`2px solid ${WA.bg}` }} />
                  </div>
                  <div style={{ flex:1, overflow:"hidden" }}>
                    <div style={S.charName}>{p.display_name || p.username}</div>
                    <div style={{ fontSize:11, color: p.is_online ? "#22c55e" : WA.textMuted }}>
                      {p.is_online ? "Online" : p.last_seen
                        ? `Last seen ${new Date(p.last_seen).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}`
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
  )
}