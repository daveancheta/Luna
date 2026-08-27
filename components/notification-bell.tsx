"use client"

import { useEffect, useRef, useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/utils/client"
import { UseAuthStore } from "@/app/state/use-store-auth"

type Notification = { id: string; title: string; message: string; isRead: boolean; createdAt: string }

function formatNotificationTime(value: string) {
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return "Just now"
  const elapsed = Math.max(0, Date.now() - timestamp)
  const minutes = Math.max(1, Math.floor(elapsed / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function NotificationBell() {
  const { auth } = UseAuthStore()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const unreadCount = items.filter((item) => !item.isRead).length

  function prepareAudio() {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext()
    if (audioContextRef.current.state === "suspended") void audioContextRef.current.resume()
  }

  function playNotificationSound() {
    try {
      const audioContext = audioContextRef.current ?? new AudioContext()
      audioContextRef.current = audioContext
      const playTone = (frequency: number, startTime: number) => {
        const oscillator = audioContext.createOscillator()
        const gain = audioContext.createGain()
        oscillator.frequency.value = frequency
        oscillator.type = "triangle"
        gain.gain.setValueAtTime(0.0001, startTime)
        gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.19)
        oscillator.connect(gain)
        gain.connect(audioContext.destination)
        oscillator.start(startTime)
        oscillator.stop(startTime + 0.2)
      }
      const play = () => {
        const startTime = audioContext.currentTime
        playTone(740, startTime)
        playTone(988, startTime + 0.12)
      }
      if (audioContext.state === "suspended") void audioContext.resume().then(play)
      else play()
    } catch {
      // Audio is optional and may be unavailable in restricted browsers.
    }
  }

  async function loadNotifications() {
    const response = await fetch("/api/notifications")
    if (response.ok) setItems((await response.json()).notifications ?? [])
  }

  useEffect(() => {
    if (!auth?.id) return
    const timer = setTimeout(() => { void loadNotifications() }, 0)
    const channel = supabase.channel(`notifications-${auth.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${auth.id}` }, (payload) => {
        const realtimeNotification = payload.new as Record<string, unknown>
        const notification: Notification = {
          id: String(realtimeNotification.id),
          title: String(realtimeNotification.title),
          message: String(realtimeNotification.message),
          isRead: Boolean(realtimeNotification.is_read),
          createdAt: String(realtimeNotification.created_at ?? new Date().toISOString()),
        }
        setItems((current) => [notification, ...current].slice(0, 20))
        playNotificationSound()
      })
      .subscribe()
    return () => { clearTimeout(timer); void supabase.removeChannel(channel) }
  }, [auth?.id])

  async function markAllRead() {
    if (unreadCount === 0) {
      setOpen((value) => !value)
      return
    }
    setItems((current) => current.map((item) => ({ ...item, isRead: true })))
    setOpen((value) => !value)
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) })
  }

  return <div className="relative">
    <Button variant="ghost" size="icon" className="relative" onClick={() => { prepareAudio(); void markAllRead() }} aria-label="Open notifications and mark all as read" aria-expanded={open}>
      <Bell />
      {unreadCount > 0 && <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">{unreadCount > 9 ? "9+" : unreadCount}</span>}
    </Button>
    {open && <div className="absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-xl">
      <div className="flex items-center justify-between border-b px-4 py-3"><div><p className="font-semibold">Notifications</p><p className="mt-1 text-xs text-muted-foreground">Family connection updates</p></div>{unreadCount > 0 && <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">{unreadCount} new</span>}</div>
      <div className="scrollable-div max-h-[min(28rem,calc(100vh-6rem))] space-y-2 overflow-y-auto p-3">
        {items.length === 0 && <p className="py-6 text-sm text-muted-foreground">No notifications yet.</p>}
        {items.map((item) => <div key={item.id} className={`flex items-start gap-3 rounded-lg border p-3 ${item.isRead ? "opacity-60" : "border-primary/20 bg-primary/5"}`}>
          <span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.isRead ? "bg-muted-foreground/30" : "bg-primary"}`} aria-hidden="true" />
          <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="font-medium">{item.title}</p><time className="shrink-0 text-[11px] text-muted-foreground">{formatNotificationTime(item.createdAt)}</time></div><p className="mt-1 text-sm text-muted-foreground">{item.message}</p></div>
        </div>)}
      </div>
    </div>}
  </div>
}