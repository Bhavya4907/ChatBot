export function formatTime(ts: string) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function formatDate(ts: string) {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return "Today"
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
  return d.toLocaleDateString()
}

export function showNotification(title: string, body: string) {
  if (Notification.permission !== "granted") return
  if (document.visibilityState === "visible") return
  new Notification(title, { body, icon: "/favicon.ico" })
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return
  if (Notification.permission === "default") {
    await Notification.requestPermission()
  }
}