"use server"

import { callOpenRouter } from "./openrouter-client"

export async function generateDescription(
  songTitle: string,
  artistName: string,
  genre: string,
  mood: string,
  additionalInfo: string,
): Promise<{ success: boolean; description?: string; error?: string }> {
  try {
    if (!songTitle || !artistName) {
      return {
        success: false,
        error: "Song title and artist name are required",
      }
    }

    // Create a prompt for the AI
    const prompt = `
      Write a captivating song description for "${songTitle}" by ${artistName}.
      
      Genre: ${genre || "Not specified"}
      Mood: ${mood || "Not specified"}
      Additional information: ${additionalInfo || "None"}
      
      IMPORTANT: The description MUST be EXACTLY between 490-500 characters total. Not words, but characters.
      This is a strict requirement - the description must be complete and coherent within this limit.
      
      Do not include the title or artist name in the description.
      Focus on the song's sound, style, and emotional impact.
      Use vivid language that captures the essence of the music.
      Be concise but descriptive.
      
      Count your characters carefully and ensure the final description is between 490-500 characters.
      The description should have a proper ending with no cut-off sentences.
    `

    // Call the OpenRouter API
    const description = await callOpenRouter(prompt)

    // Ensure the description is within the character limit
    let finalDescription = description
    if (finalDescription.length > 500) {
      // Find the last sentence that fits within 500 characters
      const sentences = finalDescription.match(/[^.!?]+[.!?]+/g) || []
      finalDescription = ""
      for (const sentence of sentences) {
        if ((finalDescription + sentence).length <= 500) {
          finalDescription += sentence
        } else {
          break
        }
      }
    }

    return {
      success: true,
      description: finalDescription,
    }
  } catch (error) {
    console.error("Error generating song description:", error)
    return {
      success: false,
      error: `Failed to generate song description: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
