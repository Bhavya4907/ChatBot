"use client"
import { useState } from "react"
import { supabase } from "../lib/supabase"
import { T } from "../styles"
import ElectricBorder from "./ElectricBorder"

const EMOJIS = ["🤖", "🧙", "🦊", "🐉", "👾", "🧠", "🕵️", "🧜", "🦁", "🎭", "👻", "🤡", "🧛", "🦸", "🧝"]

interface Props {
  session: any
  onCreated: (char: any) => void
  onCancel: () => void
}

export default function CharacterForm({ session, onCreated, onCancel }: Props) {
  const [newChar, setNewChar] = useState({ name: "", emoji: "🤖", personality: "", speakingStyle: "" })
  const [creating, setCreating] = useState(false)

  async function createCharacter() {
    if (!newChar.name.trim() || !newChar.personality.trim() || !session) return
    setCreating(true)
    const system_prompt = `You are ${newChar.name}. ${newChar.personality}.${newChar.speakingStyle ? " Speaking style: " + newChar.speakingStyle + "." : ""} Keep replies under 100 words. Never break character.`
    const { data, error } = await supabase.from("characters")
      .insert({ name: newChar.name, emoji: newChar.emoji, system_prompt, created_by: session.user.id })
      .select().single()
    if (!error && data) onCreated(data)
    setNewChar({ name: "", emoji: "🤖", personality: "", speakingStyle: "" })
    setCreating(false)
  }

  return (
    <div style={{
      flex: 1,
      overflowY: "auto",
      padding: "24px 20px",
      background: T.bgAlt,
      fontFamily: T.font,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          className="cc-back-btn"
          onClick={onCancel}
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            background: T.surface,
            border: `1px solid ${T.border}`,
            color: T.text,
            fontSize: 16,
            cursor: "pointer",
            width: 34,
            height: 34,
            borderRadius: 8,
            flexShrink: 0,
          }}
        >←</button>

        <div>
          <h2 style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: T.text,
            letterSpacing: "-0.03em",
          }}>Create a Character</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: T.muted }}>
            Design an AI persona to chat with
          </p>
        </div>
      </div>

      {/* Electric Border Wrapped Character Preview Card */}
      <ElectricBorder
        color="hsl(119, 99%, 46%)"
        speed={1}
        chaos={0.1}
        borderRadius={16}
        style={{ marginBottom: 24 }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "18px 20px",
          background: T.surface,
          borderRadius: 16,
        }}>
          <div style={{
            width: 54,
            height: 54,
            borderRadius: 14,
            background: "hsla(119,99%,46%,0.15)",
            border: "1px solid hsla(119,99%,46%,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            boxShadow: "0 0 20px hsla(119,99%,46%,0.2)",
          }}>{newChar.emoji}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, color: newChar.name ? T.text : T.muted2, letterSpacing: "-0.02em" }}>
              {newChar.name || "Character name…"}
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>
              {newChar.personality ? newChar.personality.slice(0, 65) + (newChar.personality.length > 65 ? "…" : "") : "Personality preview…"}
            </div>
          </div>
        </div>
      </ElectricBorder>

      {/* Name */}
      <label style={{
        fontSize: 11,
        color: T.muted,
        display: "block",
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        fontWeight: 600,
      }}>Name</label>
      <input
        style={{
          width: "100%",
          padding: "12px 16px",
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          color: T.text,
          fontSize: 14,
          fontFamily: T.font,
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.18s, box-shadow 0.18s",
        }}
        placeholder="e.g. Socrates, Iron Man, Coach Yoda…"
        value={newChar.name}
        onChange={e => setNewChar({ ...newChar, name: e.target.value })}
      />

      {/* Emoji picker */}
      <label style={{
        fontSize: 11,
        color: T.muted,
        display: "block",
        margin: "20px 0 8px",
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        fontWeight: 600,
      }}>Pick an Emoji</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {EMOJIS.map(em => {
          const isSelected = newChar.emoji === em
          return (
            <button key={em}
              onClick={() => setNewChar({ ...newChar, emoji: em })}
              style={{
                fontSize: 22,
                padding: "8px 10px",
                background: isSelected ? "hsla(119,99%,46%,0.15)" : T.surface,
                border: isSelected
                  ? "1px solid hsla(119,99%,46%,0.6)"
                  : `1px solid ${T.border}`,
                borderRadius: 10,
                cursor: "pointer",
                transform: isSelected ? "scale(1.1)" : "scale(1)",
                boxShadow: isSelected ? "0 0 14px hsla(119,99%,46%,0.3)" : "none",
                transition: "all 0.15s ease",
              }}
            >{em}</button>
          )
        })}
      </div>

      {/* Personality */}
      <label style={{
        fontSize: 11,
        color: T.muted,
        display: "block",
        margin: "20px 0 6px",
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        fontWeight: 600,
      }}>Personality *</label>
      <textarea
        style={{
          width: "100%",
          padding: "12px 16px",
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          color: T.text,
          fontSize: 14,
          fontFamily: T.font,
          outline: "none",
          resize: "vertical",
          boxSizing: "border-box",
          transition: "border-color 0.18s, box-shadow 0.18s",
          minHeight: 80,
        }}
        rows={3}
        placeholder="e.g. A wise philosopher who questions everything and uses the Socratic method"
        value={newChar.personality}
        onChange={e => setNewChar({ ...newChar, personality: e.target.value })}
      />

      {/* Speaking style */}
      <label style={{
        fontSize: 11,
        color: T.muted,
        display: "block",
        margin: "20px 0 6px",
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        fontWeight: 600,
      }}>Speaking Style <span style={{ color: T.muted2, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
      <input
        style={{
          width: "100%",
          padding: "12px 16px",
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          color: T.text,
          fontSize: 14,
          fontFamily: T.font,
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.18s, box-shadow 0.18s",
        }}
        placeholder="e.g. Uses rhetorical questions, very formal, concise"
        value={newChar.speakingStyle}
        onChange={e => setNewChar({ ...newChar, speakingStyle: e.target.value })}
      />

      {/* Buttons */}
      <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: "13px 0",
            background: "transparent",
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            color: T.muted,
            fontSize: 13,
            fontFamily: T.font,
            fontWeight: 500,
            cursor: "pointer",
            transition: "border-color 0.18s, color 0.18s",
          }}
        >Cancel</button>

        <button
          onClick={createCharacter}
          disabled={creating || !newChar.name.trim() || !newChar.personality.trim()}
          style={{
            flex: 2,
            padding: "13px 0",
            background: creating || !newChar.name.trim() || !newChar.personality.trim()
              ? T.surface
              : "linear-gradient(135deg, hsl(119,99%,46%) 0%, hsl(119,99%,38%) 100%)",
            border: `1px solid ${creating || !newChar.name.trim() || !newChar.personality.trim() ? T.border : "transparent"}`,
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 14,
            fontFamily: T.font,
            cursor: creating || !newChar.name.trim() || !newChar.personality.trim() ? "not-allowed" : "pointer",
            color: creating || !newChar.name.trim() || !newChar.personality.trim() ? T.muted : T.primaryFg,
            letterSpacing: "0.01em",
            boxShadow: creating || !newChar.name.trim() || !newChar.personality.trim()
              ? "none"
              : "0 4px 20px hsla(119,99%,46%,0.25)",
            transition: "all 0.18s",
          }}
        >
          {creating ? "⏳ Creating…" : "✦ Create & Chat"}
        </button>
      </div>
    </div>
  )
}