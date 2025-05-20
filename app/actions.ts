"use server"

// YouTube API functions
export async function fetchYouTubeChannelId(username: string) {
  const apiKey = process.env.YOUTUBE_API_KEY || "AIzaSyD-dytrkTisL5AHsMMWfbtNUSk3P2rjga0"

  try {
    // Fetching channel details using search endpoint
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${username}&key=${apiKey}`,
    )
    const searchData = await searchResponse.json()

    if (searchData.items && searchData.items.length > 0) {
      const channelId = searchData.items[0].snippet.channelId
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`,
      )
      const channelData = await channelResponse.json()

      if (channelData.items && channelData.items.length > 0) {
        const channel = channelData.items[0]
        return {
          success: true,
          data: {
            id: channel.id,
            title: channel.snippet.title,
            url: `https://www.youtube.com/channel/${channel.id}`,
            imageUrl: channel.snippet.thumbnails.default.url,
          },
        }
      }
    }

    return {
      success: false,
      error: "Channel not found",
    }
  } catch (error) {
    return {
      success: false,
      error: "Error fetching channel data",
    }
  }
}

// Spotify API functions
export async function getSpotifyToken() {
  const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "5cb944b0fc7a481c8ee84d2911e43109"
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "d0ce8f82f21c4642a637da9bb3dec00f"

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64"),
      },
      body: "grant_type=client_credentials",
    })

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error("Error getting Spotify token:", error)
    throw error
  }
}

export async function searchSpotifyTrack(query: string) {
  try {
    const token = await getSpotifyToken()

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    const data = await response.json()
    if (data.tracks?.items?.length > 0) {
      const track = data.tracks.items[0]
      return {
        url: track.external_urls.spotify,
        title: `${track.name} - ${track.artists[0].name}`,
      }
    } else {
      return {
        url: `https://open.spotify.com/search/${encodeURIComponent(query)}`,
        title: `Search for ${query}`,
      }
    }
  } catch (error) {
    console.error("Error searching Spotify:", error)
    return {
      url: `https://open.spotify.com/search/${encodeURIComponent(query)}`,
      title: `Search for ${query}`,
    }
  }
}

export async function searchYouTubeVideo(query: string) {
  const apiKey = process.env.YOUTUBE_API_KEY || "AIzaSyD-dytrkTisL5AHsMMWfbtNUSk3P2rjga0"

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`,
    )
    const data = await response.json()

    if (data.items?.length > 0) {
      return {
        url: `https://www.youtube.com/watch?v=${data.items[0].id.videoId}`,
        title: data.items[0].snippet.title,
      }
    } else {
      return {
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        title: `Search for ${query}`,
      }
    }
  } catch (error) {
    console.error("Error searching YouTube:", error)
    return {
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      title: `Search for ${query}`,
    }
  }
}

export async function generateStreamLinks(artistName: string, songName: string) {
  const query = `${artistName} ${songName}`

  try {
    const [spotifyData, youtubeData] = await Promise.all([searchSpotifyTrack(query), searchYouTubeVideo(query)])

    return {
      success: true,
      data: {
        spotify: spotifyData,
        youtube: youtubeData,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: "Failed to generate links",
    }
  }
}
