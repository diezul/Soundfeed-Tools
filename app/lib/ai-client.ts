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
 * Generate text using the OpenRouter API
 */
export async function generateAIResponse(messages: Array<{ role: string; content: string }>) {
  if (!API_KEY) {
    throw new Error("OpenRouter API key is not configured")
  }

  try {
    // Log that we're making a request and that we have an API key (without revealing it)
    console.log("Making OpenRouter API request with configured API key")

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
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API Error (${response.status}): ${errorText}`)
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = (await response.json()) as OpenRouterResponse
    return data.choices[0].message.content
  } catch (error) {
    console.error("Error generating AI response:", error)
    throw error
  }
}
