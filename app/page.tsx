"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Upload, Sun, Moon, Volume2, Play, Pause, ChevronDown } from "lucide-react"

interface ProcessingResults {
  detectedLanguage: string
  transcription: string
  slangExplanation: string
  explanationLabel: string
  slangType: string
}

type SlangType = "normal" | "genz" | "funny" | "sarcasm" | "irony"

const slangOptions = [
  { value: "normal", label: "📝 Normal", description: "Clean professional summary" },
  { value: "genz", label: "🔥 Gen Z", description: "Trendy slang translation" },
  { value: "funny", label: "😂 Funny", description: "Hilarious interpretation" },
  { value: "sarcasm", label: "😏 Sarcastic", description: "Witty sarcastic take" },
  { value: "irony", label: "🎭 Ironic", description: "Ironic perspective" },
]

const BlablabLogo = ({ isDark }: { isDark: boolean }) => (
  <svg width="40" height="40" viewBox="0 0 40 40" className="mr-3">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={isDark ? "#FFCC00" : "#E43636"} />
        <stop offset="100%" stopColor={isDark ? "#B13BFF" : "#E43636"} />
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="18" fill="url(#logoGradient)" />
    <path d="M12 15c0-2 1-3 3-3s3 1 3 3v10c0 2-1 3-3 3s-3-1-3-3V15z" fill="white" opacity="0.9" />
    <path d="M22 18c0-1.5 1-2.5 3-2.5s3 1 3 2.5v4c0 1.5-1 2.5-3 2.5s-3-1-3-2.5v-4z" fill="white" opacity="0.7" />
    <circle cx="32" cy="20" r="2" fill="white" opacity="0.5" />
  </svg>
)

