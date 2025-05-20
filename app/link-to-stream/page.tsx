"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Copy, Music, Youtube } from "lucide-react"
import { generateStreamLinks } from "../actions"

interface StreamLinks {
  spotify: {
    url: string
    title: string
  }
  youtube: {
    url: string
    title: string
  }
}

export default function LinkToStream() {
  const [artistName, setArtistName] = useState("")
  const [songName, setSongName] = useState("")
  const [loading, setLoading] = useState(false)
  const [links, setLinks] = useState<StreamLinks | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await handleGenerateLinks()
  }

  const handleGenerateLinks = async () => {
    if (!artistName || !songName) {
      toast({
        title: "Missing information",
        description: "Please enter both artist name and song name",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const result = await generateStreamLinks(artistName, songName)

      if (result.success && result.data) {
        setLinks(result.data)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to generate links. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate links. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, service: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: `${service} link has been copied to clipboard`,
    })
  }

  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-md backdrop-blur-md bg-white/10 border-white/20 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Link2Stream</CardTitle>
          <CardDescription className="text-gray-300">Generate streaming links for songs</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <Input
              type="text"
              placeholder="Artist Name"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
            />
            <Input
              type="text"
              placeholder="Song Name"
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </Button>
          </form>

          {links && (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center">
                    <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#1DB954]/20 flex-shrink-0">
                      <Music className="h-5 w-5 text-[#1DB954]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium">Spotify</h3>
                      <p className="text-sm text-gray-300 truncate">{links.spotify.title}</p>
                      <p className="text-xs text-gray-400 truncate max-w-full">{links.spotify.url}</p>
                    </div>
                  </div>
                  <div className="flex w-full">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 mr-2"
                      onClick={() => copyToClipboard(links.spotify.url, "Spotify")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 flex-1 bg-[#1DB954]/20 hover:bg-[#1DB954]/30 border-[#1DB954]/30"
                      asChild
                    >
                      <a href={links.spotify.url} target="_blank" rel="noopener noreferrer">
                        Open Link
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center">
                    <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#FF0000]/20 flex-shrink-0">
                      <Youtube className="h-5 w-5 text-[#FF0000]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium">YouTube</h3>
                      <p className="text-sm text-gray-300 truncate">{links.youtube.title}</p>
                      <p className="text-xs text-gray-400 truncate max-w-full">{links.youtube.url}</p>
                    </div>
                  </div>
                  <div className="flex w-full">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 mr-2"
                      onClick={() => copyToClipboard(links.youtube.url, "YouTube")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 flex-1 bg-[#FF0000]/20 hover:bg-[#FF0000]/30 border-[#FF0000]/30"
                      asChild
                    >
                      <a href={links.youtube.url} target="_blank" rel="noopener noreferrer">
                        Open Link
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
