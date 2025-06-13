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
export async function generateAIResponse(messages: Array<{ role: string; content: string }>, maxRetries = 3) {
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
          max_tokens: 300, // Limit token count to avoid overly long responses
          temperature: 0.7, // Slightly creative but still focused
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API Error (${response.status}): ${errorText}`)

        // If we've reached max retries, throw the error
        if (retries >= maxRetries) {
          throw new Error(`API request failed with status ${response.status}`)
        }

        // Otherwise, increment retries and try again
        retries++
        continue
      }

      const data = (await response.json()) as OpenRouterResponse
      let description = data.choices[0].message.content.trim()

      // Check if the description is empty or too short
      if (!description || description.length < 50) {
        console.log(`Received empty or too short description (${description.length} chars), retrying...`)

        // If we've reached max retries, use fallback
        if (retries >= maxRetries) {
          return generateFallbackDescription(messages)
        }

        // Otherwise, increment retries and try again
        retries++
        continue
      }

      // Process the description to ensure it's within character limits
      if (description.length > 500) {
        // Find the last sentence that ends before 480 characters
        const sentences = description.match(/[^.!?]+[.!?]+/g) || []
        let processedDesc = ""

        for (const sentence of sentences) {
          if ((processedDesc + sentence).length <= 480) {
            processedDesc += sentence
          } else {
            break
          }
        }

        // If we couldn't get at least 400 characters with complete sentences,
        // just trim at 480 and add a proper ending
        if (processedDesc.length < 400) {
          processedDesc = description.substring(0, 480)
          // Make sure it doesn't end abruptly
          if (!processedDesc.endsWith(".") && !processedDesc.endsWith("!") && !processedDesc.endsWith("?")) {
            processedDesc += "."
          }
        }

        description = processedDesc.trim()
      }

      // If it's too short but not empty, we'll just return what we have
      return description
    } catch (error) {
      console.error(`Error generating AI response (attempt ${retries + 1}):`, error)

      // If we've reached max retries, use fallback
      if (retries >= maxRetries) {
        return generateFallbackDescription(messages)
      }

      // Otherwise, increment retries and try again
      retries++
    }
  }

  // This should never be reached due to the fallback, but just in case
  return generateFallbackDescription(messages)
}

/**
 * Generate a fallback description when the API fails
 */
function generateFallbackDescription(messages: Array<{ role: string; content: string }>): string {
  // Extract song info from the messages
  const userMessage = messages.find((m) => m.role === "user")?.content || ""

  // Extract song title and artist
  const titleMatch = userMessage.match(/Write a professional song description for "(.*?)" by (.*?)\./) || []
  const songTitle = titleMatch[1] || "this song"
  const artistName = titleMatch[2] || "the artist"

  // Extract genre and mood
  const genreMatch = userMessage.match(/Genre: (.*?)(?:\r|\n|$)/) || []
  const genre = genreMatch[1] !== "Not specified" ? genreMatch[1] : ""

  const moodMatch = userMessage.match(/Mood: (.*?)(?:\r|\n|$)/) || []
  const mood = moodMatch[1] !== "Not specified" ? moodMatch[1] : ""

  // Create a template-based description
  let description = `"${songTitle}" by ${artistName} `

  if (genre) {
    description += `delivers a captivating ${genre} experience `
  } else {
    description += `showcases impressive musical craftsmanship `
  }

  if (mood) {
    description += `with a ${mood} atmosphere that resonates with listeners. `
  } else {
    description += `that connects deeply with its audience. `
  }

  description += `The track demonstrates ${artistName}'s signature style through its polished production and authentic expression. `
  description += `With memorable melodies and engaging rhythms, "${songTitle}" stands as a testament to ${artistName}'s artistic vision and creative talents.`

  // Ensure the description is within character limits
  if (description.length > 500) {
    description = description.substring(0, 497) + "..."
  }

  return description
}
