"use server"

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

const API_KEY = process.env.OPENROUTER_API_KEY

// Helper for making API calls
async function callOpenRouter(messages: any[], max_tokens: number, temperature: number) {
  if (!API_KEY) {
    throw new Error("OpenRouter API key is not configured")
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      "HTTP-Referer": "https://soundfeed-tools.vercel.app/",
      "X-Title": "Soundfeed Tools",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-r1-0528:free",
      messages,
      max_tokens,
      temperature,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`API Error (${response.status}): ${errorText}`)
    throw new Error(`API request failed with status ${response.status}`)
  }

  const data = (await response.json()) as OpenRouterResponse
  return data.choices[0].message.content.trim()
}

// STEP 1: The Music Journalist - Interprets and synthesizes raw info
async function synthesizeInfo(rawInfo: any) {
  const synthesisPrompt = `
    You are a senior music journalist and A&R storyteller. Your task is to analyze the following raw data about a new song and extract the core narrative, key themes, and marketing angles. Do NOT write the final description. Instead, output a JSON object with the following keys: "primaryTheme", "secondaryTheme", "uniqueAngle", "artistJourney", "moodAndGenre", "playlistKeywords".

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

    Produce a JSON object based on your expert interpretation of this data.
  `

  const messages = [{ role: "user", content: synthesisPrompt }]
  const jsonString = await callOpenRouter(messages, 500, 0.5)

  try {
    // Find the JSON object within the response
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No JSON object found in synthesis response")
    }
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error("Failed to parse synthesis JSON:", error)
    throw new Error("The AI failed to synthesize the song's story. Please try again.")
  }
}

// STEP 2: The Elite Copywriter - Writes the final description from synthesized info
async function writeFinalDescription(synthesis: any, previousAttempt?: { text: string; length: number }) {
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
  return await callOpenRouter(messages, 250, 0.85)
}

// Main orchestrator function
export async function generateIntelligentDescription(
  rawInfo: any,
): Promise<{ success: boolean; description?: string; error?: string }> {
  try {
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

    return { success: true, description: finalDescription }
  } catch (error) {
    console.error("Error in generateIntelligentDescription:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, error: errorMessage }
  }
}
