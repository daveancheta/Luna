"use client"

import { useEffect, useRef, useState } from "react"
import { Bell, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/utils/client"
import { UseAuthStore } from "@/app/state/use-store-auth"

type Notification = { id: string; title: string; message: string; isRead: boolean; createdAt: string }

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
        setItems((current) => [payload.new as Notification, ...current].slice(0, 20))
        playNotificationSound()
      })
      .subscribe()
    return () => { clearTimeout(timer); void supabase.removeChannel(channel) }
  }, [auth?.id])

  async function markRead(id: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, isRead: true } : item))
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
  }

  return <div className="relative">
    <Button variant="ghost" size="icon" className="relative" onClick={() => { prepareAudio(); setOpen((value) => !value) }} aria-label="Open notifications" aria-expanded={open}>
      <Bell />
      {unreadCount > 0 && <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">{unreadCount > 9 ? "9+" : unreadCount}</span>}
    </Button>
    {open && <div className="absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-xl">
      <div className="border-b px-4 py-3"><p className="font-semibold">Notifications</p><p className="mt-1 text-xs text-muted-foreground">Family connection updates</p></div>
      <div className="scrollable-div max-h-[min(28rem,calc(100vh-6rem))] space-y-2 overflow-y-auto p-3">
        {items.length === 0 && <p className="py-6 text-sm text-muted-foreground">No notifications yet.</p>}
        {items.map((item) => <div key={item.id} className={`flex items-start gap-3 rounded-lg border p-3 ${item.isRead ? "opacity-60" : "bg-primary/5"}`}>
          <div className="min-w-0 flex-1"><p className="font-medium">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.message}</p></div>
          {!item.isRead && <Button size="icon-sm" variant="ghost" onClick={() => void markRead(item.id)} aria-label="Mark notification as read"><Check /></Button>}
        </div>)}
      </div>
    </div>}
  </div>
}