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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { signInWithGoogle, auth, handleGetSession, isSession } = UseAuthStore()
  const { getConversationTitle, title } = UseAiStore()

  React.useEffect(() => {
    handleGetSession(false)
  }, [handleGetSession])

  React.useEffect(() => {
    getConversationTitle()
  }, [getConversationTitle])

  const navMain = [
    {
      title: "New Conversation",
      icon: <PencilLine />
    },
    {
      title: "TimeLine",
      icon: <Timeline />
    },
    {
      title: "Documents",
      icon: <FileText />
    },
    {
      title: "Images",
      icon: <Images />
    },
    {
      title: "Library",
      icon: <Library />
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
                    {nav.icon}
                    <span>{nav.title}</span>
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
                {title.map((title) =>
                  <SidebarMenuButton
                    key={title.id}
                  >
                    <Link href={title.id} className="flex min-w-0 flex-1 items-center">
                      <span className="truncate">
                        {title.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                )}
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
