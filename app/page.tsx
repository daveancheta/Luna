"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { ArrowUp, AudioLines, Mic, Moon, Plus } from "lucide-react"
import { FormEvent, useEffect, useRef, useState } from "react"
import ReactMarkdown from 'react-markdown'
import { UseAiStore } from "./state/use-store-ai"
import { UseSidebarStore } from "./state/use-store-sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTypewriter } from "@/hooks/use-typewriter"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

function ChatTurn({
  message,
  isLast,
  onTypingChange,
}: {
  message: ChatMessage
  isLast: boolean
  onTypingChange?: (isTyping: boolean) => void
}) {
  const { displayed, isTyping } = useTypewriter(
    message.content,
    isLast && message.role === "assistant"
  )

  useEffect(() => {
    if (isLast && message.role === "assistant") {
      onTypingChange?.(isTyping)
    }
  }, [isTyping, isLast, message.role, onTypingChange])

  if (message.role === "user") {
    return (
      <div className="w-fit self-end flex rounded-3xl bg-muted px-4 py-3 text-[0.9375rem] text-end leading-relaxed text-foreground justify-end">
        {message.content}
      </div>
    )
  }

  return (
    <div className="flex gap-4">
      <div className="min-w-0 flex-1 pt-0.5 text-[0.9375rem] leading-[1.65] text-foreground">
        <ReactMarkdown
          components={{
            ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>,
            ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>,
            li: ({ children }) => <li className="pl-1">{children}</li>,
            p: ({ children }) => <p className="mb-3">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          }}
        >
          {message.role === "assistant" ? displayed : message.content}
        </ReactMarkdown>
      </div>
    </div>
  )
}

export default function Page() {
  const [prompt, setPrompt] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const { isGenerating, conversation, generateResponse } = UseAiStore()
  const { sidebar } = UseSidebarStore()
  const [isTypingOut, setIsTypingOut] = useState(false)
  
  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [isGenerating, !isTypingOut])

  const handleSend = (e: FormEvent) => {
    e.preventDefault()
    const text = prompt.trim()
    generateResponse(text)
    setPrompt("")

  }

  const canSend = prompt.trim().length > 0

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex h-svh flex-col overflow-hidden bg-background">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
          {sidebar === "expanded" &&
            <div className="flex flex-row gap-2 items-center">
              <Tooltip >
                <TooltipTrigger render={<SidebarTrigger className="-ml-1" />} />
                <TooltipContent side={"right"}>
                  <p>Expand</p>
                </TooltipContent>
              </Tooltip>
              <Separator orientation="vertical" className="mr-1 data-vertical:h-4 data-vertical:self-auto" />
            </div>
          }
          <h1 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            Cancer awareness ribbon color
          </h1>
          <div className="w-8 shrink-0" aria-hidden />
        </header>

        <div
          ref={scrollRef}
          className={cn(conversation.length > 0 && "hidden")}
        >
          <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 py-10 text-center md:px-6">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div />
              <Moon className="absolute inset-0 rounded-full text-[#5B6BD8] fill-[#5B6BD8]" />
            </div>

            <h1 className="text-4xl font-medium tracking-tight text-[#1C1D2E] dark:text-[#EDEBF9] md:text-5xl">
              Hi, I'm <span className="text-[#5B6BD8] lokeya">Luna</span>
            </h1>
            <p className="max-w-sm text-lg text-[#5B5F78] dark:text-[#9599B8]">
              What can I help you with today?
            </p>
          </div>
        </div>

        <div className={cn(conversation.length === 0 ? "hidden" : "flex-1 overflow-y-auto overscroll-contain scrollable-div")}>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 md:px-6">
            {conversation.map((message, index) => (
              <ChatTurn message={message} key={index} isLast={index === conversation.length - 1} onTypingChange={setIsTypingOut} />
            ))}
          </div>
          {isGenerating && (
            <div className="flex items-center gap-2 mx-auto w-full max-w-3xl px-4 py-3 md:px-6">
              <Moon className="rounded-full text-[#5B6BD8] fill-[#5B6BD8] size-4 animate-spin" />
              <span className="text-sm text-[#5B6BD8]/90">Thinking</span>
            </div>
          )}
        <div ref={messageEndRef} />
        </div>


        <form className="shrink-0 px-4 pb-5 pt-2" onSubmit={handleSend}>
          <div className="mx-auto w-full max-w-3xl">
            <InputGroup
              className={cn(
                "rounded-[1.75rem] border-border bg-card shadow-sm",
                "has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/30"
              )}
            >
              <InputGroupTextarea
                id="chat-composer"
                placeholder="Reply to Luna..."
                rows={1}
                value={prompt}
                className="min-h-12 max-h-80 resize-none px-4 pt-4 pb-2 text-[0.9375rem] placeholder:text-muted-foreground scrollable-div"
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                  }
                }}
              />
              <InputGroupAddon
                align="block-end"
                className="w-full px-3 pb-3 pt-0"
              >
                <InputGroupButton
                  aria-label="Add attachment"
                  className="text-muted-foreground hover:text-foreground"
                  disabled={isTypingOut || isGenerating}
                >
                  <Plus />
                </InputGroupButton>
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Voice input"
                    disabled={isTypingOut || isGenerating}
                  >
                    <Mic />
                  </Button>
                  {canSend ? (
                    <Button
                      type="submit"
                      size="icon-sm"
                      className="rounded-full bg-[#5B6BD8] text-primary-foreground hover:bg-[#5B6BD8]/90"
                      aria-label="Send message"
                      disabled={isTypingOut || isGenerating}
                    >
                      <ArrowUp className="text-white"/>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Audio mode"
                      disabled={isTypingOut || isGenerating}
                    >
                      <AudioLines />
                    </Button>
                  )}
                </div>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </form>
      </SidebarInset>
    </SidebarProvider>
  )
}
