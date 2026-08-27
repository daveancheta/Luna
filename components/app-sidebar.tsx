import * as React from "react"

import { SearchForm } from "@/components/search-form"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { Check, FileText, Images, Library, MoreHorizontal, Pencil, PencilLine, Timeline, Trash2, X } from "lucide-react"
import { Button } from "./ui/button"
import StackIcon from 'tech-stack-icons'
import { UseAuthStore } from "@/app/state/use-store-auth"
import NavUserSkeleton from "./nav-user-skeleton"
import NavUser from "./nav-user"
import { UseAiStore } from "@/app/state/use-store-ai"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SidebarHeaderContent } from "./sidebar-header-content"
import { supabase } from "@/utils/client"
import { FamilySettings } from "./family-settings"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const TypingText = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = React.useState("")

  React.useEffect(() => {
    let index = 0

    const interval = setInterval(() => {
      setDisplayText(text.slice(0, index + 1))
      index++

      if (index >= text.length) {
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [text])

  return <span className="truncate">{displayText}</span>
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [renamingId, setRenamingId] = React.useState<string | null>(null)
  const [renameValue, setRenameValue] = React.useState("")
  const { signInWithGoogle, auth, handleGetSession, isSession } = UseAuthStore()
  const { getConversationTitle, title, setConversationToEmpty, setSelectedTitle, selectedConversationId, setSelectedConversationId } = UseAiStore()

  React.useEffect(() => {
    handleGetSession(false)
  }, [handleGetSession])

  React.useEffect(() => {
    getConversationTitle()
  }, [])

  async function renameConversation(id: string) {
    const titleValue = renameValue.trim()
    if (!titleValue) return
    const response = await fetch(`/api/luna/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: titleValue }),
    })
    if (response.ok) {
      setRenamingId(null)
      await getConversationTitle()
    }
  }

  async function deleteConversation(id: string) {
    const response = await fetch(`/api/luna/${id}`, { method: "DELETE" })
    if (response.ok) {
      if (selectedConversationId === id) {
        setConversationToEmpty()
        setSelectedConversationId("")
        setSelectedTitle(null)
        router.push("/new")
      }
      await getConversationTitle()
    }
  }

  React.useEffect(() => {
    const channel = supabase
      .channel("public:title")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "conversation"
      },
        async () => {
          await getConversationTitle()
        })
        .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }

  }, [])

  const navMain = [
    {
      title: "New Conversation",
      icon: <PencilLine />,
      url: "/new"
    },
    {
      title: "TimeLine",
      icon: <Timeline />,
      url: "/"
    },
    {
      title: "Documents",
      icon: <FileText />,
      url: "/documents"
    },
    {
      title: "Images",
      icon: <Images />,
      url: "/"
    },
    {
      title: "Library",
      icon: <Library />,
      url: "/"
    },
  ]
  return (
    <Sidebar {...props} variant="sidebar">
      <SidebarHeader>
        <SidebarHeaderContent
        />
        <SearchForm />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                {navMain.map((nav, index) =>
                  <SidebarMenuButton
                    className="cursor-pointer"
                    key={index}
                    onClick={() => setConversationToEmpty()}
                  >
                    <Link href={nav.url} className="flex min-w-0 flex-1 items-center gap-2">
                      {nav.icon}
                      <span>{nav.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )
                }
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className={cn(title.length < 1 && "hidden")}>
            Recent
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                {[...title].reverse().map((item) => (
                  <SidebarMenuItem key={item.id} className="group/recent relative">
                    {renamingId === item.id ? <SidebarMenuButton className="relative">
                      <input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void renameConversation(item.id); if (event.key === "Escape") setRenamingId(null) }} className="min-w-0 flex-1 rounded border bg-background px-1 text-sm outline-none" aria-label="Conversation name" />
                      <button type="button" className="shrink-0 rounded p-1 hover:bg-muted" onClick={(event) => { event.stopPropagation(); void renameConversation(item.id) }} aria-label="Save conversation name"><Check className="size-3.5" /></button>
                      <button type="button" className="shrink-0 rounded p-1 hover:bg-muted" onClick={(event) => { event.stopPropagation(); setRenamingId(null) }} aria-label="Cancel rename"><X className="size-3.5" /></button>
                    </SidebarMenuButton> : <>
                      <SidebarMenuButton onClick={() => { setSelectedTitle(item.title); setSelectedConversationId(item.id) }}>
                        <Link href={`/chat/${item.id}`} className="flex min-w-0 flex-1 items-center">
                          {item.id === selectedConversationId ? <TypingText text={item.title} /> : <span className="truncate">{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<button type="button" className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover/recent:opacity-100 group-focus-within/recent:opacity-100" aria-label={`Actions for ${item.title}`} />}>
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="right" className="w-36">
                          <DropdownMenuItem onClick={() => { setRenamingId(item.id); setRenameValue(item.title) }}><Pencil className="size-4" /> Rename</DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => void deleteConversation(item.id)}><Trash2 className="size-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>}
                  </SidebarMenuItem>
                ))}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
      <SidebarFooter className="mb-2 border-t">
        {isSession
          ? <NavUserSkeleton />
          : auth && <NavUser name={auth?.name as string} email={auth?.email as string} image={auth?.image as string} onSettings={() => setSettingsOpen(true)} />
        }

        {!auth && !isSession &&
          <Button
            variant="outline"
            className="bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100
         border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2
         shadow-[0_3px_0_0_#e5e7eb] dark:shadow-[0_3px_0_0_#18181b]
         hover:bg-gray-50 dark:hover:bg-zinc-700
         active:shadow-[0_1px_0_0_#e5e7eb] dark:active:shadow-[0_1px_0_0_#18181b]
         active:translate-y-0.5
         transition-all duration-100"
            onClick={signInWithGoogle}
          >
            <StackIcon name="google" className="size-4" /> Continue with Google
          </Button>
        }
      </SidebarFooter>
      <FamilySettings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Sidebar>
  )
}
