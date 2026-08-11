"use client"

import * as React from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

export function SidebarHeaderContent() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex flex-row justify-between leading-none px-3 py-2">
          <span className="font-medium lokeya text-xl text-[#5B6BD8]">Luna</span>
          <Tooltip >
            <TooltipTrigger render={<SidebarTrigger className="-ml-1" />} />
            <TooltipContent side={"right"}>
              <p>Collapse</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
