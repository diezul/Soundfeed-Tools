"use server"

interface OpenRouterResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    message: {
      role: string
      content: string
    }
    index: number
    finish_reason: string
  }[]
}

export async function callOpenRouter(
  prompt: string,
  model = "deepseek/deepseek-r1-0528:free",
  clientApiKey?: string,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Use environment variable API key
    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      return {
        success: false,
        error: "OpenRouter API key is not configured in environment variables",
      }
    }

    console.log(`Making request to OpenRouter API using model: ${model}`)

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://soundfeed.tools",
        "X-Title": "Soundfeed Tools",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    })

    console.log(`OpenRouter API response status: ${response.status} ${response.statusText}`)

    // Get the response as text first
    const responseText = await response.text()

    // Check if we got a valid response
    if (!responseText || !responseText.trim()) {
      return {
        success: false,
        error: "Received empty response from API",
      }
    }

    // Try to parse the JSON
    let responseData: OpenRouterResponse
    try {
      responseData = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError)
      return {
        success: false,
        error: `Failed to parse API response: ${responseText.substring(0, 100)}...`,
      }
    }

    // Validate the response structure
    if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
      return {
        success: false,
        error: "Received an unexpected response format from the API.",
      }
    }

    return {
      success: true,
      data: responseData,
    }
  } catch (error) {
    console.error("Error calling OpenRouter API:", error)
    return {
      success: false,
      error: `API request failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
