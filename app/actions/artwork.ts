"use server"

import { fetchArtwork } from "./spotify"
import { fetchAppleMusicArtwork } from "./apple-music"

export async function fetchArtworkFromUrl(url: string) {
  // Determine the source based on the URL
  if (url.includes("spotify.com") || url.startsWith("spotify:")) {
    return await fetchArtwork(url)
  } else if (url.includes("music.apple.com")) {
    return await fetchAppleMusicArtwork(url)
  } else {
    return {
      success: false,
      error: "Unsupported URL. Please enter a valid Spotify or Apple Music URL.",
    }
  }
}
