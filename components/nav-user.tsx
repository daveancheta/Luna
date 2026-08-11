"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Separator } from './ui/separator'
import { Switch } from './ui/switch'
import { useInitials } from '@/hooks/use-initials'
import { ChevronsUpDownIcon, Sun, Moon, Settings, LogOut } from 'lucide-react'
import { useTheme } from "next-themes"
import { Button } from './ui/button'
import { AnimatedThemeToggler } from './ui/animated-theme-toggler'
import { UseAuthStore } from '@/app/state/use-store-auth'

function NavUser({ name, email, image, onSettings, onLogout }:
    {
        name: string,
        email: string,
        image: string,
        onSettings?: () => void,
        onLogout?: () => void,
    }) {
    const getInitials = useInitials()
    const { theme, setTheme } = useTheme()
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const isDark = theme === "dark"
    const { handleSignOutValidation } = UseAuthStore()

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div ref={containerRef} className="relative">
            <div
                onClick={() => setOpen((prev) => !prev)}
                className="flex flex-row items-center gap-2 rounded-md p-2 transition-colors duration-200 hover:bg-accent cursor-pointer"
            >
                <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage src={image} alt={name} />
                    <AvatarFallback>{getInitials(name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{name}</span>
                    <span className="truncate text-xs text-muted-foreground">{email}</span>
                </div>
                <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
            </div>

            {open && (
                <div className="absolute bottom-full left-0 z-50 mb-3 w-60 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
                    <div className="flex items-center gap-3 p-3">
                        <Avatar className="h-9 w-9 rounded-full">
                            <AvatarImage src={image} alt={name} />
                            <AvatarFallback>{getInitials(name)}</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">{name}</span>
                            <span className="truncate text-xs text-muted-foreground">{email}</span>
                        </div>
                    </div>

                    <Separator />

                    <div className="p-1.5">
                        <div className="flex px-2.5 w-full items-center justify-between gap-2 rounded-md py-1.5 text-sm">
                            <span className="flex items-center gap-2 text-foreground">
                                {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
                                Dark mode
                            </span>
                            <AnimatedThemeToggler />
                        </div>

                        <Button
                            variant={"ghost"}
                            onClick={() => {
                                onSettings?.()
                                setOpen(false)
                            }}
                            className="flex-1 w-full justify-start"
                        >
                            <Settings className="size-4" />
                            Settings
                        </Button>
                    </div>

                    <Separator />

                    <div className="p-1.5">
                        <Button
                            variant={"ghost"}
                            onClick={() => {
                                handleSignOutValidation()
                                setOpen(false)
                            }}
                            className="flex-1 w-full justify-start"
                        >
                            <LogOut className="size-4" />
                            Log out
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default NavUser