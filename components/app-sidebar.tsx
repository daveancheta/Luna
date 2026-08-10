import * as React from "react"

import { SearchForm } from "@/components/search-form"
import { VersionSwitcher } from "@/components/version-switcher"
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
import { CirclePlus } from "lucide-react"
import { Button } from "./ui/button"
import StackIcon from 'tech-stack-icons'
import { UseAuthStore } from "@/app/state/use-store-auth"
import NavUserSkeleton from "./nav-user-skeleton"
import NavUser from "./nav-user"
import { UseAiStore } from "@/app/state/use-store-ai"
import Link from "next/link"

type NavSubItem = {
  title: string
  url: string
  icon?: React.ReactNode
  isActive?: boolean
}

type NavGroup = {
  title: string
  url: string
  items: NavSubItem[]
}

// This is sample data.
const data: {
  versions: string[]
  navMain: NavGroup[]
} = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Getting Started",
      url: "#",
      items: [
        {
          title: "New Conversation",
          url: "#",
          icon: <CirclePlus />
        },
      ],
    },
    {
      title: "Recent",
      url: "#",
      items: [
        {
          title: "Cancer awareness ribbon color",
          url: "#",
        },
        {
          title: "Title format identification",
          url: "#",
          isActive: true,
        },
        {
          title: "Dashboard layout with sidebar and branch selector",
          url: "#",
        },
        {
          title: "Advanced project ideas",
          url: "#",
        },
        {
          title: "Community-focused coding project ideas",
          url: "#",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { signInWithGoogle, auth, handleGetSession, isSession } = UseAuthStore()
  const { getConversationTitle, title } = UseAiStore()

  React.useEffect(() => {
    handleGetSession()
  }, [handleGetSession])

  React.useEffect(() => {
    getConversationTitle()
  }, [getConversationTitle])

  return (
    <Sidebar {...props} variant="sidebar">
      <SidebarHeader>
        <VersionSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0]}
        />
        <SearchForm />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>

              <SidebarMenuItem>
                <SidebarMenuButton
                >
                  <CirclePlus />
                  <span>New Conversation</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel >
            Recent
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>

              <SidebarMenuItem>
                {title.map((title) =>
                  <SidebarMenuButton
                    key={title.id}
                  >

                    <Link href={title.id}>
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
