"use server"

import { callOpenRouter } from "./openrouter-client"

interface DescriptionRequest {
  songTitle: string
  artistInfo: string
  promotionInfo: string
  genre: string
  mood: string
  additionalInfo: string
  apiKey?: string
}

export async function generateSongDescription(requestData: DescriptionRequest): Promise<{
  success: boolean
  description?: string
  error?: string
}> {
  try {
    const data = requestData

    // Construct a more specific prompt that emphasizes the character limit
    const prompt = `
      Write a compelling song description for distribution platforms like Spotify and Apple Music.
      
      IMPORTANT: The description MUST be EXACTLY between 490-500 characters total. Not words, but characters.
      This is a strict requirement - the description must be complete and coherent within this limit.
      
      Details about the song:
      - Title: ${data.songTitle}
      - Artist Information: ${data.artistInfo}
      - Promotion Information: ${data.promotionInfo}
      - Genre: ${data.genre}
      - Mood: ${data.mood}
      - Additional Information: ${data.additionalInfo}
      
      Guidelines:
      - Create a captivating description that highlights the song's unique qualities
      - Ensure the description is engaging and entices listeners
      - Do NOT use hashtags or emojis
      - Make sure the description has a proper ending (no cut-off sentences)
      - Count the characters carefully to ensure it's between 490-500 characters
      - Only return the description text without any additional commentary
      
      Remember: The EXACT character count must be between 490-500 characters, including spaces and punctuation.
    `

    // Call the OpenRouter API using our client
    const result = await callOpenRouter(prompt, "deepseek/deepseek-r1-0528:free", data.apiKey)

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to generate description",
      }
    }

    const responseData = result.data
    let description = responseData.choices[0].message.content.trim()

    // Check if the description is within our target range
    if (description.length < 490) {
      return {
        success: false,
        error: `The generated description is too short (${description.length} characters). Please try again.`,
      }
    }

    // If it's too long, trim it properly to 497 characters and add "..."
    if (description.length > 500) {
      // Find the last complete sentence that fits within our limit
      const sentences = description.match(/[^.!?]+[.!?]+/g) || []
      let trimmedDescription = ""

      for (const sentence of sentences) {
        if ((trimmedDescription + sentence).length <= 497) {
          trimmedDescription += sentence
        } else {
          break
        }
      }

      // If we couldn't find a good sentence break, just trim at 497
      if (trimmedDescription.length === 0 || trimmedDescription.length < 400) {
        description = description.substring(0, 497) + "..."
      } else {
        description = trimmedDescription.trim()
      }
    }

    return {
      success: true,
      description,
    }
  } catch (error) {
    console.error("Error generating song description:", error)
    return {
      success: false,
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
