"use server"

interface SocialArtistResult {
  id: string
  name: string
  searchUrl: string
  directUrl?: string
  relevanceScore?: number
}

interface SocialSearchResult {
  success: boolean
  data?: SocialArtistResult[]
  error?: string
}

// Format artist name for URL (replace spaces with appropriate characters)
function formatNameForUrl(name: string): string {
  return encodeURIComponent(name.trim())
}

// Generate Instagram search results
export async function searchInstagramArtists(query: string): Promise<SocialSearchResult> {
  if (!query.trim()) {
    return {
      success: false,
      error: "Please enter an artist name",
    }
  }

  try {
    const formattedName = formatNameForUrl(query)

    // Create a direct URL to Instagram profile if the name has no spaces
    // This is a best guess and may not be accurate
    const directUrl =
      query.indexOf(" ") === -1 ? `https://www.instagram.com/${query.toLowerCase().replace(/[^\w]/g, "")}/` : undefined

    // Create a search URL
    const searchUrl = `https://www.instagram.com/explore/search/keyword/?q=${formattedName}`

    const result: SocialArtistResult = {
      id: `instagram-${query}`,
      name: query,
      searchUrl,
      directUrl,
      relevanceScore: 1, // Always high since it's a direct name match
    }

    return {
      success: true,
      data: [result],
    }
  } catch (error) {
    console.error("Error creating Instagram search:", error)
    return {
      success: false,
      error: "Failed to create Instagram search. Please try again.",
    }
  }
}

// Generate Facebook search results
export async function searchFacebookArtists(query: string): Promise<SocialSearchResult> {
  if (!query.trim()) {
    return {
      success: false,
      error: "Please enter an artist name",
    }
  }

  try {
    const formattedName = formatNameForUrl(query)

    // Create search URLs for different Facebook search types
    const pagesSearchUrl = `https://www.facebook.com/search/pages?q=${formattedName}`
    const peopleSearchUrl = `https://www.facebook.com/search/people?q=${formattedName}`

    const results: SocialArtistResult[] = [
      {
        id: `facebook-pages-${query}`,
        name: `${query} (Pages)`,
        searchUrl: pagesSearchUrl,
        relevanceScore: 1,
      },
      {
        id: `facebook-people-${query}`,
        name: `${query} (People)`,
        searchUrl: peopleSearchUrl,
        relevanceScore: 0.8,
      },
    ]

    return {
      success: true,
      data: results,
    }
  } catch (error) {
    console.error("Error creating Facebook search:", error)
    return {
      success: false,
      error: "Failed to create Facebook search. Please try again.",
    }
  }
}
