"use server"

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

const API_KEY = process.env.OPENROUTER_API_KEY

async function callOpenRouter(messages: any[], max_tokens: number, temperature: number) {
  if (!API_KEY) {
    throw new Error("OpenRouter API key is not configured")
  }

  const body = {
    model: "openrouter/cypher-alpha:free",
    messages,
    max_tokens,
    temperature,
  }

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

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`API Error (${response.status}): ${errorText}`)
    throw new Error(`API request failed with status ${response.status}`)
  }

  const data = (await response.json()) as OpenRouterResponse
  return data.choices[0].message.content.trim()
}

function buildPrompt(rawInfo: any) {
  const songTitle = rawInfo.song_title || rawInfo.release_title
  const artistName = rawInfo.artist_name
  const featuringText =
    rawInfo.has_featuring === "yes" && rawInfo.featuring_artists ? ` featuring ${rawInfo.featuring_artists}` : ""

  return `
    You are an expert music copywriter. Your task is to write a professional song description based ONLY on the information provided below, following the required structure precisely.

    **CRITICAL RULES:**
    1.  **DO NOT INVENT DETAILS.** Do not mention instruments unless they are explicitly listed in the "Additional Info".
    2.  **USE THE PROVIDED INFO:** You MUST incorporate the "Additional Info" if it exists.
    3.  **LENGTH:** The final description must be between 450 and 499 characters.
    4.  **ENDING:** The description MUST end with a complete sentence and proper punctuation. Do not end with incomplete phrases.

    **SONG INFORMATION TO USE:**
    -   **Artist:** ${artistName}${featuringText}
    -   **Song Title:** "${songTitle}"
    -   **From the Release:** "${rawInfo.release_title}" (${rawInfo.release_type})
    -   **Genre:** ${rawInfo.genre}
    -   **Mood:** ${rawInfo.mood}
    -   **Inspiration/Theme:** ${rawInfo.inspiration}
    -   **Artist's Background:** ${rawInfo.previous_releases_details || "An emerging talent in the music scene."}
    -   **Additional Info (Highlight this!):** ${rawInfo.additional_info || "No specific production details provided."}

    **REQUIRED STRUCTURE & CONTENT FLOW:**
    1.  **Introduction:** Start with the artist, the song "${songTitle}", and its context within the "${rawInfo.release_title}" ${rawInfo.release_type}. If it's a Single, you dont have to bother about the Release Title abd Release Type anymore.
    2.  **Core Description:** Weave together the song's genre (${rawInfo.genre}), mood (${rawInfo.mood}), and the inspiration behind it (${rawInfo.inspiration}).
    3.  **Unique Elements:** Highlight key production details or unique aspects from the "Additional Info" section.
    4.  **Artist Context:** Mention the artist's background or past achievements if they were provided.
    5.  **Playlist Fit:** Explicitly state the ideal playlist fit. For example: "Perfect for [Mood] playlists or [Activity] listening sessions." Base this on all the info provided.
    6.  **Conclusion:** End with a strong, conclusive statement about the song's impact or who the ideal listener is.
   
    **BEST PRACTICES:**
    1. Keep it under 500 characters. Aim for ~80–90 words.
    2. Use active, vivid language. Focus on emotional impact.
    3. Be concise. Every adjective and verb should add value.
    4. Edit and count. Run a character-counter and trim redundancies.
    5. Balance specificity and breadth. Combine general genres with unique details.
  `
}

function ensureProperEnding(text: string): string {
  let cleanedText = text.trim()

  // More aggressive removal of dangling phrases
  const problematicEndings = [
    /Perfect for\.?$/i,
    /Ideal for\.?$/i,
    /Great for\.?$/i,
    /Suitable for\.?$/i,
    /A perfect addition to\.?$/i,
    /Essential for\.?$/i,
    /Perfect addition to\.?$/i,
    /Available on\.?$/i,
    /Stream on\.?$/i,
    /Listen on\.?$/i,
    /and\.?$/i,
    /with\.?$/i,
    /the\.?$/i,
  ]

  for (const pattern of problematicEndings) {
    cleanedText = cleanedText.replace(pattern, "").trim()
  }

  // Trim to max length before adding punctuation
  if (cleanedText.length > 499) {
    const trimmed = cleanedText.substring(0, 498)
    const lastSpace = trimmed.lastIndexOf(" ")
    if (lastSpace > 0) {
      cleanedText = trimmed.substring(0, lastSpace).trim()
    } else {
      cleanedText = trimmed.trim()
    }
  }

  // Ensure it ends with proper punctuation
  if (!cleanedText.endsWith(".") && !cleanedText.endsWith("!") && !cleanedText.endsWith("?")) {
    cleanedText += "."
  }

  return cleanedText
}

export async function generateIntelligentDescription(
  rawInfo: any,
): Promise<{ success: boolean; description?: string; error?: string }> {
  try {
    console.log("🚀 Starting simplified description generation...")
    console.log("📋 Input data:", rawInfo)

    const prompt = buildPrompt(rawInfo)
    const messages = [{ role: "user", content: prompt }]

    let finalDescription = ""

    for (let i = 0; i < 3; i++) {
      console.log(`✍️ Writing description (Attempt ${i + 1})`)
      const description = await callOpenRouter(messages, 350, 0.8)
      const processedDescription = ensureProperEnding(description)

      console.log(`Attempt ${i + 1} result (${processedDescription.length} chars):`, processedDescription)

      if (processedDescription.length >= 450 && processedDescription.length <= 499) {
        finalDescription = processedDescription
        break
      }

      if (i === 2) {
        console.log("All retries failed. Using the last valid-length attempt or crafting a final fallback.")
        finalDescription = processedDescription // Use the last attempt even if length is off, it's better than nothing
        if (finalDescription.length < 450) {
          finalDescription +=
            " This track showcases a unique artistic vision and is a must-listen for fans of the genre."
          finalDescription = ensureProperEnding(finalDescription)
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
