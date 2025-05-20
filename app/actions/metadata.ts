"use server"

import { getSpotifyToken } from "../actions"

interface MetadataResult {
  success: boolean
  data?: {
    title: string
    artist: string
    imageUrl: string
    code: string // ISRC or UPC
    type: "ISRC" | "UPC"
    releaseDate?: string
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

  // Spotify URI pattern: spotify:track:1dGr1c8CrMLDpV6mPbImSI or spotify:album:1dGr1c8CrMLDpV6mPbImSI
  const uriMatch = url.match(/spotify:(track|album):([a-zA-Z0-9]+)/)
  if (uriMatch) return { id: uriMatch[2], type: uriMatch[1] }

  return null
}

// Fetch ISRC from Spotify API
export async function fetchISRC(url: string): Promise<MetadataResult> {
  try {
    const spotifyItem = await extractSpotifyId(url)

    if (!spotifyItem) {
      return {
        success: false,
        error: "Invalid Spotify URL. Please enter a valid Spotify track URL.",
      }
    }

    const { id, type } = spotifyItem

    if (type !== "track") {
      return {
        success: false,
        error: "Please enter a Spotify track URL to get ISRC. For albums, use the UPC tab.",
      }
    }

    const token = await getSpotifyToken()
    const endpoint = `https://api.spotify.com/v1/tracks/${id}`

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

    if (!data.external_ids?.isrc) {
      return {
        success: false,
        error: "No ISRC found for this track.",
      }
    }

    return {
      success: true,
      data: {
        title: data.name,
        artist: data.artists.map((artist: any) => artist.name).join(", "),
        imageUrl: data.album.images[0]?.url || "",
        code: data.external_ids.isrc,
        type: "ISRC",
        releaseDate: data.album.release_date,
      },
    }
  } catch (error) {
    console.error("Error fetching ISRC:", error)
    return {
      success: false,
      error: "Failed to fetch ISRC. Please try again.",
    }
  }
}

// Fetch UPC from Spotify API
export async function fetchUPC(url: string): Promise<MetadataResult> {
  try {
    const spotifyItem = await extractSpotifyId(url)

    if (!spotifyItem) {
      return {
        success: false,
        error: "Invalid Spotify URL. Please enter a valid Spotify album URL.",
      }
    }

    const { id, type } = spotifyItem

    if (type !== "album") {
      return {
        success: false,
        error: "Please enter a Spotify album URL to get UPC. For tracks, use the ISRC tab.",
      }
    }

    const token = await getSpotifyToken()
    const endpoint = `https://api.spotify.com/v1/albums/${id}`

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

    if (!data.external_ids?.upc) {
      return {
        success: false,
        error: "No UPC found for this album.",
      }
    }

    return {
      success: true,
      data: {
        title: data.name,
        artist: data.artists.map((artist: any) => artist.name).join(", "),
        imageUrl: data.images[0]?.url || "",
        code: data.external_ids.upc,
        type: "UPC",
        releaseDate: data.release_date,
      },
    }
  } catch (error) {
    console.error("Error fetching UPC:", error)
    return {
      success: false,
      error: "Failed to fetch UPC. Please try again.",
    }
  }
}
