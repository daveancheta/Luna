"use client"

import { Button } from "@/components/ui/button"
import { UseAuthStore } from "./state/use-store-auth"
import StackIcon from "tech-stack-icons"
import Image from "next/image"
import { useEffect } from "react"
import { redirect } from "next/navigation"

export default function LandingPage() {
  const { signInWithGoogle, isLoading, handleGetSession, auth } = UseAuthStore()

  useEffect(() => {
    handleGetSession(true)
  }, [handleGetSession])

  if (auth) redirect("/new")

  return (
    <div className="flex h-svh w-full flex-col overflow-hidden bg-background lg:flex-row">
      <div className="relative h-[38vh] w-full shrink-0 overflow-hidden bg-[#1C1D2E] lg:h-full lg:flex-1">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/luna-demo.mp4"
          poster="/images/luna-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#1C1D2E]/85 via-[#1C1D2E]/10 to-[#1C1D2E]/40" />

        <div className="absolute left-5 top-5 flex items-center gap-2 lg:left-8 lg:top-8">
          <Image src="/luna_without_bg.png" alt="luna" height={50} width={50} />
          <span className="font-medium lokeya text-xl text-[#5B6BD8]">Luna</span>
        </div>

        <div className="absolute bottom-8 left-5 right-5 hidden max-w-md lg:left-8 lg:block">
          <h2 className="text-3xl font-medium leading-tight tracking-tight text-white xl:text-4xl">
            An AI that actually listens
          </h2>
          <p className="mt-3 text-[0.9375rem] text-white/80">
            Upload your medical records, get AI-generated summaries, and ask
            questions about your care — Luna organizes it all and is here
            whenever you need her.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 lg:flex-none lg:w-110 lg:border-l lg:border-border xl:w-120">
        <div className="w-full max-w-[320px]">
          <h1 className="text-2xl font-medium tracking-tight text-[#1C1D2E] dark:text-[#EDEBF9]">
            Welcome to Luna
          </h1>
          <p className="mt-2 text-[0.9375rem] text-[#5B5F78] dark:text-[#9599B8]">
            Sign in to continue to your workspace.
          </p>

          <Button
            disabled={isLoading}
            onClick={signInWithGoogle}
            className="w-full flex-1 h-15 mt-5 rounded-full cursor-pointer"
          >
            <StackIcon name="google" className="size-4" />
            {isLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          <p className="mt-8 text-center text-xs leading-relaxed text-[#5B5F78] dark:text-[#9599B8]">
            By continuing, you agree to Luna&apos;s{" "}
            <a href="/terms" className="underline underline-offset-2 hover:text-[#1C1D2E] dark:hover:text-[#EDEBF9]">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline underline-offset-2 hover:text-[#1C1D2E] dark:hover:text-[#EDEBF9]">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}