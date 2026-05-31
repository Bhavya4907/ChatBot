"use client"
import { useState } from "react"
import { supabase } from "../lib/supabase"
import { S, WA } from "../styles"

interface Props {
  session: any
  profile: any
  onSaved: (profile: any) => void
  onCancel: () => void
}

export default function ProfileForm({ session, profile, onSaved, onCancel }: Props) {
  const [editProfile, setEditProfile] = useState({
    display_name: profile?.display_name || "",
    bio: profile?.bio || "",
    avatar_url: profile?.avatar_url || ""
  })
  const [saving, setSaving] = useState(false)

  async function saveProfile() {
    setSaving(true)
    await supabase.from("profiles")
      .update({
        display_name: editProfile.display_name,
        bio: editProfile.bio,
        avatar_url: editProfile.avatar_url
      })
      .eq("id", session.user.id)
    onSaved({ ...profile, ...editProfile })
    setSaving(false)
  }

  return (
    <div style={S.formWrap}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <button className="cc-back-btn" style={S.backBtn} onClick={onCancel}>←</button>
        <h2 style={{ ...S.formTitle, marginBottom:0 }}>My Profile</h2>
      </div>

      {/* Avatar preview */}
      <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
        {editProfile.avatar_url
          ? <img src={editProfile.avatar_url}
              style={{ width:80, height:80, borderRadius:"50%", objectFit:"cover", border:`2px solid ${WA.green}` }} />
          : <div style={{ width:80, height:80, borderRadius:"50%", background:WA.surfaceAlt,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>👤</div>
        }
      </div>

      <label style={S.label}>Avatar URL</label>
      <input style={S.input} placeholder="https://..."
        value={editProfile.avatar_url}
        onChange={e => setEditProfile({ ...editProfile, avatar_url: e.target.value })} />

      <label style={S.label}>Display Name</label>
      <input style={S.input} placeholder="Your name"
        value={editProfile.display_name}
        onChange={e => setEditProfile({ ...editProfile, display_name: e.target.value })} />

      <label style={S.label}>Bio</label>
      <textarea style={S.textarea} rows={3}
        placeholder="Tell people about yourself..."
        value={editProfile.bio}
        onChange={e => setEditProfile({ ...editProfile, bio: e.target.value })} />

      <div style={S.formBtns}>
        <button style={S.cancelBtn} onClick={onCancel}>Cancel</button>
        <button style={S.createBtn} onClick={saveProfile} disabled={saving}>
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </div>
  )
}