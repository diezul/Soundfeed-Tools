"use server"

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

const API_KEY = process.env.OPENROUTER_API_KEY

// Helper for making API calls with JSON mode support
async function callOpenRouter(messages: any[], max_tokens: number, temperature: number, jsonMode = false) {
  if (!API_KEY) {
    throw new Error("OpenRouter API key is not configured")
  }

  console.log("🔑 API Key Status:", API_KEY ? "Present" : "Missing")
  console.log("🌐 Making request to OpenRouter API...")

  const body: any = {
    model: "deepseek/deepseek-chat-v3-0324:free",
    messages,
    max_tokens,
    temperature,
  }

  if (jsonMode) {
    body.response_format = { type: "json_object" }
  }

  console.log("📤 Request body:", JSON.stringify(body, null, 2))

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      "HTTP-Referer": "https://soundfeed-tools.vercel.app/",
      "X-Title": "Soundfeed Tools",
    },
    body: JSON.stringify(body),
  })

  console.log("📥 Response status:", response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`API Error (${response.status}): ${errorText}`)
    throw new Error(`API request failed with status ${response.status}`)
  }

  const data = (await response.json()) as OpenRouterResponse
  console.log("✅ API Response received, content length:", data.choices[0].message.content.length)

  return data.choices[0].message.content.trim()
}

// New robust JSON extractor
function extractAndParseJson(text: string): any | null {
  try {
    // Attempt 1: Parse the whole string directly (ideal case)
    return JSON.parse(text)
  } catch (e1) {
    // Attempt 2: Find JSON within markdown code fences
    const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
    if (markdownMatch && markdownMatch[1]) {
      try {
        return JSON.parse(markdownMatch[1])
      } catch (e2) {
        // Fall through to the next attempt
      }
    }

    // Attempt 3: Find the first and last curly brace (greedy match)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch && jsonMatch[0]) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch (e3) {
        // Fall through to final failure
      }
    }
  }
  // If all attempts fail, return null
  return null
}

// STEP 1: The Music Journalist - Interprets and synthesizes raw info
async function synthesizeInfo(rawInfo: any) {
  console.log("🎵 STEP 1: Starting synthesis with raw info:", rawInfo)

  const synthesisPrompt = `
    You are a senior music journalist and A&R storyteller. Your task is to analyze the following raw data about a new song and extract the core narrative, key themes, and marketing angles.

    INTERPRET the user's raw words into professional concepts.
    - If inspiration is "overdose and second chance", the theme is "redemption, gratitude, and celebrating life".
    - If inspiration is "political chaos", the theme is "social commentary and a call for unity".
    - If mood is "happy", interpret it as "uplifting, feel-good, or euphoric".

    Raw Data:
    - Song Title: "${rawInfo.song_title}"
    - Artist: "${rawInfo.artist_name}"
    - Genre: "${rawInfo.genre}"
    - Mood: "${rawInfo.mood}"
    - Inspiration: "${rawInfo.inspiration}"
    - Previous Work: "${rawInfo.previous_releases_details}"
    - Additional Info: "${rawInfo.additional_info}"

    Your response MUST be a raw JSON object with the following keys: "primaryTheme", "secondaryTheme", "uniqueAngle", "artistJourney", "moodAndGenre", "playlistKeywords".
    DO NOT include any other text, explanations, or markdown formatting. ONLY output the JSON.
  `

  const messages = [{ role: "user", content: synthesisPrompt }]
  const responseText = await callOpenRouter(messages, 500, 0.5, true) // Force JSON mode

  console.log("📊 Raw synthesis response:", responseText)

  const parsedJson = extractAndParseJson(responseText)

  if (parsedJson) {
    console.log("✅ Successfully parsed synthesis JSON:", parsedJson)
    return parsedJson
  } else {
    console.error("❌ Failed to parse synthesis JSON after all attempts. Raw response:", responseText)
    throw new Error("The AI failed to synthesize the song's story. Please try again.")
  }
}

// STEP 2: The Elite Copywriter - Writes the final description from synthesized info
async function writeFinalDescription(synthesis: any, previousAttempt?: { text: string; length: number }) {
  console.log("✍️ STEP 2: Writing final description with synthesis:", synthesis)

  let copywritingPrompt = `
    You are an elite copywriter for Spotify's editorial team. Using the following structured analysis from a music journalist, write a compelling, unique, and professional 490-500 character song description.

    CRITICAL RULES:
    - The description MUST be between 490-500 characters. This is non-negotiable.
    - Write in a sophisticated, engaging, and professional tone.
    - Do NOT use the raw data; only use the provided analysis to craft your narrative.

    Journalist's Analysis:
    - Primary Theme: "${synthesis.primaryTheme}"
    - Secondary Theme: "${synthesis.secondaryTheme}"
    - Unique Angle: "${synthesis.uniqueAngle}"
    - Artist's Journey: "${synthesis.artistJourney}"
    - Mood & Genre: "${synthesis.moodAndGenre}"
    - Playlist Keywords: "${synthesis.playlistKeywords}"

    Your task is to weave these elements into a seamless, powerful story.
  `

  if (previousAttempt) {
    copywritingPrompt += `\n\nIMPORTANT FEEDBACK: Your last attempt was ${previousAttempt.length} characters. This was the wrong length. You MUST write a description between 490-500 characters. Adjust your writing by elaborating more on the themes and artist's journey to meet the length requirement.`
  }

  const messages = [{ role: "user", content: copywritingPrompt }]
  const result = await callOpenRouter(messages, 250, 0.85)

  console.log("📝 Final description generated:", result)
  console.log("📏 Character count:", result.length)

  return result
}

// Main orchestrator function
export async function generateIntelligentDescription(
  rawInfo: any,
): Promise<{ success: boolean; description?: string; error?: string }> {
  try {
    console.log("🚀 Starting intelligent description generation...")
    console.log("📋 Input data:", rawInfo)

    console.log("Step 1: Synthesizing song information...")
    const synthesis = await synthesizeInfo(rawInfo)
    console.log("Synthesized Info:", synthesis)

    let finalDescription = ""
    let lastAttempt: { text: string; length: number } | undefined = undefined

    for (let i = 0; i < 3; i++) {
      console.log(`Step 2: Writing final description (Attempt ${i + 1})`)
      const description = await writeFinalDescription(synthesis, lastAttempt)
      console.log(`Attempt ${i + 1} result (${description.length} chars):`, description)

      if (description.length >= 490 && description.length <= 500) {
        finalDescription = description
        break
      } else {
        lastAttempt = { text: description, length: description.length }
        if (i === 2) {
          // If all retries fail, craft a final description manually from synthesis
          console.log("All retries failed. Crafting a robust fallback description.")
          finalDescription =
            `${synthesis.uniqueAngle}. The track explores themes of ${synthesis.primaryTheme} and ${synthesis.secondaryTheme}, set against a backdrop of ${synthesis.moodAndGenre}. This release marks a significant point in the artist's journey, reflecting on ${synthesis.artistJourney}. A perfect fit for playlists centered around ${synthesis.playlistKeywords}, this song offers a compelling and deeply resonant listening experience that showcases true artistic vision and masterful execution.`.substring(
              0,
              498,
            ) + "."
        }
      }
    }

    console.log("🎉 Final result:", { success: true, description: finalDescription })
    return { success: true, description: finalDescription }
  } catch (error) {
    console.error("💥 Error in generateIntelligentDescription:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, error: errorMessage }
  }
}
