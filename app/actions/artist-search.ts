"use server"

import { getSpotifyToken } from "../actions"

interface ArtistResult {
  id: string
  name: string
  imageUrl: string
  profileUrl: string
  followers?: number
  popularity?: number
  relevanceScore?: number
  popularTracks?: {
    name: string
    id: string
  }[]
}

interface SearchResult {
  success: boolean
  data?: ArtistResult[]
  error?: string
  total?: number
}

// Calculate string similarity (Levenshtein distance)
function calculateSimilarity(a: string, b: string): number {
  const aLower = a.toLowerCase()
  const bLower = b.toLowerCase()

  // Exact match gets highest score
  if (aLower === bLower) return 1

  // Check if one string contains the other
  if (aLower.includes(bLower) || bLower.includes(aLower)) {
    return 0.8
  }

  // Check if one string starts with the other
  if (aLower.startsWith(bLower) || bLower.startsWith(aLower)) {
    return 0.7
  }

  // Calculate Levenshtein distance
  const track = Array(bLower.length + 1)
    .fill(null)
    .map(() => Array(aLower.length + 1).fill(null))

  for (let i = 0; i <= aLower.length; i += 1) {
    track[0][i] = i
  }

  for (let j = 0; j <= bLower.length; j += 1) {
    track[j][0] = j
  }

  for (let j = 1; j <= bLower.length; j += 1) {
    for (let i = 1; i <= aLower.length; i += 1) {
      const indicator = aLower[i - 1] === bLower[j - 1] ? 0 : 1
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      )
    }
  }

  // Convert distance to similarity score (0 to 1)
  const maxLength = Math.max(aLower.length, bLower.length)
  const distance = track[bLower.length][aLower.length]
  return 1 - distance / maxLength
}

// Search for artists on Spotify with improved relevance
export async function searchSpotifyArtists(query: string, limit = 20): Promise<SearchResult> {
  if (!query.trim()) {
    return {
      success: false,
      error: "Please enter an artist name",
    }
  }

  try {
    const token = await getSpotifyToken()

    // Use a more specific search query to improve results
    // The 'artist:' prefix tells Spotify to prioritize artist name matches
    const searchQuery = `artist:"${query}" ${query}`
    const endpoint = `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=artist&limit=${limit}`

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch from Spotify API: ${response.statusText}`,
      }
    }

    const data = await response.json()

    if (!data.artists || !data.artists.items || data.artists.items.length === 0) {
      return {
        success: false,
        error: "No artists found on Spotify",
      }
    }

    // Calculate relevance score for each artist based on name similarity
    const artistsWithScores = data.artists.items.map((artist: any) => {
      const similarity = calculateSimilarity(artist.name, query)

      return {
        id: artist.id,
        name: artist.name,
        imageUrl: artist.images && artist.images.length > 0 ? artist.images[0].url : "/placeholder.svg",
        profileUrl: artist.external_urls.spotify,
        followers: artist.followers?.total || 0,
        popularity: artist.popularity || 0,
        relevanceScore: similarity,
        popularTracks: [],
      }
    })

    // Sort by a combination of name similarity and popularity
    // This gives priority to name matches but still considers popular artists
    const sortedArtists = artistsWithScores.sort((a, b) => {
      // If names are very similar, prioritize the more similar one
      if (Math.abs(a.relevanceScore! - b.relevanceScore!) > 0.3) {
        return b.relevanceScore! - a.relevanceScore!
      }

      // If similarity is close, consider popularity as a secondary factor
      return b.popularity! - a.popularity!
    })

    // Get popular tracks for each artist
    const artistsWithTracks = await Promise.all(
      sortedArtists.map(async (artist) => {
        try {
          // Get top tracks for this artist
          const tracksEndpoint = `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=US`
          const tracksResponse = await fetch(tracksEndpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (tracksResponse.ok) {
            const tracksData = await tracksResponse.json()
            if (tracksData.tracks && tracksData.tracks.length > 0) {
              // Get top 3 tracks
              artist.popularTracks = tracksData.tracks.slice(0, 3).map((track: any) => ({
                name: track.name,
                id: track.id,
              }))
            }
          }
        } catch (error) {
          console.error("Error fetching artist tracks:", error)
          // Continue without tracks if there's an error
        }

        return artist
      }),
    )

    return {
      success: true,
      data: artistsWithTracks,
      total: data.artists.total,
    }
  } catch (error) {
    console.error("Error searching Spotify artists:", error)
    return {
      success: false,
      error: "Failed to search for artists on Spotify. Please try again.",
    }
  }
}

// Search for artists on Apple Music with improved relevance
export async function searchAppleMusicArtists(query: string, limit = 20): Promise<SearchResult> {
  if (!query.trim()) {
    return {
      success: false,
      error: "Please enter an artist name",
    }
  }

  try {
    // Use a more specific search query for iTunes
    const endpoint = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=musicArtist&attribute=artistTerm&limit=${limit}`

    const response = await fetch(endpoint)

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch from iTunes API: ${response.statusText}`,
      }
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      return {
        success: false,
        error: "No artists found on Apple Music",
      }
    }

    // Calculate relevance score for each artist based on name similarity
    const artistsWithScores = data.results.map((artist: any) => {
      const similarity = calculateSimilarity(artist.artistName, query)

      return {
        id: artist.artistId.toString(),
        name: artist.artistName,
        imageUrl: "/placeholder.svg", // Will be updated later
        profileUrl: `https://music.apple.com/artist/${artist.artistId}`,
        relevanceScore: similarity,
      }
    })

    // Sort by name similarity
    const sortedArtists = artistsWithScores.sort((a, b) => {
      return b.relevanceScore! - a.relevanceScore!
    })

    // For each artist, fetch a representative album to get an image
    const artistsWithImages = await Promise.all(
      sortedArtists.map(async (artist) => {
        try {
          // Try to find an album by this artist to get an image
          const albumEndpoint = `https://itunes.apple.com/lookup?id=${artist.id}&entity=album&limit=1`
          const albumResponse = await fetch(albumEndpoint)
          const albumData = await albumResponse.json()

          let imageUrl = "/placeholder.svg"

          // If we found an album, use its artwork
          if (albumData.results && albumData.results.length > 1) {
            const album = albumData.results.find((item: any) => item.wrapperType === "collection")
            if (album && album.artworkUrl100) {
              // Get higher resolution image by modifying the URL
              imageUrl = album.artworkUrl100.replace("100x100bb", "600x600bb")
            }
          }

          return {
            ...artist,
            imageUrl,
          }
        } catch (error) {
          // If we can't get an image, just return the artist without one
          return artist
        }
      }),
    )

    return {
      success: true,
      data: artistsWithImages,
      total: data.resultCount,
    }
  } catch (error) {
    console.error("Error searching Apple Music artists:", error)
    return {
      success: false,
      error: "Failed to search for artists on Apple Music. Please try again.",
    }
  }
}
