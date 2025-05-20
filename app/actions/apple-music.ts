"use server"

interface AppleImage {
  url: string
  height: number
  width: number
}

interface ArtworkResult {
  success: boolean
  data?: {
    images: AppleImage[]
    name: string
    artists?: string
    type: string
  }
  error?: string
}

// Extract Apple Music ID from URL
export async function extractAppleMusicId(url: string): Promise<{ id: string; type: string } | null> {
  // Album URL pattern: https://music.apple.com/us/album/album-name/1234567890
  const albumMatch = url.match(/music\.apple\.com\/(?:[a-z]{2}\/)?album\/(?:[^/]+)\/(\d+)/)
  if (albumMatch) return { id: albumMatch[1], type: "album" }

  // Song URL pattern: https://music.apple.com/us/album/song-name/1234567890?i=1234567891
  const songMatch = url.match(/music\.apple\.com\/(?:[a-z]{2}\/)?album\/(?:[^/]+)\/\d+\?i=(\d+)/)
  if (songMatch) return { id: songMatch[1], type: "song" }

  // Playlist URL pattern: https://music.apple.com/us/playlist/playlist-name/pl.1234567890
  const playlistMatch = url.match(/music\.apple\.com\/(?:[a-z]{2}\/)?playlist\/(?:[^/]+)\/(pl\.\d+)/)
  if (playlistMatch) return { id: playlistMatch[1], type: "playlist" }

  return null
}

// Fetch artwork from iTunes API
export async function fetchAppleMusicArtwork(url: string): Promise<ArtworkResult> {
  try {
    const appleMusicItem = await extractAppleMusicId(url)

    if (!appleMusicItem) {
      return {
        success: false,
        error: "Invalid Apple Music URL. Please enter a valid Apple Music song, album, or playlist URL.",
      }
    }

    const { id, type } = appleMusicItem

    // Use iTunes Search API
    let endpoint = ""
    let searchType = ""

    switch (type) {
      case "song":
        searchType = "song"
        endpoint = `https://itunes.apple.com/lookup?id=${id}&entity=song`
        break
      case "album":
        searchType = "album"
        endpoint = `https://itunes.apple.com/lookup?id=${id}&entity=album`
        break
      case "playlist":
        // iTunes API doesn't directly support playlist lookups
        return {
          success: false,
          error: "Apple Music playlists are not currently supported. Please use a song or album URL.",
        }
      default:
        return {
          success: false,
          error: "Unsupported Apple Music content type.",
        }
    }

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
        error: "No results found for this Apple Music item.",
      }
    }

    const item = data.results[0]

    // Process artwork URL to get different sizes
    // iTunes artwork URLs are in the format: https://is1-ssl.mzstatic.com/image/thumb/Music/v4/a5/a5/a5/a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5/source/100x100bb.jpg
    // We can modify the URL to get different sizes: 100x100, 300x300, 600x600, 1000x1000, 1500x1500, 2000x2000, 3000x3000
    const artworkUrl = item.artworkUrl100 || ""
    const baseUrl = artworkUrl.replace(/\/100x100bb\.jpg$/, "")

    if (!baseUrl) {
      return {
        success: false,
        error: "No artwork found for this item.",
      }
    }

    // Only include the high-quality sizes: 1500x1500, 2000x2000, 3000x3000
    const sizes = [1500, 2000, 3000]
    const images = sizes.map((size) => ({
      url: `${baseUrl}/${size}x${size}bb.jpg`,
      width: size,
      height: size,
    }))

    return {
      success: true,
      data: {
        images,
        name: item.trackName || item.collectionName,
        artists: item.artistName,
        type: type === "song" ? "Song" : "Album",
      },
    }
  } catch (error) {
    console.error("Error fetching Apple Music artwork:", error)
    return {
      success: false,
      error: "Failed to fetch artwork. Please try again.",
    }
  }
}
