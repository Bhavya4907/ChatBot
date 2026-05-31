"use client"
import { useState } from "react"
import { supabase } from "../lib/supabase"
import { S, WA } from "../styles"

const EMOJIS = ["🤖","🧙","🦊","🐉","👾","🧠","🕵️","🧜","🦁","🎭","👻","🤡","🧛","🦸","🧝"]

interface Props {
  session: any
  onCreated: (char: any) => void
  onCancel: () => void
}

export default function CharacterForm({ session, onCreated, onCancel }: Props) {
  const [newChar, setNewChar] = useState({ name:"", emoji:"🤖", personality:"", speakingStyle:"" })
  const [creating, setCreating] = useState(false)

  async function createCharacter() {
    if (!newChar.name.trim() || !newChar.personality.trim() || !session) return
    setCreating(true)
    const system_prompt = `You are ${newChar.name}. ${newChar.personality}.${newChar.speakingStyle ? " Speaking style: " + newChar.speakingStyle + "." : ""} Keep replies under 100 words. Never break character.`
    const { data, error } = await supabase.from("characters")
      .insert({ name:newChar.name, emoji:newChar.emoji, system_prompt, created_by:session.user.id })
      .select().single()
    if (!error && data) onCreated(data)
    setNewChar({ name:"", emoji:"🤖", personality:"", speakingStyle:"" })
    setCreating(false)
  }

  return (
    <div style={S.formWrap}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <button className="cc-back-btn" style={S.backBtn} onClick={onCancel}>←</button>
        <h2 style={{ ...S.formTitle, marginBottom:0 }}>Create a Character</h2>
      </div>
      <label style={S.label}>Name</label>
      <input style={S.input} placeholder="e.g. Socrates"
        value={newChar.name} onChange={e => setNewChar({ ...newChar, name:e.target.value })} />
      <label style={S.label}>Pick an Emoji</label>
      <div style={S.emojiGrid}>
        {EMOJIS.map(em => (
          <button key={em}
            style={{ ...S.emojiBtn, ...(newChar.emoji===em ? S.emojiBtnActive : {}) }}
            onClick={() => setNewChar({ ...newChar, emoji:em })}>{em}
          </button>
        ))}
      </div>
      <label style={S.label}>Personality *</label>
      <textarea style={S.textarea} rows={3}
        placeholder="e.g. A wise philosopher who questions everything"
        value={newChar.personality}
        onChange={e => setNewChar({ ...newChar, personality:e.target.value })} />
      <label style={S.label}>Speaking Style (optional)</label>
      <input style={S.input} placeholder="e.g. Uses rhetorical questions, formal tone"
        value={newChar.speakingStyle}
        onChange={e => setNewChar({ ...newChar, speakingStyle:e.target.value })} />
      <div style={S.formBtns}>
        <button style={S.cancelBtn} onClick={onCancel}>Cancel</button>
        <button style={S.createBtn} onClick={createCharacter} disabled={creating}>
          {creating ? "Creating…" : "Create & Chat"}
        </button>
      </div>
    </div>
  )
}