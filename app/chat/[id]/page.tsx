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
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import {
  ArrowUp,
  AudioLines,
  Check,
  Copy,
  Mic,
  MicOff,
  Moon,
  Plus,
  Volume2,
  VolumeX,
} from "lucide-react"
import { use, useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTypewriter } from "@/hooks/use-typewriter"
import { useIsMobile } from "@/hooks/use-mobile"
import { UseAiStore } from "../../state/use-store-ai"
import { UseAuthStore } from "../../state/use-store-auth"
import { UseSidebarStore } from "../../state/use-store-sidebar"
import { supabase } from "@/utils/client"
import MessageSkeleton from "@/components/message-skeleton"
import { speechService } from "@/lib/audio/speech"

type ChatMessage = {
  role: "user" | "assistant"
  message: string
}

function ChatTurn({
  message,
  index,
  isLast,
  onTypingChange,
}: {
  message: ChatMessage
  index: number
  isLast: boolean
  onTypingChange?: (isTyping: boolean) => void
}) {
  const { displayed, isTyping } = useTypewriter(
    message.message,
    isLast && message.role === "assistant"
  )
  const { isSpeaking, speakingIndex, speakMessage, stopSpeaking } = UseAiStore()
  const [hasCopied, setHasCopied] = useState(false)

  useEffect(() => {
    if (isLast && message.role === "assistant") {
      onTypingChange?.(isTyping)
    }
  }, [isTyping, isLast, message.role, onTypingChange])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.message)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  if (message.role === "user") {
    return (
      <div className="w-fit self-end flex rounded-3xl bg-muted px-4 py-3 text-[0.9375rem] text-start leading-relaxed text-foreground justify-end whitespace-pre-wrap">
        {message.message}
      </div>
    )
  }

  const isCurrentSpeaking = isSpeaking && speakingIndex === index

  return (
    <div className="group flex flex-col gap-2">
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
            {message.role === "assistant" ? displayed : message.message}
          </ReactMarkdown>
        </div>
      </div>

      {/* Assistant Action Bar (Audio Readout / Copy) */}
      {!isTyping && (
        <div className="flex items-center gap-1.5 pt-1 text-muted-foreground">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => speakMessage(message.message, index)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-all border",
                    isCurrentSpeaking
                      ? "bg-[#5B6BD8]/15 text-[#5B6BD8] font-medium border-[#5B6BD8]/30 shadow-xs"
                      : "bg-background/80 text-muted-foreground hover:bg-muted hover:text-foreground border-border/50"
                  )}
                  aria-label={isCurrentSpeaking ? "Stop audio readout" : "Read message aloud"}
                >
                  {isCurrentSpeaking ? (
                    <>
                      <span className="flex items-center gap-0.5 h-3 px-0.5 text-[#5B6BD8]">
                        <span className="w-0.5 h-2 bg-current rounded-full animate-pulse" />
                        <span className="w-0.5 h-3.5 bg-current rounded-full animate-pulse delay-75" />
                        <span className="w-0.5 h-1.5 bg-current rounded-full animate-pulse delay-150" />
                      </span>
                      <span className="text-[11px] font-medium">Stop reading</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="size-3.5" />
                      <span className="text-[11px]">Read aloud</span>
                    </>
                  )}
                </button>
              }
            />
            <TooltipContent side="bottom">
              <p>{isCurrentSpeaking ? "Stop audio readout" : "Read message aloud (TTS)"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex size-7 items-center justify-center rounded-lg border border-border/50 bg-background/80 hover:bg-muted hover:text-foreground text-muted-foreground transition-colors"
                  aria-label="Copy message"
                >
                  {hasCopied ? (
                    <Check className="size-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>
              }
            />
            <TooltipContent side="bottom">
              <p>{hasCopied ? "Copied to clipboard" : "Copy message"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  )
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [prompt, setPrompt] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const {
    isGenerating,
    conversation,
    generateResponse,
    conversationTitle,
    selectedTitle,
    getConversation,
    isLoadingConversation,
    isAudioMode,
    toggleAudioMode,
    isListening,
    setIsListening,
    stopSpeaking,
  } = UseAiStore()
  const { auth, handleGetSession, isSession } = UseAuthStore()
  const { sidebar } = UseSidebarStore()
  const [isTypingOut, setIsTypingOut] = useState(false)
  const isMobile = useIsMobile()
  const [displayTitle, setDisplayTitle] = useState("")

  useEffect(() => {
    getConversation(id)
  }, [id])

  useEffect(() => {
    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        async () => {
          getConversation(id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  useEffect(() => {
    const titleToDisplay = conversationTitle || selectedTitle
    if (titleToDisplay) {
      document.title = `${titleToDisplay} | Luna`
    }
  }, [conversationTitle, selectedTitle])

  useEffect(() => {
    if (!conversationTitle) {
      setDisplayTitle("")
      return
    }

    setDisplayTitle("")

    let index = 0

    const interval = setInterval(() => {
      setDisplayTitle(conversationTitle.slice(0, index + 1))
      index++

      if (index >= conversationTitle.length) {
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [conversationTitle])

  useEffect(() => {
    handleGetSession(false)
  }, [handleGetSession])

  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [isGenerating, !isTypingOut])

  // Stop listening/speaking on unmount
  useEffect(() => {
    return () => {
      speechService.stop()
      speechService.stopListening()
      setIsListening(false)
    }
  }, [setIsListening])

  const handleToggleVoiceInput = () => {
    if (isListening) {
      speechService.stopListening()
      setIsListening(false)
    } else {
      const started = speechService.startListening(
        (transcript) => {
          setPrompt(transcript)
        },
        () => {
          setIsListening(false)
        },
        (error) => {
          console.error("Speech recognition error:", error)
          setIsListening(false)
        }
      )
      if (started) {
        setIsListening(true)
      }
    }
  }

  const handleKeyEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (prompt.trim() && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendPrompt()
    }
  }

  const handleSendPrompt = () => {
    const text = prompt.trim()
    if (!text || isGenerating) return

    if (isListening) {
      speechService.stopListening()
      setIsListening(false)
    }
    stopSpeaking()

    generateResponse(text, id, (conversationTitle || selectedTitle) as string)
    setPrompt("")
  }

  const canSend = prompt.trim().length > 0

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex h-svh flex-col overflow-hidden bg-background">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
          {((!isMobile && sidebar === "expanded") || isMobile) && (
            <div className="flex flex-row gap-2 items-center">
              <Tooltip>
                <TooltipTrigger render={<SidebarTrigger className="-ml-1" />} />
                <TooltipContent side="right">
                  <p>Expand Sidebar</p>
                </TooltipContent>
              </Tooltip>
              <Separator orientation="vertical" className="mr-1 data-vertical:h-4 data-vertical:self-auto" />
            </div>
          )}
          <h1 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {selectedTitle ? selectedTitle : displayTitle}
          </h1>
          <div className="w-8 shrink-0" aria-hidden />
        </header>

        <div ref={scrollRef} className={cn(conversation.length > 0 && "hidden")}>
          <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 py-10 text-center md:px-6">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div />
              <Moon className="absolute inset-0 rounded-full text-[#5B6BD8] fill-[#5B6BD8]" />
            </div>

            <h1 className="text-4xl font-medium tracking-tight text-[#1C1D2E] dark:text-[#EDEBF9] md:text-5xl">
              Hi, I'm <span className="text-[#5B6BD8] lokeya">Luna</span>
            </h1>
            <p className="max-w-sm text-lg text-[#5B5F78] dark:text-[#9599B8]">
              {isSession ? (
                <span>Ready when you are.</span>
              ) : (
                <span>What can I help you with today, {auth?.name.trim().split(" ")[0]}?</span>
              )}
            </p>
          </div>
        </div>

        {isLoadingConversation && conversation.length === 0 && <MessageSkeleton />}

        <div className={cn(conversation.length === 0 ? "hidden" : "flex-1 overflow-y-auto overscroll-contain scrollable-div")}>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 md:px-6">
            {conversation.map((message, index) => (
              <ChatTurn
                message={message}
                index={index}
                key={index}
                isLast={index === conversation.length - 1}
                onTypingChange={setIsTypingOut}
              />
            ))}
          </div>
          {isGenerating && (
            <div className="flex items-center gap-2 mx-auto w-full max-w-3xl px-4 py-3 md:px-6">
              <Moon className="rounded-full text-[#5B6BD8] fill-[#5B6BD8] size-4 animate-spin" />
              <span className="text-sm text-[#5B6BD8]/90">Thinking...</span>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>

        <div className="shrink-0 px-4 pb-5 pt-2">
          <div className="mx-auto w-full max-w-3xl">
            <InputGroup
              className={cn(
                "rounded-[1.75rem] border-border bg-card shadow-sm transition-all",
                isListening && "border-rose-400 ring-2 ring-rose-400/30",
                "has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/30"
              )}
            >
              <InputGroupTextarea
                id="chat-composer"
                placeholder={isListening ? "Listening to your voice..." : "Reply to Luna..."}
                rows={1}
                value={prompt}
                className="min-h-12 max-h-80 resize-none px-4 pt-4 pb-2 text-[0.9375rem] placeholder:text-muted-foreground scrollable-div"
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyEnter}
              />
              <InputGroupAddon align="block-end" className="w-full px-3 pb-3 pt-0">
                <InputGroupButton
                  aria-label="Add attachment"
                  className="text-muted-foreground hover:text-foreground"
                  disabled={isTypingOut || isGenerating}
                >
                  <Plus />
                </InputGroupButton>
                <div className="ml-auto flex items-center gap-1.5">
                  {/* Voice input (Speech to Text) */}
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className={cn(
                            "rounded-full transition-all",
                            isListening
                              ? "bg-rose-500 text-white hover:bg-rose-600 animate-pulse shadow-sm ring-2 ring-rose-300 dark:ring-rose-900"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          aria-label={isListening ? "Stop listening" : "Voice input"}
                          onClick={handleToggleVoiceInput}
                          disabled={isTypingOut || isGenerating}
                        >
                          {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                        </Button>
                      }
                    />
                    <TooltipContent side="top">
                      <p>{isListening ? "Listening... Click to stop" : "Voice dictation (Speech to text)"}</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Audio Readout Mode Toggle */}
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className={cn(
                            "rounded-full transition-all",
                            isAudioMode
                              ? "bg-[#5B6BD8] text-white hover:bg-[#4C5BC4] shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          aria-label="Audio readout mode"
                          onClick={toggleAudioMode}
                          disabled={isTypingOut || isGenerating}
                        >
                          <AudioLines className={cn("size-4", isAudioMode && "animate-pulse")} />
                        </Button>
                      }
                    />
                    <TooltipContent side="top">
                      <p>
                        {isAudioMode
                          ? "Audio Readout: ON (Luna speaks responses)"
                          : "Turn on Audio Readout Mode"}
                      </p>
                    </TooltipContent>
                  </Tooltip>

                  {canSend && (
                    <Button
                      type="submit"
                      size="icon-sm"
                      className="rounded-full bg-[#5B6BD8] text-primary-foreground hover:bg-[#5B6BD8]/90"
                      aria-label="Send message"
                      onClick={handleSendPrompt}
                      disabled={isTypingOut || isGenerating}
                    >
                      <ArrowUp className="text-white size-4" />
                    </Button>
                  )}
                </div>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
