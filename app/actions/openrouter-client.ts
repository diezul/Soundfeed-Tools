"use server"

interface OpenRouterResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

// This function will now throw a specific error type that we can catch
export async function callOpenRouter(prompt: string): Promise<string> {
  try {
    // Get API key from environment
    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      console.error("API key is missing from environment variables")
      throw new Error("API_KEY_MISSING")
    }

    console.log("Making API request to OpenRouter...")

    // Make the API request with minimal headers
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-0528:free",
        messages: [{ role: "user", content: prompt }],
      }),
    })

    // Check for errors
    if (!response.ok) {
      console.error(`OpenRouter API Error: Status ${response.status}`)
      throw new Error("API_REQUEST_FAILED")
    }

    // Parse the response
    const data = (await response.json()) as OpenRouterResponse

    // Validate the response
    if (!data.choices?.[0]?.message?.content) {
      console.error("Invalid response format from OpenRouter API")
      throw new Error("API_RESPONSE_INVALID")
    }

    return data.choices[0].message.content
  } catch (error) {
    console.error("Error in callOpenRouter:", error)
    // Always throw a consistent error to make catching easier
    throw new Error("API_CALL_FAILED")
  }
}
