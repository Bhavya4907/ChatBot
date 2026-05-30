export const WA = {
  bg:          "#111b21",
  surface:     "#202c33",
  surfaceAlt:  "#2a3942",
  border:      "#2a3942",
  green:       "#00a884",
  greenDark:   "#005c4b",
  textPrimary: "#e9edef",
  textMuted:   "#8696a0",
  chatBg:      "#0b141a",
}

export const CSS = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; height: 100%; }
  .cc-app { display: flex; height: 100dvh; font-family: -apple-system,'Segoe UI',sans-serif; background: ${WA.bg}; color: ${WA.textPrimary}; overflow: hidden; }
  .cc-sidebar { width: 340px; flex-shrink: 0; display: flex; flex-direction: column; background: ${WA.bg}; border-right: 1px solid ${WA.border}; height: 100dvh; }
  .cc-main    { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: ${WA.chatBg}; height: 100dvh; }
  @media (max-width: 767px) {
    .cc-app     { position: relative; overflow: hidden; }
    .cc-sidebar { position: absolute; inset: 0; width: 100%; z-index: 10; transform: translateX(0); transition: transform 0.25s ease; }
    .cc-main    { position: absolute; inset: 0; width: 100%; z-index: 10; transform: translateX(100%); transition: transform 0.25s ease; }
    .cc-app.chat-open .cc-sidebar { transform: translateX(-100%); }
    .cc-app.chat-open .cc-main    { transform: translateX(0); }
  }
  .cc-charlist::-webkit-scrollbar, .cc-messages::-webkit-scrollbar { width: 4px; }
  .cc-charlist::-webkit-scrollbar-thumb, .cc-messages::-webkit-scrollbar-thumb { background: ${WA.surfaceAlt}; border-radius: 4px; }
  .cc-bubble { max-width: 65%; }
  @media (max-width: 767px) { .cc-bubble { max-width: 80%; } }
  .cc-messages { padding: 14px 10%; }
  @media (max-width: 767px) { .cc-messages { padding: 12px 4%; } }
  .cc-chat-input { font-size: 15px; }
  @media (max-width: 767px) { .cc-chat-input { font-size: 16px; } }
  .cc-back-btn { display: none; }
  @media (max-width: 767px) { .cc-back-btn { display: flex; } }
