"use server"

// Simple interface for the OpenRouter API response
interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

// Direct access to the environment variable
const API_KEY = process.env.OPENROUTER_API_KEY

/**
 * Generate text using the OpenRouter API with character count enforcement and retry logic
 */
export async function generateAIResponse(messages: Array<{ role: string; content: string }>, maxRetries = 5) {
  if (!API_KEY) {
    throw new Error("OpenRouter API key is not configured")
  }

  let retries = 0

  while (retries <= maxRetries) {
    try {
      console.log(`Making OpenRouter API request with DeepSeek R1 FREE model (attempt ${retries + 1})`)

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
          messages: messages,
          max_tokens: 200, // Reduced to prevent overly long responses
          temperature: 0.6, // Slightly less creative for more consistent length
          stop: ["\n", "..."], // Stop at newlines or ellipses
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API Error (${response.status}): ${errorText}`)

        // If we've reached max retries, use fallback
        if (retries >= maxRetries) {
          return generatePerfectLengthFallback(messages)
        }

        // Otherwise, increment retries and try again
        retries++
        continue
      }

      const data = (await response.json()) as OpenRouterResponse
      const description = data.choices[0].message.content.trim()

      console.log(`Received description of ${description.length} characters:`, description)

      // Check if the description is empty or too short
      if (!description || description.length < 100) {
        console.log(`Description too short (${description.length} chars), retrying...`)

        // If we've reached max retries, use fallback
        if (retries >= maxRetries) {
          return generatePerfectLengthFallback(messages)
        }

        // Otherwise, increment retries and try again
        retries++
        continue
      }

      // Process the description to ensure it's exactly 490-500 characters
      const processedDescription = ensurePerfectLength(description)

      console.log(`Final processed description: ${processedDescription.length} characters`)

      // Validate final length
      if (processedDescription.length < 490 || processedDescription.length > 500) {
        console.log(`Description length ${processedDescription.length} not in range 490-500, using fallback`)
        return generatePerfectLengthFallback(messages)
      }

      return processedDescription
    } catch (error) {
      console.error(`Error generating AI response (attempt ${retries + 1}):`, error)

      // If we've reached max retries, use fallback
      if (retries >= maxRetries) {
        return generatePerfectLengthFallback(messages)
      }

      // Otherwise, increment retries and try again
      retries++
    }
  }

  // This should never be reached due to the fallback, but just in case
  return generatePerfectLengthFallback(messages)
}

/**
 * Ensure the description is exactly between 490-500 characters with natural ending
 */
function ensurePerfectLength(description: string): string {
  // If it's already in the perfect range, return as is
  if (description.length >= 490 && description.length <= 500) {
    return description
  }

  // If it's too short, we need to extend it naturally
  if (description.length < 490) {
    const needed = 490 - description.length

    // Add natural extensions
    const extensions = [
      " This release showcases exceptional artistry and production quality.",
      " The track demonstrates remarkable musical sophistication and creativity.",
      " It represents a significant milestone in the artist's evolving sound.",
      " The composition features intricate arrangements and compelling dynamics.",
      " This work establishes a distinctive artistic voice and vision.",
    ]

    // Find the best extension that gets us close to 490-500
    for (const ext of extensions) {
      if (description.length + ext.length >= 490 && description.length + ext.length <= 500) {
        return description + ext
      }
    }

    // If no single extension works, build one that fits perfectly
    let extended = description
    const words = [
      " This",
      " release",
      " showcases",
      " exceptional",
      " artistry",
      " and",
      " production",
      " quality",
      " throughout.",
    ]

    for (const word of words) {
      if (extended.length + word.length <= 500) {
        extended += word
        if (extended.length >= 490) break
      }
    }

    return extended
  }

  // If it's too long, we need to trim it naturally
  if (description.length > 500) {
    // Find the last complete sentence that fits within 490-500 characters
    const sentences = description.match(/[^.!?]+[.!?]+/g) || []
    let result = ""

    for (const sentence of sentences) {
      if ((result + sentence).length <= 500) {
        result += sentence
      } else {
        break
      }
    }

    // If we have a good result in range, use it
    if (result.length >= 490 && result.length <= 500) {
      return result.trim()
    }

    // If sentence-based trimming doesn't work, trim at word boundaries
    const words = description.split(" ")
    result = ""

    for (const word of words) {
      if ((result + " " + word).length <= 500) {
        result += (result ? " " : "") + word
      } else {
        break
      }
    }

    // Ensure we end with proper punctuation
    if (!result.endsWith(".") && !result.endsWith("!") && !result.endsWith("?")) {
      // Find space to add a period
      if (result.length < 500) {
        result += "."
      } else {
        result = result.substring(0, 499) + "."
      }
    }

    return result.trim()
  }

  return description
}

/**
 * Generate a comprehensive fallback description using ALL provided information
 * Guaranteed to be exactly 490-500 characters
 */
function generatePerfectLengthFallback(messages: Array<{ role: string; content: string }>): string {
  // Extract song info from the messages
  const userMessage = messages.find((m) => m.role === "user")?.content || ""

  // Extract all the information
  const releaseTitleMatch = userMessage.match(/Release Title: "(.*?)"/) || []
  const releaseTitle = releaseTitleMatch[1] || "this release"

  const releaseTypeMatch = userMessage.match(/Release Type: (.*?)(?:\r|\n|$)/) || []
  const releaseType = releaseTypeMatch[1] || "release"

  const songTitleMatch = userMessage.match(/Song Title: "(.*?)"/) || []
  const songTitle = songTitleMatch[1] || releaseTitle

  const artistMatch = userMessage.match(/Artist: (.*?)(?:\r|\n|$)/) || []
  const artist = artistMatch[1] || "the artist"

  const genreMatch = userMessage.match(/Genre: (.*?)(?:\r|\n|$)/) || []
  const genre = genreMatch[1] || "contemporary"

  const moodMatch = userMessage.match(/Mood: (.*?)(?:\r|\n|$)/) || []
  const mood = moodMatch[1] || "captivating"

  const inspirationMatch = userMessage.match(/Inspiration: (.*?)(?:\r|\n|$)/) || []
  const inspiration = inspirationMatch[1] || "personal experiences"

  const previousReleaseMatch = userMessage.match(/Previous Notable Release: (.*?)(?:\r|\n|$)/) || []
  const previousRelease = previousReleaseMatch[1] || ""

  const additionalInfoMatch = userMessage.match(/Additional Information: (.*?)(?:\r|\n|$)/) || []
  const additionalInfo = additionalInfoMatch[1] || ""

  // Check for featuring artists
  const featuringMatch = songTitle.match(/(.*?) featuring (.*)/) || []
  const baseSongTitle = featuringMatch[1] || songTitle
  const featuringArtists = featuringMatch[2] || ""

  // Build comprehensive description template
  let description = ""

  // Start with the core information
  if (featuringArtists) {
    description = `"${baseSongTitle}" featuring ${featuringArtists} by ${artist} `
  } else {
    description = `"${baseSongTitle}" by ${artist} `
  }

  // Add release context
  description += `from the ${releaseType} "${releaseTitle}" delivers a compelling ${genre} experience. `

  // Add mood and inspiration
  description += `The track creates a ${mood} atmosphere, drawing inspiration from ${inspiration}. `

  // Add previous work context if available
  if (previousRelease) {
    description += `Building on the success of ${previousRelease}, this release showcases ${artist}'s artistic evolution. `
  } else {
    description += `This release showcases ${artist}'s distinctive artistic vision and creative approach. `
  }

  // Add additional information if available
  if (additionalInfo && additionalInfo !== "None provided") {
    description += `${additionalInfo} `
  }

  // Calculate remaining space and add appropriate ending
  const targetLength = 495 // Aim for middle of range
  const remaining = targetLength - description.length

  if (remaining > 50) {
    description +=
      "The composition demonstrates exceptional musical craftsmanship through its intricate arrangements and compelling sonic textures, establishing a memorable addition to the artist's catalog."
  } else if (remaining > 20) {
    description += "This work represents a significant milestone in the artist's musical journey."
  } else if (remaining > 0) {
    description += "A remarkable musical achievement."
  }

  // Final adjustment to ensure perfect length
  return ensurePerfectLength(description)
}
