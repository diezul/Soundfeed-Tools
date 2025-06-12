"use server"

// Simple function to test if the API key is valid
export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
    return response.ok
  } catch (error) {
    console.error("Error testing API key:", error)
    return false
  }
}

// Main OpenRouter client function - keeping the original name for compatibility
export async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error("API key is missing")
  }

  // Test if the API key is valid
  const isValid = await testApiKey(apiKey)
  if (!isValid) {
    throw new Error("Invalid API key")
  }

  // Make the actual request
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://soundfeed.tools",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-r1-0528:free",
      messages: [{ role: "user", content: prompt }],
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API error: ${response.status} ${text}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}
