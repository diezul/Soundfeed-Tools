"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Download, ExternalLink, RefreshCw, BadgeCheck } from "lucide-react"
import Image from "next/image"
import { fetchArtworkFromUrl } from "../actions/artwork"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface ArtworkImage {
  url: string
  height: number
  width: number
}

interface ArtworkData {
  images: ArtworkImage[]
  name: string
  artists?: string
  type: string
  source: "spotify" | "apple"
}

export default function ArtworkDownloader() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [artwork, setArtwork] = useState<ArtworkData | null>(null)
  const [activeTab, setActiveTab] = useState("apple")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await getArtwork()
  }

  const getArtwork = async () => {
    if (!url) {
      toast({
        title: "Missing URL",
        description: "Please enter a URL",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const result = await fetchArtworkFromUrl(url)

      if (result.success && result.data) {
        // Determine the source based on the URL
        const source = url.includes("spotify") ? "spotify" : "apple"

        // Filter images based on source
        let filteredImages = [...result.data.images]

        if (source === "apple") {
          // For Apple Music, only show 1500x1500, 2000x2000, and 3000x3000
          filteredImages = filteredImages.filter(
            (img) => img.width === 1500 || img.width === 2000 || img.width === 3000,
          )
        } else {
          // For Spotify, only show 64x64, 300x300, and 640x640 in that order
          const targetSizes = [64, 300, 640]
          filteredImages = filteredImages
            .filter((img) => targetSizes.includes(img.width))
            .sort((a, b) => targetSizes.indexOf(a.width) - targetSizes.indexOf(b.width))
        }

        setArtwork({
          ...result.data,
          images: filteredImages,
          source,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch artwork",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch artwork. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setUrl("")
    setArtwork(null)
  }

  // Function to format file size
  const formatFileSize = (url: string): string => {
    // Estimate file size based on image dimensions
    const image = artwork?.images.find((img) => img.url === url)
    if (!image || !image.width || !image.height) return "Unknown size"

    // Rough estimate: 4 bytes per pixel (RGBA)
    const sizeInBytes = image.width * image.height * 4

    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
    }
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setUrl("")
    setArtwork(null)
  }

  // Get placeholder text based on active tab
  const getPlaceholderText = () => {
    if (activeTab === "spotify") {
      return "Enter Spotify URL (e.g., https://open.spotify.com/track/...)"
    } else {
      return "Enter Apple Music URL (e.g., https://music.apple.com/album/...)"
    }
  }

  // Get the appropriate preview image based on source
  const getPreviewImageUrl = (artwork: ArtworkData): string => {
    if (!artwork || !artwork.images || artwork.images.length === 0) {
      return "/placeholder.svg"
    }

    if (artwork.source === "apple") {
      // For Apple Music, use the 1500x1500 image
      const image1500 = artwork.images.find((img) => img.width === 1500)
      return image1500?.url || artwork.images[0].url
    } else {
      // For Spotify, use the 640x640 image (which should be the last in our filtered list)
      const image640 = artwork.images.find((img) => img.width === 640)
      return image640?.url || artwork.images[artwork.images.length - 1].url
    }
  }

  // Function to handle image download
  const handleDownload = async (imageUrl: string, imageName: string) => {
    try {
      // Show loading toast
      toast({
        title: "Starting download...",
        description: "Preparing your artwork for download",
      })

      // Fetch the image
      const response = await fetch(imageUrl)
      const blob = await response.blob()

      // Create a blob URL
      const blobUrl = URL.createObjectURL(blob)

      // Create a temporary anchor element
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = `${imageName.replace(/\s+/g, "-")}-artwork.jpg`

      // Append to body, click and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the blob URL
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl)
      }, 100)

      // Show success toast
      toast({
        title: "Download started",
        description: "Your artwork is being downloaded",
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download failed",
        description: "There was an error downloading the image. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-2xl backdrop-blur-md bg-white/10 border-white/20 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Artwork Downloader</CardTitle>
          <CardDescription className="text-gray-300">
            Download high-quality artwork from Apple Music and Spotify
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="apple" className="relative">
                Apple Music
                <Badge variant="outline" className="ml-2 bg-green-500/20 text-green-300 border-green-500/30">
                  <BadgeCheck className="h-3 w-3 mr-1" />
                  Recommended
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="spotify">Spotify</TabsTrigger>
            </TabsList>
            <TabsContent value="apple" className="mt-4">
              <p className="text-sm text-gray-300 mb-2">
                <span className="font-medium text-green-400">Recommended:</span> Apple Music provides higher quality
                artwork up to 3000x3000 pixels.
              </p>
            </TabsContent>
            <TabsContent value="spotify" className="mt-4">
              <p className="text-sm text-gray-300 mb-2">
                Enter a Spotify track, album, or playlist URL to download its artwork.
              </p>
            </TabsContent>
          </Tabs>

          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <Input
              type="url"
              placeholder={getPlaceholderText()}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 w-full"
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading
                </>
              ) : (
                "Get Artwork"
              )}
            </Button>
          </form>

          {artwork && (
            <div className="mt-6 space-y-6">
              <div className="rounded-lg bg-white/5 p-4 backdrop-blur-sm">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-medium">{artwork.name}</h3>
                  {artwork.artists && <p className="text-sm text-gray-300">{artwork.artists}</p>}
                  <p className="text-xs text-gray-400">{artwork.type}</p>
                </div>

                <div className="flex justify-center mb-4">
                  <div className="relative w-64 h-64 shadow-lg">
                    <Image
                      src={getPreviewImageUrl(artwork) || "/placeholder.svg"}
                      alt={`${artwork.name} artwork`}
                      fill
                      className="object-cover rounded-md"
                      sizes="(max-width: 768px) 100vw, 256px"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium mb-2">Available Sizes:</h4>
                  {artwork.images.map((image, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-md bg-white/5 hover:bg-white/10"
                    >
                      <div>
                        <p className="text-sm">
                          {image.width}x{image.height} ({formatFileSize(image.url)})
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href={image.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownload(image.url, artwork.name)}>
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {artwork.source === "spotify" && (
                  <div className="mt-4 p-3 rounded-md bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-green-300">
                      <BadgeCheck className="h-4 w-4 inline-block mr-1" />
                      <strong>Pro Tip:</strong> Try using Apple Music links for higher quality artwork up to 3000x3000
                      pixels.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        {artwork && (
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
