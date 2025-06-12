"use server"

import { callOpenRouter } from "./openrouter-client"

export async function generateSongDescription(
  songTitle: string,
  artistName: string,
  genre: string,
  mood: string,
  additionalInfo: string,
): Promise<string> {
  try {
    // Create a prompt that explicitly asks for a description of exactly 490-500 characters
    const prompt = `
      Write a captivating and professional description for the song "${songTitle}" by ${artistName}.
      
      Genre: ${genre}
      Mood: ${mood}
      Additional information: ${additionalInfo}
      
      IMPORTANT: The description MUST be EXACTLY between 490-500 characters total. Not words, but characters.
      This is a strict requirement - the description must be complete and coherent within this limit.
      
      The description should:
      - Be engaging and professional
      - Highlight the song's unique qualities
      - Mention the artist's name and song title naturally
      - Reflect the genre and mood provided
      - Include any relevant details from the additional information
      - Have a proper ending with no cut-off sentences
      - Be EXACTLY 490-500 characters in length (count carefully)
      
      DO NOT exceed 500 characters or write less than 490 characters. Count spaces, punctuation, and all characters.
      DO NOT include a character count in your response.
      DO NOT include any disclaimers, notes, or anything other than the description itself.
    `

    // Call the OpenRouter API
    const description = await callOpenRouter(prompt)

    // Ensure the description is within our character limit
    if (description.length > 500) {
      // Find the last sentence that fits within 500 characters
      const truncated = findLastCompleteSentence(description.substring(0, 500))
      return truncated
    }

    return description
  } catch (error) {
    console.error("Error generating song description:", error)
    throw new Error(`Failed to generate song description: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Helper function to find the last complete sentence within a text
function findLastCompleteSentence(text: string): string {
  // Look for the last period, question mark, or exclamation mark followed by a space or end of string
  const match = text.match(/^(.*?[.!?])(?:\s|$)/)
  if (match) {
    return match[1]
  }
  return text // If no sentence ending is found, return the original text
}
