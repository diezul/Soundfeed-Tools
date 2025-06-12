"use server"

import { callOpenRouter } from "./openrouter-client"

export async function generateSongDescription(
  artist: string,
  title: string,
  genre: string,
  mood: string,
  additionalInfo: string,
): Promise<string> {
  try {
    console.log("Generating song description for:", { artist, title, genre, mood, additionalInfo })

    // Create a prompt that explicitly asks for a description of exactly 490-500 characters
    const prompt = `
Write a captivating song description for "${title}" by ${artist}.

IMPORTANT INSTRUCTIONS:
- The description MUST be EXACTLY between 490-500 characters total (not words, but characters).
- This is a strict requirement - the description must be complete and coherent within this limit.
- Do NOT exceed 500 characters.
- Do NOT include a character count in your response.
- Do NOT include any disclaimers, notes, or explanations.
- Just provide the description text directly.

Details about the song:
- Genre: ${genre}
- Mood: ${mood}
- Additional information: ${additionalInfo || "None provided"}

The description should be engaging, professional, and highlight the unique aspects of the song.
Count your characters carefully and ensure the description has a proper ending with no cut-off sentences.
`.trim()

    const description = await callOpenRouter(prompt)

    // Ensure the description is within the character limit
    if (description.length > 500) {
      console.log(`Description too long (${description.length} chars), trimming...`)

      // Find the last period before 500 characters to avoid cutting mid-sentence
      const lastPeriodIndex = description.lastIndexOf(".", 500)
      if (lastPeriodIndex > 450) {
        return description.substring(0, lastPeriodIndex + 1)
      }

      // If no good period found, just trim to 500
      return description.substring(0, 500)
    }

    return description
  } catch (error) {
    console.error("Error generating song description:", error)
    throw new Error(`Failed to generate song description: ${error instanceof Error ? error.message : String(error)}`)
  }
}
