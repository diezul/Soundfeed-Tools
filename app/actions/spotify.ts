"use server"

import { getSpotifyToken } from "../actions"

interface SpotifyImage {
  url: string
  height: number
  width: number
}

interface ArtworkResult {
  success: boolean
  data?: {
    images: SpotifyImage[]
    name: string
    artists?: string
    type: string
  }
  error?: string
}

// Extract Spotify ID from URL
export async function extractSpotifyId(url: string): Promise<{ id: string; type: string } | null> {
  // Track URL pattern: https://open.spotify.com/track/1dGr1c8CrMLDpV6mPbImSI
  const trackMatch = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/)
  if (trackMatch) return { id: trackMatch[1], type: "track" }

  // Album URL pattern: https://open.spotify.com/album/1dGr1c8CrMLDpV6mPbImSI
  const albumMatch = url.match(/spotify\.com\/album\/([a-zA-Z0-9]+)/)
  if (albumMatch) return { id: albumMatch[1], type: "album" }

  // Playlist URL pattern: https://open.spotify.com/playlist/1dGr1c8CrMLDpV6mPbImSI
  const playlistMatch = url.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/)
  if (playlistMatch) return { id: playlistMatch[1], type: "playlist" }

  // Spotify URI pattern: spotify:track:1dGr1c8CrMLDpV6mPbImSI
  const uriMatch = url.match(/spotify:(track|album|playlist):([a-zA-Z0-9]+)/)
  if (uriMatch) return { id: uriMatch[2], type: uriMatch[1] }

  return null
}

// Fetch artwork from Spotify API
export async function fetchArtwork(url: string): Promise<ArtworkResult> {
  try {
    const spotifyItem = await extractSpotifyId(url)

    if (!spotifyItem) {
      return {
        success: false,
        error: "Invalid Spotify URL. Please enter a valid Spotify track, album, or playlist URL.",
      }
    }

    const { id, type } = spotifyItem
    const token = await getSpotifyToken()

    let endpoint = ""
    switch (type) {
      case "track":
        endpoint = `https://api.spotify.com/v1/tracks/${id}`
        break
      case "album":
        endpoint = `https://api.spotify.com/v1/albums/${id}`
        break
      case "playlist":
        endpoint = `https://api.spotify.com/v1/playlists/${id}`
        break
      default:
        return {
          success: false,
          error: "Unsupported Spotify content type.",
        }
    }

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

    if (!data.images && data.album) {
      // For tracks, the images are in the album object
      data.images = data.album.images
    }

    if (!data.images || data.images.length === 0) {
      return {
        success: false,
        error: "No artwork found for this item.",
      }
    }

    // Sort images by size (largest first)
    const sortedImages = [...data.images].sort((a, b) => (b.width || 0) - (a.width || 0))

    // Get artist names for tracks and albums
    let artistNames = ""
    if (type === "track" || type === "album") {
      artistNames = data.artists.map((artist: any) => artist.name).join(", ")
    }

    return {
      success: true,
      data: {
        images: sortedImages,
        name: data.name,
        artists: artistNames,
        type: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize first letter
      },
    }
  } catch (error) {
    console.error("Error fetching artwork:", error)
    return {
      success: false,
      error: "Failed to fetch artwork. Please try again.",
    }
  }
}
