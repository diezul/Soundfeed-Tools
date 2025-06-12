"use server"

interface OpenRouterResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

export async function callOpenRouter(prompt: string): Promise<string> {
  try {
    const apiKey =
      process.env.OPENROUTER_API_KEY || "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"

    if (!apiKey) {
      throw new Error("OpenRouter API key is not configured")
    }

    console.log("Calling OpenRouter API with prompt...")

    // Using the exact model ID from the user's example
    const model = "deepseek/deepseek-r1-0528:free"

    console.log(`Using model: ${model}`)

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
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenRouter API error:", errorText)
      throw new Error(`OpenRouter API error: ${errorText}`)
    }

    // First get the response as text
    const responseText = await response.text()

    // Log the raw response for debugging
    console.log("Raw API response:", responseText)

    // Try to parse the response as JSON
    let data: OpenRouterResponse
    try {
      data = JSON.parse(responseText)
    } catch (error) {
      console.error("Failed to parse JSON response:", error)
      throw new Error("Invalid JSON response from OpenRouter API")
    }

    // Validate the response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error("Unexpected response structure:", data)
      throw new Error("Unexpected response structure from OpenRouter API")
    }

    return data.choices[0].message.content
  } catch (error) {
    console.error("Error calling OpenRouter:", error)
    throw error
  }
}
