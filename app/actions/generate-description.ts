"use server"

import { generateWithOpenRouter } from "./openrouter-client"

export async function generateDescription(
  title: string,
  artist: string,
  genre: string,
  mood: string,
  info: string,
): Promise<{ success: boolean; description?: string; error?: string }> {
  try {
    const prompt = `
Write a captivating song description for "${title}" by ${artist}.

IMPORTANT: The description MUST be EXACTLY between 490-500 characters total.

Details:
- Genre: ${genre || "Not specified"}
- Mood: ${mood || "Not specified"}
- Additional information: ${info || "None provided"}

The description should be engaging, professional, and highlight the unique aspects of the song.
Count your characters carefully and ensure the description has a proper ending with no cut-off sentences.
`.trim()

    const description = await generateWithOpenRouter(prompt)

    // Ensure the description is within the character limit
    if (description.length > 500) {
      const trimmed = description.substring(0, 500)
      return { success: true, description: trimmed }
    }

    return { success: true, description }
  } catch (error) {
    console.error("Error generating description:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