`

export const S: Record<string, React.CSSProperties> = {
  authWrap:      { minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:WA.bg, padding:16 },
  authCard:      { background:WA.surface, border:`1px solid ${WA.border}`, borderRadius:16, padding:"40px 28px", width:"100%", maxWidth:380, display:"flex", flexDirection:"column", gap:12 },
  authTitle:     { margin:0, textAlign:"center", fontSize:22, color:WA.textPrimary, fontWeight:700 },
  authSub:       { margin:0, textAlign:"center", color:WA.textMuted, fontSize:14 },
  authTabRow:    { display:"flex", borderRadius:8, overflow:"hidden", border:`1px solid ${WA.border}` },
  authTab:       { flex:1, padding:"10px 0", background:"transparent", border:"none", color:WA.textMuted, cursor:"pointer", fontSize:14 },
  authTabActive: { background:WA.surfaceAlt, color:WA.textPrimary, fontWeight:600 },
  authInput:     { width:"100%", padding:"11px 14px", background:WA.surfaceAlt, border:`1px solid ${WA.border}`, borderRadius:10, color:WA.textPrimary, fontSize:15, outline:"none", boxSizing:"border-box" },
  authBtn:       { padding:"14px 0", background:WA.green, border:"none", borderRadius:8, fontWeight:700, fontSize:15, cursor:"pointer", color:WA.bg, marginTop:4 },
  sideTop:       { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:WA.surface, flexShrink:0 },
  brand:         { fontWeight:700, fontSize:15, color:WA.textPrimary },
  signOutBtn:    { background:WA.surfaceAlt, border:`1px solid ${WA.border}`, color:WA.textMuted, fontSize:12, borderRadius:6, padding:"4px 10px", cursor:"pointer" },
  tabBar:        { display:"flex", borderBottom:`1px solid ${WA.border}`, flexShrink:0 },
  tabBtn:        { flex:1, padding:"11px 0", background:"transparent", border:"none", borderBottom:"2px solid transparent", color:WA.textMuted, fontSize:13, fontWeight:500, cursor:"pointer" },
  tabBtnActive:  { color:WA.green, borderBottomColor:WA.green },
  listWrap:      { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" },
  newCharBtn:    { margin:"10px 12px 4px", padding:"10px 0", background:"transparent", border:`1px dashed ${WA.green}55`, borderRadius:8, color:WA.green, fontSize:13, fontWeight:600, cursor:"pointer", flexShrink:0 },
  charList:      { flex:1, overflowY:"auto", display:"flex", flexDirection:"column" },
  charItem:      { display:"flex", alignItems:"center", gap:10, padding:"12px 16px", cursor:"pointer", borderBottom:`1px solid ${WA.border}22` },
  charItemActive:{ background:WA.surfaceAlt },
  charEmoji:     { fontSize:22, flexShrink:0 },
  charName:      { fontSize:14, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:WA.textPrimary },
  delBtn:        { background:"transparent", border:"none", color:"#555", cursor:"pointer", fontSize:12, padding:"2px 6px", flexShrink:0 },
  userEmail:     { fontSize:11, color:"#444", padding:"8px 16px", flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  searchRow:     { display:"flex", gap:6, padding:"10px 12px", flexShrink:0 },
  searchInput:   { flex:1, padding:"9px 12px", background:WA.surface, border:`1px solid ${WA.border}`, borderRadius:8, color:WA.textPrimary, fontSize:13, outline:"none" },
  searchBtn:     { width:36, height:36, background:WA.green, border:"none", borderRadius:8, color:WA.bg, fontWeight:700, cursor:"pointer", fontSize:16, flexShrink:0 },
  backBtn:       { alignItems:"center", justifyContent:"center", background:"transparent", border:"none", color:WA.textPrimary, fontSize:22, cursor:"pointer", padding:"0 10px 0 0", flexShrink:0, lineHeight:1 },
  chatWrap:      { display:"flex", flexDirection:"column", flex:1, overflow:"hidden", height:"100%" },
  chatHeader:    { display:"flex", alignItems:"center", gap:10, padding:"10px 16px", background:WA.surface, borderBottom:`1px solid ${WA.border}`, flexShrink:0 },
  chatName:      { fontSize:15, fontWeight:600, color:WA.textPrimary },
  chatSub:       { fontSize:11, color:WA.textMuted },
  messages:      { flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:4 },
  bubble:        { padding:"8px 12px", borderRadius:8, lineHeight:1.5, fontSize:14, wordBreak:"break-word" },
  bubbleUser:    { background:WA.greenDark, color:WA.textPrimary, alignSelf:"flex-end", borderTopRightRadius:0 },
  bubbleAI:      { background:WA.surface, color:WA.textPrimary, alignSelf:"flex-start", borderTopLeftRadius:0 },
  inputRow:      { display:"flex", gap:8, padding:"8px 12px", background:WA.surface, borderTop:`1px solid ${WA.border}`, flexShrink:0, paddingBottom:"max(8px,env(safe-area-inset-bottom))" },
  chatInput:     { flex:1, padding:"10px 14px", background:WA.surfaceAlt, border:"none", borderRadius:24, color:WA.textPrimary, outline:"none" },
  sendBtn:       { width:44, height:44, borderRadius:"50%", background:WA.green, border:"none", fontSize:20, cursor:"pointer", color:WA.bg, fontWeight:700, flexShrink:0 },
  imgBtn:        { width:44, height:44, borderRadius:"50%", background:WA.surfaceAlt, border:`1px solid ${WA.border}`, fontSize:18, cursor:"pointer", flexShrink:0 },
  empty:         { flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, padding:24 },
  emptyText:     { color:WA.textMuted, fontSize:15, textAlign:"center", lineHeight:1.6 },
  formWrap:      { flex:1, overflowY:"auto", padding:24 },
  formTitle:     { fontSize:18, fontWeight:700, color:WA.textPrimary, marginBottom:16 },
  label:         { fontSize:12, color:WA.textMuted, display:"block", marginBottom:4, marginTop:14, textTransform:"uppercase", letterSpacing:"0.5px" },
  input:         { width:"100%", padding:"11px 14px", background:WA.surface, border:`1px solid ${WA.border}`, borderRadius:10, color:WA.textPrimary, fontSize:14, outline:"none", boxSizing:"border-box" },
  textarea:      { width:"100%", padding:"11px 14px", background:WA.surface, border:`1px solid ${WA.border}`, borderRadius:10, color:WA.textPrimary, fontSize:14, outline:"none", resize:"vertical", boxSizing:"border-box" },
  emojiGrid:     { display:"flex", flexWrap:"wrap", gap:8, marginTop:4 },
  emojiBtn:      { fontSize:22, padding:8, background:WA.surface, border:`1px solid ${WA.border}`, borderRadius:8, cursor:"pointer" },
  emojiBtnActive:{ borderColor:WA.green, background:`${WA.green}18` },
  formBtns:      { display:"flex", gap:10, marginTop:24 },
  cancelBtn:     { flex:1, padding:"12px 0", background:"transparent", border:`1px solid ${WA.border}`, borderRadius:8, color:WA.textMuted, fontSize:14, cursor:"pointer" },
  createBtn:     { flex:2, padding:"12px 0", background:WA.green, border:"none", borderRadius:8, fontWeight:700, fontSize:14, cursor:"pointer", color:WA.bg },
  dimText:       { color:WA.textMuted, fontSize:14, padding:"20px 16px" },
}