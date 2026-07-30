import * as React from "react"

import { SearchForm } from "@/components/search-form"
import { VersionSwitcher } from "@/components/version-switcher"
import {
  Sidebar,
  SidebarContent,
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
  return (
    <Sidebar {...props} variant="floating">
      <SidebarHeader>
        <VersionSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0]}
        />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className={cn(item.title ===  "Getting Started" && "hidden")}>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((subItem) => (
                  <SidebarMenuItem key={subItem.title}>
                    <SidebarMenuButton
                      isActive={subItem.isActive}
                      render={<a href={subItem.url} />}
                    >
                      {subItem.icon}
                      <span>{subItem.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