const FloatingParticles = () => {
  const [positions, setPositions] = useState<number[]>([]);
  useEffect(() => {
    // Only run on client
    setPositions(Array.from({ length: 5 }, () => Math.random() * 100));
  }, []);
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {positions.map((left, i) => (
        <div
          key={i}
          className={`particle particle-${i + 1} w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20`}
          style={{
            left: `${left}%`,
            animationDelay: `${i * 2}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function BlablabHome() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<ProcessingResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedSlang, setSelectedSlang] = useState<SlangType>("genz")
  const [showSlangDropdown, setShowSlangDropdown] = useState(false)
  const [uploadedAudio, setUploadedAudio] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Auto-detect theme preference
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    setIsDarkMode(prefersDark)
  }, [])

  // Apply theme to document
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", isDarkMode)
    }
  }, [isDarkMode])

  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = ["audio/mp3", "audio/wav", "audio/m4a", "audio/mpeg", "audio/webm", "audio/ogg"]
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload an MP3, WAV, M4A, WebM, or OGG file")
      return
    }

    const maxFileSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxFileSize) {
      setError("File too large. Please use files smaller than 100MB.")
      return
    }

    const audioUrl = URL.createObjectURL(file)
    setUploadedAudio(audioUrl)

    setIsProcessing(true)
    setError(null)
    setResults(null)

    try {
      const formData = new FormData()
      formData.append("audio", file)
      formData.append("slangType", selectedSlang)

      const response = await fetch("/api/process-audio", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === "BATCH_API_REQUIRED") {
          throw new Error(data.error + " " + (data.suggestion || ""))
        }
        throw new Error(data.error || "Failed to process audio")
      }

      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      className={`min-h-screen transition-all duration-500 relative overflow-hidden ${
        isDarkMode
          ? "bg-gradient-to-br from-[#090040] via-[#471396] to-[#B13BFF]"
          : "bg-gradient-to-br from-[#F6EFD2] via-[#E2DDB4] to-white"
      }`}
    >
      <FloatingParticles />

      {/* Header */}
      <header className="flex justify-between items-center p-6 relative z-10">
        <div className="flex items-center">
          <BlablabLogo isDark={isDarkMode} />
          <h1 className={`text-3xl font-bold font-poppins ${isDarkMode ? "text-[#FFCC00]" : "text-[#E43636]"}`}>
            Blablab
          </h1>
        </div>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${
            isDarkMode ? "bg-[#FFCC00] text-[#090040] hover:bg-yellow-300" : "bg-[#E43636] text-white hover:bg-red-600"
          }`}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 relative z-10">
        <div className="text-center mb-12">
          <h2
            className={`text-5xl font-bold mb-4 font-poppins animate-float ${isDarkMode ? "text-white" : "text-black"}`}
          >
            Turn Your Voice into Any Style
          </h2>
          <p className={`text-xl font-inter ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Upload audio in English or Malayalam and get it translated into your preferred style!
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <button
              onClick={() => setShowSlangDropdown(!showSlangDropdown)}
              className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all hover:scale-105 ${
                isDarkMode
                  ? "border-[#B13BFF] bg-[#471396]/20 text-white hover:bg-[#471396]/30"
                  : "border-[#E43636] bg-white/50 text-black hover:bg-white/70"
              }`}
            >
              <div className="flex items-center">
                <span className="text-lg font-medium font-poppins">
                  {slangOptions.find((opt) => opt.value === selectedSlang)?.label}
                </span>
                <span className={`ml-2 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {slangOptions.find((opt) => opt.value === selectedSlang)?.description}
                </span>
              </div>
              <ChevronDown size={20} className={`transition-transform ${showSlangDropdown ? "rotate-180" : ""}`} />
            </button>

            {showSlangDropdown && (
              <div
                className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border-2 overflow-hidden z-20 ${
                  isDarkMode
                    ? "border-[#B13BFF] bg-[#471396]/90 backdrop-blur-sm"
                    : "border-[#E43636] bg-white/90 backdrop-blur-sm"
                }`}
              >
                {slangOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedSlang(option.value as SlangType)
                      setShowSlangDropdown(false)
                    }}
                    className={`w-full p-4 text-left hover:bg-opacity-50 transition-colors ${
                      selectedSlang === option.value
                        ? isDarkMode
                          ? "bg-[#B13BFF]/30"
                          : "bg-[#E43636]/20"
                        : isDarkMode
                          ? "hover:bg-[#B13BFF]/20"
                          : "hover:bg-[#E43636]/10"
                    }`}
                  >
                    <div className={`font-medium font-poppins ${isDarkMode ? "text-white" : "text-black"}`}>
                      {option.label}
                    </div>
                    <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upload Section */}
        <div className="max-w-2xl mx-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
            aria-label="Upload audio file"
          />

          <div
            onClick={triggerFileUpload}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all hover:scale-105 animate-pulse-glow ${
              isDarkMode
                ? "border-[#B13BFF] bg-[#471396]/20 hover:bg-[#471396]/30"
                : "border-[#E43636] bg-white/50 hover:bg-white/70"
            }`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                triggerFileUpload()
              }
            }}
          >
            <Upload size={48} className={`mx-auto mb-4 ${isDarkMode ? "text-[#FFCC00]" : "text-[#E43636]"}`} />
            <h3 className={`text-2xl font-semibold mb-2 font-poppins ${isDarkMode ? "text-white" : "text-black"}`}>
              Drop your audio here
            </h3>
            <p className={`font-inter ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Supports MP3, WAV, M4A, WebM, and OGG files (up to 50MB)
            </p>
          </div>

          {/* Processing Animation */}
          {isProcessing && (
            <div className="mt-8 text-center">
              <div className="flex justify-center items-center space-x-2 mb-4">
                <Volume2 className={`animate-bounce ${isDarkMode ? "text-[#FFCC00]" : "text-[#E43636]"}`} />
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 rounded-full animate-pulse ${isDarkMode ? "bg-[#B13BFF]" : "bg-[#E43636]"}`}
                      style={{
                        height: `${Math.random() * 40 + 20}px`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: "1s",
                      }}
                    />
                  ))}
                </div>
              </div>
              <p className={`text-lg font-poppins ${isDarkMode ? "text-[#FFCC00]" : "text-[#E43636]"}`}>
                Processing your audio...
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div
              className={`mt-8 p-4 rounded-lg ${isDarkMode ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-700"}`}
              role="alert"
            >
              <p className="font-semibold font-poppins">Oops! Something went wrong:</p>
              <p className="font-inter">{error}</p>
            </div>
          )}

          {uploadedAudio && (
            <div className="mt-8">
              <audio ref={audioRef} src={uploadedAudio} onEnded={() => setIsPlaying(false)} className="hidden" />
              <div
                className={`p-4 rounded-2xl flex items-center justify-between ${
                  isDarkMode ? "bg-[#471396]/30" : "bg-white/70"
                }`}
              >
                <span className={`font-poppins ${isDarkMode ? "text-white" : "text-black"}`}>🎵 Uploaded Audio</span>
                <button
                  onClick={toggleAudioPlayback}
                  className={`p-2 rounded-full transition-all hover:scale-110 ${
                    isDarkMode ? "bg-[#FFCC00] text-[#090040]" : "bg-[#E43636] text-white"
                  }`}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
              </div>
            </div>
          )}

          {/* Results Display */}
          {results && (
            <div className="mt-8 space-y-6">
              <div className={`p-6 rounded-2xl ${isDarkMode ? "bg-[#471396]/30" : "bg-white/70"}`}>
                <h3
                  className={`text-xl font-semibold mb-2 font-poppins ${isDarkMode ? "text-[#FFCC00]" : "text-[#E43636]"}`}
                >
                  🌍 Detected Language
                </h3>
                <p className={`text-lg font-inter ${isDarkMode ? "text-white" : "text-black"}`}>
                  {results.detectedLanguage}
                </p>
              </div>

              <div className={`p-6 rounded-2xl ${isDarkMode ? "bg-[#471396]/30" : "bg-white/70"}`}>
                <h3
                  className={`text-xl font-semibold mb-2 font-poppins ${isDarkMode ? "text-[#FFCC00]" : "text-[#E43636]"}`}
                >
                  📝 Transcription
                </h3>
                <p className={`text-lg font-inter ${isDarkMode ? "text-white" : "text-black"}`}>
                  {results.transcription}
                </p>
              </div>

              <div className={`p-6 rounded-2xl ${isDarkMode ? "bg-[#B13BFF]/20" : "bg-[#E43636]/10"}`}>
                <h3
                  className={`text-xl font-semibold mb-2 font-poppins ${isDarkMode ? "text-[#FFCC00]" : "text-[#E43636]"}`}
                >
                  {results.explanationLabel}
                </h3>
                <p className={`text-lg font-medium font-inter ${isDarkMode ? "text-white" : "text-black"}`}>
                  {results.slangExplanation}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={`text-center py-8 relative z-10 font-inter ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
        <p>Made with ❤️ for creative expression</p>
      </footer>
    </div>
  )
}
