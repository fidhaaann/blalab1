import { type NextRequest, NextResponse } from "next/server"

// Sarvam API configuration
const SARVAM_API_URL = "https://api.sarvam.ai/speech-to-text"
const SARVAM_API_KEY = process.env.SARVAM_API_KEY

// Google Gemini API configuration
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// Simple function to create chunks from a File by splitting it into smaller blobs
async function createSimpleAudioChunks(audioFile: File, maxSizeBytes: number = 8 * 1024 * 1024): Promise<File[]> {
  const chunks: File[] = []
  const arrayBuffer = await audioFile.arrayBuffer()
  const chunkSize = maxSizeBytes
  
  for (let i = 0; i < arrayBuffer.byteLength; i += chunkSize) {
    const end = Math.min(i + chunkSize, arrayBuffer.byteLength)
    const chunkArrayBuffer = arrayBuffer.slice(i, end)
    const chunkBlob = new Blob([chunkArrayBuffer], { type: audioFile.type })
    const chunkFile = new File([chunkBlob], `chunk_${chunks.length}.${audioFile.name.split('.').pop()}`, { 
      type: audioFile.type 
    })
    chunks.push(chunkFile)
  }
  
  return chunks
}

async function processAudioChunks(chunks: File[]): Promise<string> {
  const transcriptions: string[] = []

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]

    const sarvamFormData = new FormData()
    sarvamFormData.append("file", chunk)
    sarvamFormData.append("model", "saarika:v2")

    try {
      const sarvamResponse = await fetch(SARVAM_API_URL, {
        method: "POST",
        headers: SARVAM_API_KEY ? { "api-subscription-key": SARVAM_API_KEY as string } : {},
        body: sarvamFormData,
      })

      if (sarvamResponse.ok) {
        const sarvamData = await sarvamResponse.json()
        const transcription = sarvamData.transcript || sarvamData.text || ""
        if (transcription.trim()) {
          transcriptions.push(transcription.trim())
        }
      } else {
        console.warn(`Failed to process chunk ${i + 1}/${chunks.length}`)
      }
    } catch (error) {
      console.warn(`Error processing chunk ${i + 1}/${chunks.length}:`, error)
    }

    // Add small delay between requests to avoid rate limiting
    if (i < chunks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  return transcriptions.join(" ")
}

