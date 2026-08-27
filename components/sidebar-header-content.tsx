"use client"

import * as React from "react"

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

export function SidebarHeaderContent() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex flex-row justify-between leading-none px-3 py-2">
          <div className="flex items-center gap-1">
            <Tooltip >
              <TooltipTrigger render={<SidebarTrigger className="-ml-1" />} />
              <TooltipContent side={"right"}>
                <p>Collapse</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
