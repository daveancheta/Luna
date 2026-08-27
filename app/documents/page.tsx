"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { UseSidebarStore } from "../state/use-store-sidebar"
import { UseAuthStore } from "../state/use-store-auth"
import { UseAiStore } from "../state/use-store-ai"
import {
    FileText,
    Search,
    Download,
    ExternalLink,
    Sparkles,
    Layers,
    LayoutGrid,
    Columns2,
    BookOpen,
    Maximize2,
    Minimize2,
    X,
    Stethoscope,
    ShieldCheck,
    Baby,
    FileCheck,
    RefreshCw,
    ArrowLeft,
} from "lucide-react"

interface DocItem {
    fileName: string
    title: string
    source: string
    category: "Treatment" | "Screening" | "Prevention" | "Pediatric" | "Guidelines" | "General"
    sizeBytes: number
    sizeFormatted: string
    url: string
    description?: string
}

const CATEGORIES = [
    { id: "all", label: "All Documents", icon: Layers },
    { id: "Treatment", label: "Treatment", icon: Stethoscope },
    { id: "Screening", label: "Screening", icon: ShieldCheck },
    { id: "Prevention", label: "Prevention", icon: FileCheck },
    { id: "Pediatric", label: "Pediatric", icon: Baby },
    { id: "Guidelines", label: "Guidelines", icon: BookOpen },
]

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<DocItem[]>([])
    const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [viewMode, setViewMode] = useState<"split" | "grid">("split")
    const [mobileTab, setMobileTab] = useState<"list" | "viewer">("list")
    const [isLoading, setIsLoading] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)

    const isMobile = useIsMobile()
    const router = useRouter()
    const { sidebar } = UseSidebarStore()
    const { handleGetSession } = UseAuthStore()
    const { generateResponse } = UseAiStore()

    useEffect(() => {
        handleGetSession(true)
    }, [handleGetSession])

    const fetchDocuments = async () => {
        try {
            setIsLoading(true)
            const res = await fetch("/api/docs")
            const data = await res.json()
            if (data.success && data.documents) {
                setDocuments(data.documents)
                if (data.documents.length > 0 && !selectedDoc) {
                    setSelectedDoc(data.documents[0])
                }
            }
        } catch (err) {
            console.error("Failed to load documents:", err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchDocuments()
    }, [])

    const filteredDocuments = useMemo(() => {
        return documents.filter((doc) => {
            const matchesSearch =
                searchQuery.trim() === "" ||
                doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesCategory =
                selectedCategory === "all" || doc.category === selectedCategory

            return matchesSearch && matchesCategory
        })
    }, [documents, searchQuery, selectedCategory])

    const handleSelectDoc = (doc: DocItem) => {
        setSelectedDoc(doc)
        if (viewMode === "grid") {
            setViewMode("split")
        }
        if (isMobile) {
            setMobileTab("viewer")
        }
    }

    const handleAskLuna = (doc: DocItem) => {
        const prompt = `Can you provide a summary of the clinical guidelines and key points in "${doc.title}"?`
        const conversationId = crypto.randomUUID()
        generateResponse(prompt, conversationId, `Inquiry: ${doc.title}`)
        router.push(`/chat/${conversationId}`)
    }

    const getCategoryBadgeColor = (category: string) => {
        switch (category) {
            case "Treatment":
                return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40"
            case "Screening":
                return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40"
            case "Prevention":
                return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40"
            case "Pediatric":
                return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40"
            case "Guidelines":
                return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40"
            default:
                return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800/40"
        }
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="flex h-svh flex-col overflow-hidden bg-background">
                {/* Top Navigation Header */}
                <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/80 px-3 md:px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-2 md:gap-3">
                        {(!isMobile && sidebar === "expanded") || isMobile ? (
                            <div className="flex flex-row gap-2 items-center">
                                <Tooltip>
                                    <TooltipTrigger render={<SidebarTrigger className="-ml-1" />} />
                                    <TooltipContent side="right">
                                        <p>Expand Sidebar</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Separator
                                    orientation="vertical"
                                    className="mr-1 data-vertical:h-4 data-vertical:self-auto"
                                />
                            </div>
                        ) : null}

                        <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-[#5B6BD8]/10 text-[#5B6BD8]">
                                <FileText className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-1.5 md:gap-2">
                                    <span>Medical Documents Library</span>
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-normal text-muted-foreground">
                                        {documents.length}
                                    </span>
                                </h1>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* View Mode Switcher (Desktop) */}
                        <div className="hidden sm:flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5">
                            <button
                                type="button"
                                onClick={() => setViewMode("split")}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                                    viewMode === "split"
                                        ? "bg-background text-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Columns2 className="size-3.5" />
                                <span>Split View</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("grid")}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                                    viewMode === "grid"
                                        ? "bg-background text-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <LayoutGrid className="size-3.5" />
                                <span>Grid View</span>
                            </button>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchDocuments}
                            className="h-8 gap-1.5 rounded-lg border-border/60 text-xs hover:bg-muted"
                        >
                            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
                            <span className="hidden md:inline">Refresh</span>
                        </Button>
                    </div>
                </header>

                {/* Main Workspace Body */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Document List / Filter Panel */}
                    <div
                        className={cn(
                            "flex flex-col border-r border-border/60 transition-all duration-200 bg-background",
                            viewMode === "split"
                                ? isFullscreen
                                    ? "hidden"
                                    : isMobile && mobileTab === "viewer"
                                        ? "hidden"
                                        : "w-full md:w-[380px] lg:w-[440px] shrink-0"
                                : "w-full"
                        )}
                    >
                        {/* Search and Category Filters */}
                        <div className="space-y-3 p-3.5 border-b border-border/50 bg-card/30">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder="Search medical documents, guidelines..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-8 h-9 text-xs rounded-xl bg-background/80 border-border/70 focus-visible:ring-[#5B6BD8]"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Category Pills */}
                            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                {CATEGORIES.map((cat) => {
                                    const Icon = cat.icon
                                    const isSelected = selectedCategory === cat.id
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={cn(
                                                "flex items-center gap-1.5 shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-all border",
                                                isSelected
                                                    ? "bg-[#5B6BD8] text-white border-[#5B6BD8] shadow-xs"
                                                    : "bg-background/80 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            <Icon className="size-3" />
                                            <span>{cat.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Document Cards List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                            {isLoading ? (
                                <div className="space-y-3 p-1">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <div
                                            key={n}
                                            className="animate-pulse rounded-xl border border-border/60 p-3.5 bg-card/40 space-y-2"
                                        >
                                            <div className="h-4 bg-muted rounded-md w-3/4" />
                                            <div className="h-3 bg-muted/60 rounded-md w-1/2" />
                                            <div className="flex gap-2 pt-2">
                                                <div className="h-5 bg-muted/50 rounded-md w-16" />
                                                <div className="h-5 bg-muted/50 rounded-md w-14" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : filteredDocuments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 text-center h-64 text-muted-foreground">
                                    <FileText className="size-10 stroke-1 mb-2 text-muted-foreground/50" />
                                    <p className="text-sm font-medium text-foreground">No documents found</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                                        Try adjusting your search query or selected category filter.
                                    </p>
                                </div>
                            ) : (
                                <div
                                    className={cn(
                                        viewMode === "grid"
                                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                                            : "space-y-2"
                                    )}
                                >
                                    {filteredDocuments.map((doc) => {
                                        const isSelected = selectedDoc?.fileName === doc.fileName
                                        return (
                                            <div
                                                key={doc.fileName}
                                                onClick={() => handleSelectDoc(doc)}
                                                className={cn(
                                                    "group relative rounded-xl border p-3.5 transition-all cursor-pointer text-left bg-card hover:bg-muted/40",
                                                    isSelected && viewMode === "split"
                                                        ? "border-[#5B6BD8] bg-[#5B6BD8]/5 dark:bg-[#5B6BD8]/10 shadow-xs ring-1 ring-[#5B6BD8]/30"
                                                        : "border-border/60 hover:border-border"
                                                )}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className={cn(
                                                            "flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                                                            isSelected && viewMode === "split"
                                                                ? "bg-[#5B6BD8] text-white border-[#5B6BD8]"
                                                                : "bg-muted/70 border-border/70 text-muted-foreground group-hover:text-foreground group-hover:border-[#5B6BD8]/40"
                                                        )}
                                                    >
                                                        <FileText className="size-4.5" />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="text-xs sm:text-sm font-semibold text-foreground leading-snug line-clamp-2">
                                                            {doc.title}
                                                        </h3>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                                            {doc.source}
                                                        </p>

                                                        {doc.description && viewMode === "grid" && (
                                                            <p className="text-xs text-muted-foreground/80 mt-2 line-clamp-2">
                                                                {doc.description}
                                                            </p>
                                                        )}

                                                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                                                            <span
                                                                className={cn(
                                                                    "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium border",
                                                                    getCategoryBadgeColor(doc.category)
                                                                )}
                                                            >
                                                                {doc.category}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md border border-border/40">
                                                                {doc.sizeFormatted}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card Action Buttons */}
                                                <div className="flex items-center justify-between gap-1 mt-3 pt-2.5 border-t border-border/40">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleAskLuna(doc)
                                                        }}
                                                        className="h-7 px-2 text-[11px] text-[#5B6BD8] hover:text-[#5B6BD8] hover:bg-[#5B6BD8]/10 rounded-lg gap-1"
                                                    >
                                                        <Sparkles className="size-3" />
                                                        <span>Ask Luna</span>
                                                    </Button>

                                                    <div className="flex items-center gap-1">
                                                        <a
                                                            href={doc.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                            title="Open in new tab"
                                                        >
                                                            <ExternalLink className="size-3.5" />
                                                        </a>
                                                        <a
                                                            href={doc.url}
                                                            download={doc.fileName}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                            title="Download PDF"
                                                        >
                                                            <Download className="size-3.5" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Bottom summary footer */}
                        <div className="p-3 border-t border-border/50 bg-muted/20 text-[11px] text-muted-foreground flex items-center justify-between">
                            <span>National Cancer Institute & WHO References</span>
                            <span className="font-medium text-foreground">PDQ® Certified</span>
                        </div>
                    </div>

                    {/* PDF Viewer Pane */}
                    {viewMode === "split" && (
                        <div
                            className={cn(
                                "flex-1 flex flex-col h-full bg-muted/10 relative overflow-hidden",
                                isMobile && mobileTab === "list" ? "hidden" : "flex"
                            )}
                        >
                            {selectedDoc ? (
                                <>
                                    {/* PDF Viewer Header Toolbar */}
                                    <div className="flex h-13 shrink-0 items-center justify-between border-b border-border/70 bg-card/60 px-3 md:px-4 backdrop-blur">
                                        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                                            {isMobile && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setMobileTab("list")}
                                                    className="h-8 px-2 mr-1 -ml-1 text-xs gap-1 text-muted-foreground hover:text-foreground"
                                                >
                                                    <ArrowLeft className="size-3.5" />
                                                    <span>List</span>
                                                </Button>
                                            )}

                                            <div className="hidden sm:flex size-7 shrink-0 items-center justify-center rounded-md bg-[#5B6BD8]/15 text-[#5B6BD8]">
                                                <BookOpen className="size-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <h2 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                                                    {selectedDoc.title}
                                                </h2>
                                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                    <span className="truncate">{selectedDoc.source}</span>
                                                    <span>•</span>
                                                    <span>{selectedDoc.sizeFormatted}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Button
                                                size="sm"
                                                onClick={() => handleAskLuna(selectedDoc)}
                                                className="h-8 gap-1.5 rounded-lg bg-[#5B6BD8] text-white hover:bg-[#4C5BC4] shadow-xs text-xs font-medium"
                                            >
                                                <Sparkles className="size-3.5" />
                                                <span className="hidden sm:inline">Ask Luna About This</span>
                                            </Button>

                                            <a
                                                href={selectedDoc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                title="Open in new window"
                                            >
                                                <ExternalLink className="size-3.5" />
                                            </a>

                                            <a
                                                href={selectedDoc.url}
                                                download={selectedDoc.fileName}
                                                className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                title="Download PDF"
                                            >
                                                <Download className="size-3.5" />
                                            </a>

                                            <button
                                                type="button"
                                                onClick={() => setIsFullscreen(!isFullscreen)}
                                                className="hidden md:flex size-8 items-center justify-center rounded-lg border border-border/60 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Viewer"}
                                            >
                                                {isFullscreen ? (
                                                    <Minimize2 className="size-3.5" />
                                                ) : (
                                                    <Maximize2 className="size-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Embedded PDF iframe */}
                                    <div className="flex-1 w-full h-full relative bg-zinc-900/5 dark:bg-zinc-950/40">
                                        <iframe
                                            key={selectedDoc.fileName}
                                            src={`${selectedDoc.url}#toolbar=1&navpanes=0`}
                                            className="w-full h-full border-0"
                                            title={`PDF Preview: ${selectedDoc.title}`}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                                    <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 border border-border mb-4">
                                        <BookOpen className="size-7 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-base font-semibold text-foreground">Select a Document</h3>
                                    <p className="text-xs text-muted-foreground max-w-sm mt-1">
                                        Choose any clinical oncology guide or reference from the left panel to preview its contents and ask Luna questions.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
