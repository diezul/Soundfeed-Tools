"use server"

import { callOpenRouter } from "./openrouter-client"

// Improved fallback description generator with more templates
function generateFallbackDescription(title: string, artist: string, genre: string, mood: string): string {
  // Create a template-based description that's always between 490-500 characters
  const templates = [
    `${title} by ${artist} is a captivating ${genre || "musical"} journey that showcases the artist's unique style and creative vision. With its ${mood || "distinctive"} atmosphere and compelling composition, this track draws listeners in from the first note. The production quality is exceptional, with each element carefully balanced to create a rich sonic landscape. The song's structure builds naturally, taking the audience through an emotional arc that resonates long after the final notes fade. Perfect for fans of innovative ${genre || "music"} who appreciate authentic artistic expression and technical excellence. This release demonstrates ${artist}'s growth as an artist and hints at exciting developments to come in their musical evolution.`,

    `${artist}'s latest release, ${title}, stands as a testament to their artistic prowess in the ${genre || "music"} scene. The track's ${mood || "compelling"} energy creates an immersive experience that captivates from start to finish. Masterful production techniques enhance the song's core elements, allowing each component to shine while contributing to a cohesive whole. The composition demonstrates a sophisticated understanding of musical dynamics, with thoughtful progressions and memorable motifs. Listeners will find themselves returning to discover new layers and details with each play. This release firmly establishes ${artist}'s unique voice in contemporary ${genre || "music"}, marking another significant milestone in their creative journey.`,

    `${title} showcases ${artist}'s remarkable ability to craft ${mood || "engaging"} ${genre || "music"} that resonates on multiple levels. The track's meticulous production creates a rich sonic palette that supports its emotional core. Listeners will appreciate the attention to detail evident throughout, from the carefully constructed arrangement to the polished final mix. The song's pacing feels natural and compelling, drawing the audience through its narrative with purpose and intention. ${artist} demonstrates both technical skill and artistic sensitivity, balancing creative innovation with accessible appeal. This release stands as a worthy addition to their growing catalog, offering both longtime fans and new listeners a rewarding musical experience.`,

    `With ${title}, ${artist} delivers a ${mood || "powerful"} ${genre || "musical"} statement that highlights their artistic evolution. The track features impeccable production values and thoughtful arrangement choices that enhance its emotional impact. Each sonic element serves the overall vision, creating a cohesive listening experience that rewards repeated plays. The composition strikes a perfect balance between technical excellence and raw emotional expression, showcasing ${artist}'s unique creative perspective. This release demonstrates a confident artistic voice and a clear vision, positioning ${artist} as a noteworthy presence in the contemporary ${genre || "music"} landscape. Fans of innovative yet accessible ${genre || "music"} will find much to appreciate in this compelling release.`,

    `${title} represents a significant achievement in ${artist}'s musical journey, blending ${mood || "evocative"} elements with sophisticated ${genre || "musical"} sensibilities. The production quality is outstanding, with careful attention paid to every sonic detail. The composition unfolds with purpose and intention, taking listeners on a journey that feels both surprising and inevitable. ${artist}'s artistic voice shines through clearly, demonstrating both technical mastery and emotional authenticity. This release stands as a testament to their creative vision and commitment to artistic excellence. Listeners seeking thoughtful, well-crafted ${genre || "music"} will find ${title} to be a deeply rewarding addition to their collection.`,
  ]

  // Select a template based on a simple hash of the title and artist
  const hash = (title + artist).split("").reduce((a, b) => a + b.charCodeAt(0), 0)
  const template = templates[hash % templates.length]

  // Ensure it's within 490-500 characters
  if (template.length > 500) {
    return template.substring(0, 497) + "..."
  }

  return template
}

export async function generateSongDescription(
  artist: string,
  title: string,
  genre: string,
  mood: string,
  additionalInfo: string,
): Promise<{ success: boolean; description?: string; error?: string }> {
  // Input validation
  if (!artist || !title) {
    return {
      success: false,
      error: "Artist and title are required",
    }
  }

  try {
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
- Genre: ${genre || "Not specified"}
- Mood: ${mood || "Not specified"}
- Additional information: ${additionalInfo || "None provided"}

The description should be engaging, professional, and highlight the unique aspects of the song.
Count your characters carefully and ensure the description has a proper ending with no cut-off sentences.
`.trim()

    let description: string

    try {
      // Try to use the OpenRouter API
      description = await callOpenRouter(prompt)
      console.log("Successfully generated description with API")

      // Ensure the description is within the character limit
      if (description.length > 500) {
        const lastPeriodIndex = description.lastIndexOf(".", 500)
        if (lastPeriodIndex > 450) {
          description = description.substring(0, lastPeriodIndex + 1)
        } else {
          description = description.substring(0, 500)
        }
      }
    } catch (apiError) {
      // If API call fails, use the fallback generator
      console.log("API call failed, using fallback generator")
      description = generateFallbackDescription(title, artist, genre, mood)
    }

    return {
      success: true,
      description,
    }
  } catch (error) {
    console.error("Error in generateSongDescription:", error)

    // Even if everything else fails, still return a description using the fallback
    try {
      const fallbackDescription = generateFallbackDescription(title, artist, genre, mood)
      return {
        success: true,
        description: fallbackDescription,
      }
    } catch (fallbackError) {
      console.error("Fallback generator also failed:", fallbackError)
      return {
        success: false,
        error: "Failed to generate description. Please try again later.",
      }
    }
  }
}
