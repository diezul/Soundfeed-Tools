"use client"

import { useState, type FormEvent, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import {
  Loader2,
  Copy,
  ExternalLink,
  Music,
  Search,
  ChevronDown,
  SortAsc,
  Check,
  Instagram,
  Facebook,
} from "lucide-react"
import Image from "next/image"
import { searchSpotifyArtists, searchAppleMusicArtists } from "../actions/artist-search"
import { searchInstagramArtists, searchFacebookArtists } from "../actions/social-search"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

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

type SortOption = "relevance" | "popularity" | "followers"

export default function ArtistFinder() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [spotifyResults, setSpotifyResults] = useState<ArtistResult[] | null>(null)
  const [appleMusicResults, setAppleMusicResults] = useState<ArtistResult[] | null>(null)
  const [instagramResults, setInstagramResults] = useState<SocialArtistResult[] | null>(null)
  const [facebookResults, setFacebookResults] = useState<SocialArtistResult[] | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>("spotify")
  const [spotifyDisplayCount, setSpotifyDisplayCount] = useState(5)
  const [appleMusicDisplayCount, setAppleMusicDisplayCount] = useState(5)
  const [spotifyTotal, setSpotifyTotal] = useState(0)
  const [appleMusicTotal, setAppleMusicTotal] = useState(0)
  const [loadingMore, setLoadingMore] = useState({ spotify: false, apple: false })
  const [spotifySortOption, setSpotifySortOption] = useState<SortOption>("relevance")
  const [appleMusicSortOption, setAppleMusicSortOption] = useState<SortOption>("relevance")
  const [lastSearchedTerm, setLastSearchedTerm] = useState("")

  const spotifyResultsRef = useRef<HTMLDivElement>(null)
  const appleMusicResultsRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await searchArtists()
  }

  const searchArtists = async () => {
    if (!query.trim()) {
      toast({
        title: "Missing artist name",
        description: "Please enter an artist name to search",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setSpotifyResults(null)
    setAppleMusicResults(null)
    setInstagramResults(null)
    setFacebookResults(null)
    setSpotifyDisplayCount(5)
    setAppleMusicDisplayCount(5)

    // Update the last searched term
    setLastSearchedTerm(query)

    try {
      // Search all platforms in parallel
      const [spotifyResult, appleMusicResult, instagramResult, facebookResult] = await Promise.all([
        searchSpotifyArtists(query, 20),
        searchAppleMusicArtists(query, 20),
        searchInstagramArtists(query),
        searchFacebookArtists(query),
      ])

      if (spotifyResult.success && spotifyResult.data) {
        setSpotifyResults(spotifyResult.data)
        setSpotifyTotal(spotifyResult.total || spotifyResult.data.length)
      } else if (spotifyResult.error) {
        toast({
          title: "Spotify search error",
          description: spotifyResult.error,
          variant: "destructive",
        })
      }

      if (appleMusicResult.success && appleMusicResult.data) {
        setAppleMusicResults(appleMusicResult.data)
        setAppleMusicTotal(appleMusicResult.total || appleMusicResult.data.length)
      } else if (appleMusicResult.error) {
        toast({
          title: "Apple Music search error",
          description: appleMusicResult.error,
          variant: "destructive",
        })
      }

      if (instagramResult.success && instagramResult.data) {
        setInstagramResults(instagramResult.data)
      }

      if (facebookResult.success && facebookResult.data) {
        setFacebookResults(facebookResult.data)
      }

      // If all searches failed, show a general error
      if (
        (!spotifyResult.success || !spotifyResult.data) &&
        (!appleMusicResult.success || !appleMusicResult.data) &&
        (!instagramResult.success || !instagramResult.data) &&
        (!facebookResult.success || !facebookResult.data)
      ) {
        toast({
          title: "Search error",
          description: "No results found on any platform. Try a different search term.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search for artists. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (url: string, artistName: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "Copied to clipboard",
      description: `Link for ${artistName} has been copied to clipboard`,
    })
  }

  const handleAccordionChange = (value: string) => {
    setExpandedSection(value === expandedSection ? null : value)
  }

  const loadMoreSpotify = async () => {
    if (!spotifyResults || loadingMore.spotify) return

    setLoadingMore((prev) => ({ ...prev, spotify: true }))

    try {
      // If we already have all results loaded, just show more
      if (spotifyResults.length > spotifyDisplayCount) {
        setSpotifyDisplayCount((prev) => Math.min(prev + 5, spotifyResults.length))
      } else {
        // Otherwise, fetch more results
        const result = await searchSpotifyArtists(query, spotifyResults.length + 10)
        if (result.success && result.data) {
          setSpotifyResults(result.data)
          setSpotifyDisplayCount((prev) => prev + 5)
          setSpotifyTotal(result.total || result.data.length)
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load more artists. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingMore((prev) => ({ ...prev, spotify: false }))
      // Scroll to show new results
      setTimeout(() => {
        if (spotifyResultsRef.current) {
          spotifyResultsRef.current.scrollTop = spotifyResultsRef.current.scrollHeight
        }
      }, 100)
    }
  }

  const loadMoreAppleMusic = async () => {
    if (!appleMusicResults || loadingMore.apple) return

    setLoadingMore((prev) => ({ ...prev, apple: true }))

    try {
      // If we already have all results loaded, just show more
      if (appleMusicResults.length > appleMusicDisplayCount) {
        setAppleMusicDisplayCount((prev) => Math.min(prev + 5, appleMusicResults.length))
      } else {
        // Otherwise, fetch more results
        const result = await searchAppleMusicArtists(query, appleMusicResults.length + 10)
        if (result.success && result.data) {
          setAppleMusicResults(result.data)
          setAppleMusicDisplayCount((prev) => prev + 5)
          setAppleMusicTotal(result.total || result.data.length)
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load more artists. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingMore((prev) => ({ ...prev, apple: false }))
      // Scroll to show new results
      setTimeout(() => {
        if (appleMusicResultsRef.current) {
          appleMusicResultsRef.current.scrollTop = appleMusicResultsRef.current.scrollHeight
        }
      }, 100)
    }
  }

  const sortSpotifyResults = (option: SortOption) => {
    if (!spotifyResults) return

    setSpotifySortOption(option)

    const sortedResults = [...spotifyResults].sort((a, b) => {
      switch (option) {
        case "relevance":
          return (b.relevanceScore || 0) - (a.relevanceScore || 0)
        case "popularity":
          return (b.popularity || 0) - (a.popularity || 0)
        case "followers":
          return (b.followers || 0) - (a.followers || 0)
        default:
          return 0
      }
    })

    setSpotifyResults(sortedResults)
  }

  const sortAppleMusicResults = (option: SortOption) => {
    if (!appleMusicResults) return

    setAppleMusicSortOption(option)

    const sortedResults = [...appleMusicResults].sort((a, b) => {
      if (option === "relevance") {
        return (b.relevanceScore || 0) - (a.relevanceScore || 0)
      }
      return 0
    })

    setAppleMusicResults(sortedResults)
  }

  // Function to get relevance badge color
  const getRelevanceBadgeColor = (score?: number) => {
    if (!score) return "bg-gray-500/20 text-gray-300"
    if (score >= 0.8) return "bg-green-500/20 text-green-300"
    if (score >= 0.5) return "bg-yellow-500/20 text-yellow-300"
    return "bg-red-500/20 text-red-300"
  }

  // Function to get relevance text
  const getRelevanceText = (score?: number) => {
    if (!score) return "Unknown"
    if (score >= 0.8) return "High"
    if (score >= 0.5) return "Medium"
    return "Low"
  }

  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-3xl backdrop-blur-md bg-white/10 border-white/20 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Artist on DSPs & Social Finder</CardTitle>
          <CardDescription className="text-gray-300">
            Find artists on Spotify, Apple Music, Instagram, and Facebook
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4 mb-6">
            <div className="flex w-full items-center space-x-2">
              <Input
                type="text"
                placeholder="Enter artist name (e.g., RAVA)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </form>

          {(spotifyResults || appleMusicResults || instagramResults || facebookResults) && (
            <Accordion
              type="single"
              collapsible
              value={expandedSection || undefined}
              onValueChange={handleAccordionChange}
              className="space-y-4"
            >
              {/* Spotify Section */}
              <AccordionItem value="spotify" className="border-white/10 rounded-md overflow-hidden">
                <AccordionTrigger className="px-4 py-3 bg-[#1DB954]/20 hover:bg-[#1DB954]/30 rounded-md">
                  <div className="flex items-center">
                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#1DB954]/20">
                      <Music className="h-4 w-4 text-[#1DB954]" />
                    </div>
                    <span>
                      Spotify Artists{" "}
                      {spotifyResults && `(${Math.min(spotifyDisplayCount, spotifyResults.length)}/${spotifyTotal})`}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  {spotifyResults && spotifyResults.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-400">Showing artists matching "{lastSearchedTerm}"</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8">
                              <SortAsc className="h-3 w-3 mr-2" />
                              Sort by: {spotifySortOption.charAt(0).toUpperCase() + spotifySortOption.slice(1)}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => sortSpotifyResults("relevance")}>
                              {spotifySortOption === "relevance" && <Check className="h-3 w-3 mr-2" />}
                              Name Match
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => sortSpotifyResults("popularity")}>
                              {spotifySortOption === "popularity" && <Check className="h-3 w-3 mr-2" />}
                              Popularity
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => sortSpotifyResults("followers")}>
                              {spotifySortOption === "followers" && <Check className="h-3 w-3 mr-2" />}
                              Followers
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div
                        ref={spotifyResultsRef}
                        className="max-h-[500px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                      >
                        {spotifyResults.slice(0, spotifyDisplayCount).map((artist) => (
                          <div
                            key={artist.id}
                            className="flex flex-col p-4 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center">
                              <div className="relative h-16 w-16 rounded-full overflow-hidden mr-4 flex-shrink-0">
                                <Image
                                  src={artist.imageUrl || "/placeholder.svg"}
                                  alt={artist.name}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col">
                                  <h3 className="font-medium text-lg truncate">{artist.name}</h3>
                                  <Badge
                                    variant="outline"
                                    className={`mt-1 w-fit text-xs ${getRelevanceBadgeColor(artist.relevanceScore)}`}
                                  >
                                    {getRelevanceText(artist.relevanceScore)} match
                                  </Badge>
                                </div>
                                {artist.followers !== undefined && (
                                  <p className="text-sm text-gray-400">{artist.followers.toLocaleString()} followers</p>
                                )}
                                {artist.popularTracks && artist.popularTracks.length > 0 && (
                                  <div className="mt-1">
                                    <p className="text-xs text-gray-500 mb-1">Popular tracks:</p>
                                    <ul className="text-sm text-gray-300">
                                      {artist.popularTracks.map((track) => (
                                        <li key={track.id} className="truncate">
                                          • {track.name}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col space-y-2 ml-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2"
                                  onClick={() => copyToClipboard(artist.profileUrl, artist.name)}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 bg-[#1DB954]/20 hover:bg-[#1DB954]/30 border-[#1DB954]/30"
                                  asChild
                                >
                                  <a href={artist.profileUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Open
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {spotifyResults.length > spotifyDisplayCount && (
                        <div className="flex justify-center pt-2">
                          <Button
                            variant="outline"
                            className="bg-black/40 hover:bg-black/60 border-white/10"
                            onClick={loadMoreSpotify}
                            disabled={loadingMore.spotify}
                          >
                            {loadingMore.spotify ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <ChevronDown className="h-4 w-4 mr-2" />
                            )}
                            Show More
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      No Spotify artists found. Try a different search term.
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Apple Music Section */}
              <AccordionItem value="apple" className="border-white/10 rounded-md overflow-hidden">
                <AccordionTrigger className="px-4 py-3 bg-[#FB233B]/20 hover:bg-[#FB233B]/30 rounded-md">
                  <div className="flex items-center">
                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#FB233B]/20">
                      <Music className="h-4 w-4 text-[#FB233B]" />
                    </div>
                    <span>
                      Apple Music Artists{" "}
                      {appleMusicResults &&
                        `(${Math.min(appleMusicDisplayCount, appleMusicResults.length)}/${appleMusicTotal})`}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  {appleMusicResults && appleMusicResults.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-400">Showing artists matching "{lastSearchedTerm}"</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8">
                              <SortAsc className="h-3 w-3 mr-2" />
                              Sort by: {appleMusicSortOption.charAt(0).toUpperCase() + appleMusicSortOption.slice(1)}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => sortAppleMusicResults("relevance")}>
                              {appleMusicSortOption === "relevance" && <Check className="h-3 w-3 mr-2" />}
                              Name Match
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div
                        ref={appleMusicResultsRef}
                        className="max-h-[500px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                      >
                        {appleMusicResults.slice(0, appleMusicDisplayCount).map((artist) => (
                          <div
                            key={artist.id}
                            className="flex items-center p-4 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="relative h-16 w-16 rounded-full overflow-hidden mr-4 flex-shrink-0">
                              <Image
                                src={artist.imageUrl || "/placeholder.svg"}
                                alt={artist.name}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col">
                                <h3 className="font-medium text-lg truncate">{artist.name}</h3>
                                <Badge
                                  variant="outline"
                                  className={`mt-1 w-fit text-xs ${getRelevanceBadgeColor(artist.relevanceScore)}`}
                                >
                                  {getRelevanceText(artist.relevanceScore)} match
                                </Badge>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2 ml-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2"
                                onClick={() => copyToClipboard(artist.profileUrl, artist.name)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 bg-[#FB233B]/20 hover:bg-[#FB233B]/30 border-[#FB233B]/30"
                                asChild
                              >
                                <a href={artist.profileUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Open
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {appleMusicResults.length > appleMusicDisplayCount && (
                        <div className="flex justify-center pt-2">
                          <Button
                            variant="outline"
                            className="bg-black/40 hover:bg-black/60 border-white/10"
                            onClick={loadMoreAppleMusic}
                            disabled={loadingMore.apple}
                          >
                            {loadingMore.apple ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <ChevronDown className="h-4 w-4 mr-2" />
                            )}
                            Show More
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      No Apple Music artists found. Try a different search term.
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Instagram Section */}
              <AccordionItem value="instagram" className="border-white/10 rounded-md overflow-hidden">
                <AccordionTrigger className="px-4 py-3 bg-[#E1306C]/20 hover:bg-[#E1306C]/30 rounded-md">
                  <div className="flex items-center">
                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#E1306C]/20">
                      <Instagram className="h-4 w-4 text-[#E1306C]" />
                    </div>
                    <span>Instagram</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  {instagramResults && instagramResults.length > 0 ? (
                    <div className="space-y-3">
                      <div className="mb-2">
                        <p className="text-sm text-gray-400">Instagram search for "{lastSearchedTerm}"</p>
                      </div>
                      <div className="space-y-3">
                        {instagramResults.map((result) => (
                          <div
                            key={result.id}
                            className="flex items-center p-4 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="relative h-16 w-16 rounded-full overflow-hidden mr-4 flex-shrink-0">
                              {result.profilePicture ? (
                                <Image
                                  src={result.profilePicture}
                                  alt={result.name}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-[#E1306C]/20">
                                  <Instagram className="h-8 w-8 text-[#E1306C]" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-lg truncate">{result.name}</h3>
                                {result.verified && (
                                  <Badge variant="secondary" className="bg-[#E1306C]/20 text-[#E1306C] border-[#E1306C]/30">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              {result.followers && (
                                <p className="text-sm text-gray-400">
                                  {result.followers.toLocaleString()} followers
                                </p>
                              )}
                              <p className="text-sm text-gray-400">
                                {result.directUrl ? "Direct profile" : "Search results"}
                              </p>
                            </div>
                            <div className="flex flex-col space-y-2 ml-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2"
                                onClick={() => copyToClipboard(result.directUrl || result.searchUrl, result.name)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                              {result.directUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 bg-[#E1306C]/20 hover:bg-[#E1306C]/30 border-[#E1306C]/30"
                                  asChild
                                >
                                  <a href={result.directUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Profile
                                  </a>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 bg-[#E1306C]/20 hover:bg-[#E1306C]/30 border-[#E1306C]/30"
                                asChild
                              >
                                <a href={result.searchUrl} target="_blank" rel="noopener noreferrer">
                                  <Search className="h-3 w-3 mr-1" />
                                  Search
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                        <p className="text-sm text-yellow-300">
                          <strong>Note:</strong> Instagram links are best-guess searches and may not lead directly to
                          the artist's profile.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400">No Instagram results available.</div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Facebook Section */}
              <AccordionItem value="facebook" className="border-white/10 rounded-md overflow-hidden">
                <AccordionTrigger className="px-4 py-3 bg-[#1877F2]/20 hover:bg-[#1877F2]/30 rounded-md">
                  <div className="flex items-center">
                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2]/20">
                      <Facebook className="h-4 w-4 text-[#1877F2]" />
                    </div>
                    <span>Facebook</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  {facebookResults && facebookResults.length > 0 ? (
                    <div className="space-y-3">
                      <div className="mb-2">
                        <p className="text-sm text-gray-400">Facebook search for "{lastSearchedTerm}"</p>
                      </div>
                      <div className="space-y-3">
                        {facebookResults.map((result) => (
                          <div
                            key={result.id}
                            className="flex items-center p-4 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="relative h-16 w-16 rounded-full overflow-hidden mr-4 flex-shrink-0">
                              {result.profilePicture ? (
                                <Image
                                  src={result.profilePicture}
                                  alt={result.name}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-[#1877F2]/20">
                                  <Facebook className="h-8 w-8 text-[#1877F2]" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-lg truncate">{result.name}</h3>
                                {result.verified && (
                                  <Badge variant="secondary" className="bg-[#1877F2]/20 text-[#1877F2] border-[#1877F2]/30">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              {result.followers && (
                                <p className="text-sm text-gray-400">
                                  {result.followers.toLocaleString()} followers
                                </p>
                              )}
                              <p className="text-sm text-gray-400">
                                {result.directUrl ? "Direct profile" : "Search results"}
                              </p>
                            </div>
                            <div className="flex flex-col space-y-2 ml-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2"
                                onClick={() => copyToClipboard(result.directUrl || result.searchUrl, result.name)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                              {result.directUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 bg-[#1877F2]/20 hover:bg-[#1877F2]/30 border-[#1877F2]/30"
                                  asChild
                                >
                                  <a href={result.directUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Profile
                                  </a>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 bg-[#1877F2]/20 hover:bg-[#1877F2]/30 border-[#1877F2]/30"
                                asChild
                              >
                                <a href={result.searchUrl} target="_blank" rel="noopener noreferrer">
                                  <Search className="h-3 w-3 mr-1" />
                                  Search
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                        <p className="text-sm text-yellow-300">
                          <strong>Note:</strong> Facebook links lead to search results and not directly to artist
                          profiles.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400">No Facebook results available.</div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