export async function POST(request: NextRequest) {
  try {
    // Check for required environment variables
    if (!SARVAM_API_KEY || !GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Missing required API keys. Please check environment variables." },
        { status: 500 },
      )
    }

    if (!SARVAM_API_KEY.startsWith("sk_") || SARVAM_API_KEY.length < 20) {
      return NextResponse.json(
        { error: "Invalid Sarvam API key format. Please check your SARVAM_API_KEY environment variable." },
        { status: 500 },
      )
    }

    if (!GEMINI_API_KEY.startsWith("AIza") || GEMINI_API_KEY.length < 30) {
      return NextResponse.json(
        { error: "Invalid Gemini API key format. Please check your GEMINI_API_KEY environment variable." },
        { status: 500 },
      )
    }

    // Parse the multipart form data
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const slangType = (formData.get("slangType") as string) || "genz"

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Validate file format
    const allowedFormats = ["audio/mp3", "audio/wav", "audio/m4a", "audio/mpeg", "audio/webm", "audio/ogg"]
    if (!allowedFormats.includes(audioFile.type)) {
      return NextResponse.json(
        {
          error: "Unsupported audio format. Please use MP3, WAV, M4A, WebM, or OGG.",
        },
        { status: 400 },
      )
    }

    const maxFileSize = 100 * 1024 * 1024 // 100MB
    if (audioFile.size > maxFileSize) {
      return NextResponse.json(
        {
          error: "File too large. Please use files smaller than 100MB.",
        },
        { status: 400 },
      )
    }

    let transcription = ""
    let detectedLanguage = "English"

    const sarvamFormData = new FormData()
    sarvamFormData.append("file", audioFile)
    sarvamFormData.append("model", "saarika:v2")

    try {
      const sarvamResponse = await fetch(SARVAM_API_URL, {
        method: "POST",
        headers: {
          "api-subscription-key": SARVAM_API_KEY,
        },
        body: sarvamFormData,
      })

      if (sarvamResponse.ok) {
        // File processed successfully
        const sarvamData = await sarvamResponse.json()
        transcription = sarvamData.transcript || sarvamData.text || ""
        detectedLanguage = sarvamData.language_code === "en" ? "English" : "Malayalam"
      } else {
        const errorText = await sarvamResponse.text()

        if (sarvamResponse.status === 403) {
          const errorData = JSON.parse(errorText)
          if (errorData.detail?.includes("Subscription not found")) {
            return NextResponse.json(
              {
                error:
                  "Invalid Sarvam API subscription. Please check your API key and ensure your subscription is active.",
                details:
                  "The provided API key does not have an active subscription. Please verify your Sarvam API key and subscription status.",
              },
              { status: 403 },
            )
          }
        }

        if (errorText.includes("duration greater than 30 seconds") || errorText.includes("duration greater than 2 minutes") || errorText.includes("duration greater than 120 seconds") || errorText.includes("duration") || sarvamResponse.status === 413) {
          // File is too long, split it into chunks
          console.log("File too long, splitting into chunks...")

          try {
            // Use larger chunks (8MB) for better processing
            const chunks = await createSimpleAudioChunks(audioFile, 8 * 1024 * 1024)
            transcription = await processAudioChunks(chunks)

            if (!transcription.trim()) {
              throw new Error("No transcription received from audio chunks")
            }

            // Detect language from first few words (simple heuristic)
            detectedLanguage = /[\u0D00-\u0D7F]/.test(transcription) ? "Malayalam" : "English"
          } catch (splitError) {
            console.error("Error splitting audio:", splitError)
            return NextResponse.json(
              {
                error: "Failed to process long audio file. Please try with a shorter file or check the audio format.",
                details: splitError instanceof Error ? splitError.message : "Audio splitting failed",
              },
              { status: 500 },
            )
          }
        } else {
          throw new Error(`Sarvam API error: ${sarvamResponse.status} - ${errorText}`)
        }
      }
    } catch (fetchError) {
      console.error("Error calling Sarvam API:", fetchError)
      return NextResponse.json(
        {
          error: "Failed to process audio with Sarvam API. Please check your API key and subscription status.",
          details: fetchError instanceof Error ? fetchError.message : "Unknown error",
        },
        { status: 500 },
      )
    }

    if (!transcription.trim()) {
      return NextResponse.json({ error: "No transcription received from audio" }, { status: 400 })
    }

    let geminiPrompt = ""
    let explanationLabel = ""

    switch (slangType) {
      case "normal":
        geminiPrompt = `Provide a clear, professional summary of this text in 2-3 sentences: "${transcription}"`
        explanationLabel = "📝 Summary"
        break
      case "genz":
        geminiPrompt = `Convert this text into a short, fun Gen Z slang explanation (max 2-3 sentences). Make it casual, trendy, and use modern slang terms like "no cap", "fr", "periodt", "slay", etc. Text: "${transcription}"`
        explanationLabel = "🔥 Gen Z Translation"
        break
      case "funny":
        geminiPrompt = `Rewrite this text in a hilarious, over-the-top funny way (max 2-3 sentences). Use humor, exaggeration, and comedic timing. Make it entertaining and witty: "${transcription}"`
        explanationLabel = "😂 Funny Version"
        break
      case "sarcasm":
        geminiPrompt = `Rewrite this text with heavy sarcasm and wit (max 2-3 sentences). Be cleverly sarcastic, use ironic tone, and add some sass: "${transcription}"`
        explanationLabel = "😏 Sarcastic Take"
        break
      case "irony":
        geminiPrompt = `Rewrite this text highlighting the irony and contradictions (max 2-3 sentences). Point out the ironic elements and unexpected twists in a clever way: "${transcription}"`
        explanationLabel = "🎭 Ironic Perspective"
        break
      default:
        geminiPrompt = `Convert this text into a short, fun Gen Z slang explanation (max 2-3 sentences). Make it casual, trendy, and use modern slang terms. Text: "${transcription}"`
        explanationLabel = "🔥 Gen Z Translation"
    }

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: geminiPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error("Gemini API error:", errorText)
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`)
    }

    const geminiData = await geminiResponse.json()
    const slangExplanation = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "No explanation generated"

    if (!slangExplanation || slangExplanation === "No explanation generated") {
      console.warn("Gemini returned empty response, using fallback")
      const fallbackExplanation = `Here's what was said: ${transcription.substring(0, 200)}${transcription.length > 200 ? '...' : ''}`
      
      return NextResponse.json({
        success: true,
        detectedLanguage,
        transcription,
        slangExplanation: fallbackExplanation,
        explanationLabel,
        slangType,
      })
    }

    // Return all results
    return NextResponse.json({
      success: true,
      detectedLanguage,
      transcription,
      slangExplanation: slangExplanation.trim(),
      explanationLabel,
      slangType,
    })
  } catch (error) {
    console.error("Error processing audio:", error)
    return NextResponse.json(
      {
        error: "Failed to process audio. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Blablab Audio Processing API",
    status: "Ready",
    endpoints: {
      POST: "/api/process-audio - Upload audio file for processing",
    },
  })
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
