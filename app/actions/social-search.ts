"use server"

import { FACEBOOK_CONFIG } from "../config/facebook"

interface SocialArtistResult {
  id: string
  name: string
  searchUrl: string
  directUrl?: string
  relevanceScore?: number
  profilePicture?: string
  followers?: number
  verified?: boolean
}

interface SocialSearchResult {
  success: boolean
  data?: SocialArtistResult[]
  error?: string
}

interface InstagramProfileData {
  profile_picture_url?: string
  followers_count?: number
  is_verified?: boolean
  username?: string
}

// Format artist name for URL (replace spaces with appropriate characters)
function formatNameForUrl(name: string): string {
  return encodeURIComponent(name.trim())
}

// Get Facebook access token
async function getFacebookAccessToken(): Promise<string> {
  const response = await fetch(
    `${FACEBOOK_CONFIG.baseUrl}/oauth/access_token?client_id=${FACEBOOK_CONFIG.appId}&client_secret=${FACEBOOK_CONFIG.appSecret}&grant_type=client_credentials`
  )
  const data = await response.json()
  return data.access_token
}

// Generate Instagram search results using Facebook Graph API
export async function searchInstagramArtists(query: string): Promise<SocialSearchResult> {
  if (!query.trim()) {
    return {
      success: false,
      error: "Please enter an artist name",
    }
  }

  try {
    const accessToken = await getFacebookAccessToken()
    const formattedName = formatNameForUrl(query)

    // Search for Instagram Business accounts
    const response = await fetch(
      `${FACEBOOK_CONFIG.baseUrl}/${FACEBOOK_CONFIG.apiVersion}/instagram_oembed?url=https://www.instagram.com/${formattedName}&access_token=${accessToken}`
    )

    if (!response.ok) {
      // If the direct profile doesn't exist, fall back to search
      const searchUrl = `https://www.instagram.com/explore/search/keyword/?q=${formattedName}`
      return {
        success: true,
        data: [{
          id: `instagram-${query}`,
          name: query,
          searchUrl,
          relevanceScore: 0.5,
        }],
      }
    }

    const data = await response.json()
    const directUrl = `https://www.instagram.com/${formattedName}/`

    // Get additional profile information
    const profileResponse = await fetch(
      `${FACEBOOK_CONFIG.baseUrl}/${FACEBOOK_CONFIG.apiVersion}/instagram_business_account?fields=profile_picture_url,followers_count,username&access_token=${accessToken}`
    )

    let profileData: InstagramProfileData = {}
    if (profileResponse.ok) {
      profileData = await profileResponse.json()
    }

    const result: SocialArtistResult = {
      id: `instagram-${query}`,
      name: query,
      searchUrl: directUrl,
      directUrl,
      relevanceScore: 1,
      profilePicture: profileData.profile_picture_url,
      followers: profileData.followers_count,
      verified: profileData.is_verified,
    }

    return {
      success: true,
      data: [result],
    }
  } catch (error) {
    console.error("Error searching Instagram:", error)
    return {
      success: false,
      error: "Failed to search Instagram. Please try again.",
    }
  }
}

// Generate Facebook search results using Facebook Graph API
export async function searchFacebookArtists(query: string): Promise<SocialSearchResult> {
  if (!query.trim()) {
    return {
      success: false,
      error: "Please enter an artist name",
    }
  }

  try {
    const accessToken = await getFacebookAccessToken()
    const formattedName = formatNameForUrl(query)

    // Search for Facebook Pages
    const pagesResponse = await fetch(
      `${FACEBOOK_CONFIG.baseUrl}/${FACEBOOK_CONFIG.apiVersion}/pages/search?q=${formattedName}&fields=id,name,picture,fan_count,is_verified&access_token=${accessToken}`
    )

    const pagesData = await pagesResponse.json()
    const results: SocialArtistResult[] = []

    if (pagesData.data && pagesData.data.length > 0) {
      pagesData.data.forEach((page: any) => {
        results.push({
          id: `facebook-page-${page.id}`,
          name: page.name,
          searchUrl: `https://www.facebook.com/${page.id}`,
          directUrl: `https://www.facebook.com/${page.id}`,
          relevanceScore: 1,
          profilePicture: page.picture?.data?.url,
          followers: page.fan_count,
          verified: page.is_verified,
        })
      })
    }

    // Search for Facebook Profiles
    const profilesResponse = await fetch(
      `${FACEBOOK_CONFIG.baseUrl}/${FACEBOOK_CONFIG.apiVersion}/users/search?q=${formattedName}&fields=id,name,picture&access_token=${accessToken}`
    )

    const profilesData = await profilesResponse.json()

    if (profilesData.data && profilesData.data.length > 0) {
      profilesData.data.forEach((profile: any) => {
        results.push({
          id: `facebook-profile-${profile.id}`,
          name: profile.name,
          searchUrl: `https://www.facebook.com/${profile.id}`,
          directUrl: `https://www.facebook.com/${profile.id}`,
          relevanceScore: 0.8,
          profilePicture: profile.picture?.data?.url,
        })
      })
    }

    if (results.length === 0) {
      // Fallback to search URLs if no API results
      results.push(
        {
          id: `facebook-pages-${query}`,
          name: `${query} (Pages)`,
          searchUrl: `https://www.facebook.com/search/pages?q=${formattedName}`,
          relevanceScore: 0.5,
        },
        {
          id: `facebook-people-${query}`,
          name: `${query} (People)`,
          searchUrl: `https://www.facebook.com/search/people?q=${formattedName}`,
          relevanceScore: 0.4,
        }
      )
    }

    return {
      success: true,
      data: results,
    }
  } catch (error) {
    console.error("Error searching Facebook:", error)
    return {
      success: false,
      error: "Failed to search Facebook. Please try again.",
    }
  }
}
