"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Copy, RefreshCw, Info } from "lucide-react"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchISRC, fetchUPC } from "../actions/metadata"

interface MetadataInfo {
  title: string
  artist: string
  imageUrl: string
  code: string
  type: "ISRC" | "UPC"
  releaseDate?: string
}

export default function IsrcUpcFinder() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [metadata, setMetadata] = useState<MetadataInfo | null>(null)
  const [activeTab, setActiveTab] = useState("isrc")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await getMetadata()
  }

  const getMetadata = async () => {
    if (!url) {
      toast({
        title: "Missing URL",
        description: "Please enter a Spotify URL",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      let result

      if (activeTab === "isrc") {
        result = await fetchISRC(url)
      } else {
        result = await fetchUPC(url)
      }

      if (result.success && result.data) {
        setMetadata(result.data)
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to fetch ${activeTab.toUpperCase()}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch ${activeTab.toUpperCase()}. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setUrl("")
    setMetadata(null)
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setUrl("")
    setMetadata(null)
  }

  // Get placeholder text based on active tab
  const getPlaceholderText = () => {
    if (activeTab === "isrc") {
      return "Enter Spotify track URL (e.g., https://open.spotify.com/track/...)"
    } else {
      return "Enter Spotify album URL (e.g., https://open.spotify.com/album/...)"
    }
  }

  // Copy code to clipboard
  const copyToClipboard = () => {
    if (metadata) {
      navigator.clipboard.writeText(metadata.code)
      toast({
        title: "Copied to clipboard",
        description: `${metadata.type} code has been copied to clipboard`,
      })
    }
  }

  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-2xl backdrop-blur-md bg-white/10 border-white/20 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">ISRC & UPC Finder</CardTitle>
          <CardDescription className="text-gray-300">
            Find ISRC codes for tracks and UPC codes for albums
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="isrc">ISRC (Tracks)</TabsTrigger>
              <TabsTrigger value="upc">UPC (Albums)</TabsTrigger>
            </TabsList>
            <TabsContent value="isrc" className="mt-4">
              <p className="text-sm text-gray-300 mb-2">
                <Info className="h-4 w-4 inline-block mr-1" />
                ISRC (International Standard Recording Code) uniquely identifies sound recordings.
              </p>
            </TabsContent>
            <TabsContent value="upc" className="mt-4">
              <p className="text-sm text-gray-300 mb-2">
                <Info className="h-4 w-4 inline-block mr-1" />
                UPC (Universal Product Code) uniquely identifies commercial products like albums.
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
                `Get ${activeTab.toUpperCase()}`
              )}
            </Button>
          </form>

          {metadata && (
            <div className="mt-6 space-y-6">
              <div className="rounded-lg bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="relative w-24 h-24 flex-shrink-0 shadow-lg rounded-md overflow-hidden">
                    <Image
                      src={metadata.imageUrl || "/placeholder.svg"}
                      alt={`${metadata.title} artwork`}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium truncate">{metadata.title}</h3>
                    <p className="text-sm text-gray-300 truncate">{metadata.artist}</p>
                    {metadata.releaseDate && <p className="text-xs text-gray-400">Released: {metadata.releaseDate}</p>}
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-md bg-white/5">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-300">{metadata.type} Code:</p>
                      <p className="text-lg font-mono font-medium tracking-wider">{metadata.code}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={copyToClipboard}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-400">
                  <p>
                    {metadata.type === "ISRC"
                      ? "ISRC codes are used to identify specific recordings across different platforms and formats."
                      : "UPC codes are used to identify commercial products like albums across different retailers."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        {metadata && (
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
