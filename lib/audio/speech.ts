/**
 * Luna Speech Synthesis (TTS) & Recognition (STT) Service
 */

// Helper to strip markdown and symbols so speech sounds natural and fluid
export function cleanMarkdownForSpeech(text: string): string {
  if (!text) return "";

  let cleaned = text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, " code snippet ")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Remove markdown links [title](url) -> title
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    // Remove image tags ![alt](url)
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, "")
    // Remove bold/italic markers
    .replace(/[*_~]{1,3}(.*?)[*_~]{1,3}/g, "$1")
    // Remove headers (# Title)
    .replace(/^#{1,6}\s+/gm, "")
    // Remove blockquotes (> quote)
    .replace(/^>\s+/gm, "")
    // Clean bullet points
    .replace(/^[\*\-\+]\s+/gm, "")
    // Clean numbered lists (1. Item -> Item)
    .replace(/^\d+\.\s+/gm, "")
    // Clean horizontal rules
    .replace(/^[\-\*_]{3,}\s*$/gm, "")
    // Expand common acronyms for natural pronunciation
    .replace(/\bPDQ®?\b/gi, "P-D-Q")
    .replace(/\bWHO\b/g, "W-H-O")
    .replace(/\bNSCLC\b/gi, "Non-small cell lung cancer")
    .replace(/\bSCLC\b/gi, "Small cell lung cancer")
    .replace(/\bCT\b/g, "C-T scan")
    .replace(/\bMRI\b/g, "M-R-I")
    // Remove remaining unwanted special characters
    .replace(/[#*_~`\[\]\(\)\{\}\<\>\|\\\/]/g, " ")
    // Normalize spaces
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

// Split text into digestible sentence chunks to avoid browser speech timeout limits
function splitIntoSentences(text: string): string[] {
  const clean = cleanMarkdownForSpeech(text);
  if (!clean) return [];

  // Match sentences ending with . ! ? or linebreaks
  const sentences = clean.match(/[^.!?\n]+[.!?\n]+/g) || [clean];
  return sentences.map((s) => s.trim()).filter((s) => s.length > 0);
}

class SpeechService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private sentenceQueue: string[] = [];
  private currentSentenceIndex = 0;
  private isPlaying = false;
  private onEndCallback: (() => void) | null = null;
  private onStartCallback: (() => void) | null = null;
  private recognition: any = null;

  // Best natural voice selection
  private getBestVoice(): SpeechSynthesisVoice | null {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // Prefer high-quality English female / assistant voices
    const preferredVoiceNames = [
      "Google UK English Female",
      "Google US English",
      "Microsoft Jenny Online (Natural) - English (United States)",
      "Microsoft Aria Online (Natural) - English (United States)",
      "Microsoft Zira - English (United States)",
      "Samantha",
      "Victoria",
      "Karen",
      "Moira",
      "en-US",
      "en-GB",
    ];

    for (const name of preferredVoiceNames) {
      const match = voices.find(
        (v) =>
          v.name.toLowerCase().includes(name.toLowerCase()) ||
          v.lang.toLowerCase().replace("_", "-") === name.toLowerCase()
      );
      if (match) return match;
    }

    // Fallback to any English voice
    const anyEnglish = voices.find((v) => v.lang.startsWith("en"));
    return anyEnglish || voices[0] || null;
  }

  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): boolean {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("Speech synthesis not supported in this browser.");
      onError?.("Speech synthesis not supported.");
      return false;
    }

    this.stop();

    const sentences = splitIntoSentences(text);
    if (sentences.length === 0) {
      onEnd?.();
      return false;
    }

    this.sentenceQueue = sentences;
    this.currentSentenceIndex = 0;
    this.isPlaying = true;
    this.onStartCallback = onStart || null;
    this.onEndCallback = onEnd || null;

    this.speakNextSentence(onError);
    return true;
  }

  private speakNextSentence(onError?: (err: any) => void) {
    if (!this.isPlaying || this.currentSentenceIndex >= this.sentenceQueue.length) {
      this.isPlaying = false;
      this.currentUtterance = null;
      this.onEndCallback?.();
      return;
    }

    const sentence = this.sentenceQueue[this.currentSentenceIndex];
    const utterance = new SpeechSynthesisUtterance(sentence);
    this.currentUtterance = utterance;

    const voice = this.getBestVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.05; // Slightly warmer/softer tone for Luna
    utterance.volume = 1.0;

    if (this.currentSentenceIndex === 0) {
      utterance.onstart = () => {
        this.onStartCallback?.();
      };
    }

    utterance.onend = () => {
      this.currentSentenceIndex++;
      this.speakNextSentence(onError);
    };

    utterance.onerror = (e) => {
      // Cancelled by user is not an error
      if (e.error === "canceled" || e.error === "interrupted") {
        return;
      }
      console.error("SpeechSynthesis error:", e);
      this.isPlaying = false;
      this.onEndCallback?.();
      onError?.(e);
    };

    window.speechSynthesis.speak(utterance);
  }

  public stop() {
    this.isPlaying = false;
    this.sentenceQueue = [];
    this.currentSentenceIndex = 0;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (this.onEndCallback) {
      this.onEndCallback();
      this.onEndCallback = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // --- Speech to Text (Recognition) ---
  public isRecognitionSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onEnd?: () => void,
    onError?: (error: any) => void
  ): boolean {
    if (!this.isRecognitionSupported()) {
      onError?.("Speech recognition not supported in this browser.");
      return false;
    }

    this.stopListening();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    this.recognition = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const combined = finalTranscript || interimTranscript;
      onResult(combined, !!finalTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      this.recognition = null;
      onError?.(event.error);
    };

    recognition.onend = () => {
      this.recognition = null;
      onEnd?.();
    };

    try {
      recognition.start();
      return true;
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      onError?.(err);
      return false;
    }
  }

  public stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (err) {
        // Ignore already stopped error
      }
      this.recognition = null;
    }
  }
}

export const speechService = new SpeechService();
