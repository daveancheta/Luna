"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const relationshipOptions = ["Mother", "Father", "Spouse", "Partner", "Son", "Daughter", "Brother", "Sister", "Grandparent", "Relative", "Caregiver", "Other"]
const permissions = [
  ["receiveHelpAlerts", "Help alerts"], ["appointments", "Appointments"], ["medications", "Medications"],
  ["healthRecords", "Health records"], ["medicalReports", "Medical reports"], ["healthTimeline", "Health timeline"], ["location", "Location"],
] as const

type Person = { id: string; name: string; email?: string; image?: string | null }
type PermissionKey = typeof permissions[number][0]
type Relationship = { id: string; relationship: string; status: string; requesterId: string; recipientId: string } & Record<PermissionKey, boolean>
type FamilyRow = { relationship: Relationship; requester?: Person; recipient?: Person }

function initials(name: string) { return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() }

export function FamilySettings({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [users, setUsers] = useState<Person[]>([])
  const [incoming, setIncoming] = useState<FamilyRow[]>([])
  const [outgoing, setOutgoing] = useState<FamilyRow[]>([])
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Person | null>(null)
  const [relationship, setRelationship] = useState("Mother")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  async function loadFamily() {
    const response = await fetch("/api/family")
    if (!response.ok) return
    const data = await response.json()
    setIncoming(data.incoming ?? [])
    setOutgoing(data.outgoing ?? [])
  }


  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => { void loadFamily() }, 0)
      return () => clearTimeout(timer)
    }
  }, [open])
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) { setUsers([]); return }
      const response = await fetch(`/api/family?q=${encodeURIComponent(query.trim())}`)
      if (response.ok) setUsers((await response.json()).users ?? [])
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  async function update(id: string, action: string, body: Record<string, unknown> = {}) {
    setBusy(true)
    const response = await fetch("/api/family", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, ...body }) })
    setBusy(false)
    if (response.ok) loadFamily()
  }

  async function sendRequest() {
    if (!selected) return
    setBusy(true)
    const response = await fetch("/api/family", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientId: selected.id, relationship }) })
    setBusy(false)
    if (response.ok) { setSelected(null); setQuery(""); setUsers([]); setMessage("Request sent") ; loadFamily() }
    else setMessage((await response.json()).message ?? "Unable to send request")
  }

  const connected = [...incoming, ...outgoing].filter((row) => row.relationship.status === "ACCEPTED")
  const pendingOutgoing = outgoing.filter((row) => row.relationship.status === "PENDING")
  const pendingIncoming = incoming.filter((row) => row.relationship.status === "PENDING")

  return <>
    <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader className="border-b px-6 py-5">
        <DialogTitle>Settings</DialogTitle>
        <DialogDescription>Manage your Luna account and connections.</DialogDescription>
      </DialogHeader>
      <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[150px_1fr]">
        <nav className="flex gap-1 border-b p-3 md:flex-col md:border-b-0 md:border-r">
          {["Account", "Appearance", "Notifications", "Privacy", "Family"].map((tab) => <button key={tab} className={`rounded-lg px-3 py-2 text-left text-sm ${tab === "Family" ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted"}`}>{tab}</button>)}
        </nav>
        <main className="scrollable-div min-h-0 overflow-y-auto space-y-8 p-6 sm:p-8">
          <div><h2 className="text-2xl font-semibold">Family</h2><p className="mt-2 text-base text-muted-foreground">Connect with family members who use Luna.</p></div>
          <div className="relative"><Search className="absolute left-4 top-3.5 size-5 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name..." className="h-12 pl-12 text-base" /></div>
          {users.length > 0 && <section className="space-y-3"><p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Search results ({users.length})</p>{users.map((person) => <div key={person.id} className="flex min-h-20 items-center gap-4 rounded-xl border p-4"><Avatar size="lg"><AvatarImage src={person.image ?? undefined} /><AvatarFallback>{initials(person.name)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-base font-medium">{person.name}</p><p className="truncate text-sm text-muted-foreground">{person.email}</p></div><Button size="lg" onClick={() => { setSelected(person); setMessage("") }}>Add family</Button></div>)}</section>}
          {message && <p className="rounded-lg bg-muted px-3 py-2 text-sm">{message}</p>}
          <FamilySection title="Connected family">
            {connected.length ? connected.map((row) => <ConnectedRow key={row.relationship.id} row={row} busy={busy} onRemove={() => update(row.relationship.id, "remove")} onPermission={(key, value) => update(row.relationship.id, "permissions", { [key]: value })} />) : <EmptyState text="No connected family members yet." />}
          </FamilySection>
          <FamilySection title="Pending requests">
            {pendingOutgoing.length ? pendingOutgoing.map((row) => <RequestRow key={row.relationship.id} row={row} actionLabel="Cancel request" onAction={() => update(row.relationship.id, "cancel")} />) : <EmptyState text="No pending requests." />}
          </FamilySection>
          <FamilySection title="Incoming requests">
            {pendingIncoming.length ? pendingIncoming.map((row) => <div key={row.relationship.id} className="rounded-xl border p-4"><PersonLine person={row.requester!} /><p className="mt-3 text-sm">Wants to add you as a family member.</p><p className="mt-1 text-sm text-muted-foreground">Relationship: {row.relationship.relationship}</p><div className="mt-4 flex gap-2"><Button size="sm" onClick={() => update(row.relationship.id, "accept")}>Accept</Button><Button size="sm" variant="outline" onClick={() => update(row.relationship.id, "decline")}>Decline</Button></div></div>) : <EmptyState text="No incoming requests." />}
          </FamilySection>
        </main>
      </div>
    </DialogContent>
    </Dialog>
    <Dialog open={Boolean(selected)} onOpenChange={(value) => { if (!value) setSelected(null) }}>
      <DialogContent className="max-w-sm">
        {selected && <>
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Add family member</DialogTitle>
            <DialogDescription className="font-medium text-foreground">{selected.name}</DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            <label className="block text-sm font-medium">Relationship<select value={relationship} onChange={(event) => setRelationship(event.target.value)} className="mt-2 h-9 w-full rounded-lg border bg-background px-3 text-sm">{relationshipOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
            <div className="mt-5 flex items-center justify-between rounded-lg bg-muted/50 p-3"><span className="text-sm">Allow help alerts</span><Switch checked /></div>
            <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button><Button disabled={busy} onClick={sendRequest}>Send request</Button></div>
          </div>
        </>}
      </DialogContent>
    </Dialog>
  </>
}

function FamilySection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="space-y-3"><h3 className="border-b pb-2 text-sm font-semibold">{title}</h3>{children}</section> }
function EmptyState({ text }: { text: string }) { return <p className="text-sm text-muted-foreground">{text}</p> }
function PersonLine({ person }: { person: Person }) { return <div className="flex items-center gap-3"><Avatar><AvatarImage src={person.image ?? undefined} /><AvatarFallback>{initials(person.name)}</AvatarFallback></Avatar><div><p className="font-medium">{person.name}</p>{person.email && <p className="text-sm text-muted-foreground">{person.email}</p>}</div></div> }
function RequestRow({ row, actionLabel, onAction }: { row: FamilyRow; actionLabel: string; onAction: () => void }) { return <div className="flex items-center gap-3 rounded-xl border p-4"><div className="flex-1"><PersonLine person={row.recipient!} /><p className="mt-2 text-sm text-muted-foreground">{row.relationship.relationship} · Waiting for response</p></div><Button variant="outline" size="sm" onClick={onAction}>{actionLabel}</Button></div> }
function ConnectedRow({ row, busy, onRemove, onPermission }: { row: FamilyRow; busy: boolean; onRemove: () => void; onPermission: (key: string, value: boolean) => void }) { const person = row.requester ?? row.recipient!; const canEdit = Boolean(row.requester); return <div className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><PersonLine person={person} /><p className="mt-2 text-sm text-muted-foreground">{row.relationship.relationship} · <span className="text-emerald-600">Connected</span></p></div><Button disabled={busy} variant="ghost" size="sm" onClick={onRemove}>Remove</Button></div>{canEdit && <div className="mt-4 space-y-1 border-t pt-3">{permissions.map(([key, label]) => <label key={key} className="flex items-center justify-between py-1.5 text-sm"><span>{label}</span><Switch disabled={busy} checked={Boolean(row.relationship[key])} onCheckedChange={(value) => onPermission(key, value)} /></label>)}</div>}</div> }