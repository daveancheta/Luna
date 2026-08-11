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
import { FileText, Images, Library, PencilLine, Timeline } from "lucide-react"
import { Button } from "./ui/button"
import StackIcon from 'tech-stack-icons'
import { UseAuthStore } from "@/app/state/use-store-auth"
import NavUserSkeleton from "./nav-user-skeleton"
import NavUser from "./nav-user"
import { UseAiStore } from "@/app/state/use-store-ai"
import Link from "next/link"
import { SidebarHeaderContent } from "./sidebar-content"
import { usePathname } from "next/navigation"

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
  const { signInWithGoogle, auth, handleGetSession, isSession } = UseAuthStore()
  const { getConversationTitle, title } = UseAiStore()
  const pathname = usePathname()
  const isHomePage = pathname === "/"
  const id = pathname.split("/chat/")[1]

  React.useEffect(() => {
    handleGetSession(false)
  }, [handleGetSession])

  React.useEffect(() => {
    getConversationTitle()
  }, [getConversationTitle])

  const navMain = [
    {
      title: "New Conversation",
      icon: <PencilLine />,
      url: "/"
    },
    {
      title: "TimeLine",
      icon: <Timeline />,
      url: "/"
    },
    {
      title: "Documents",
      icon: <FileText />,
      url: "/"
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
                {title.map((item, index) => (
                  <SidebarMenuButton key={item.id}>
                    <Link
                      href={`/chat/${item.id}`}
                      className="flex min-w-0 flex-1 items-center"
                    >
                      {isHomePage
                        ? <span className="truncate">
                          {item.title}
                        </span>
                        : item.id === id ? (
                          <TypingText text={item.title} />
                        ) : (
                          <span className="truncate">
                            {item.title}
                          </span>
                        )}
                    </Link>
                  </SidebarMenuButton>
                ))}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
      <SidebarFooter className="mb-2 border-t p-4">
        {isSession
          ? <NavUserSkeleton />
          : auth && <NavUser name={auth?.name as string} email={auth?.email as string} image={auth?.image as string} />
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
    </Sidebar>
  )
}
