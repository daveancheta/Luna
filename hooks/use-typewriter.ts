import { useEffect, useState } from "react"

export function useTypewriter(fullText: string, active: boolean, speed = 25) {
  const [displayed, setDisplayed] = useState(active ? "" : fullText)
  const [isTyping, setIsTyping] = useState(active)

  useEffect(() => {
    if (!active) {
      setDisplayed(fullText)
      setIsTyping(false)
      return
    }

    setDisplayed("")
    setIsTyping(true)
    const words = fullText.split(" ")
    let i = 0

    const id = setInterval(() => {
      i++
      setDisplayed(words.slice(0, i).join(" "))
      if (i >= words.length) {
        clearInterval(id)
        setIsTyping(false)
      }
    }, speed)

    return () => clearInterval(id)
  }, [fullText, active, speed])

  return { displayed, isTyping }
}