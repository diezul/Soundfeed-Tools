"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Copy, ExternalLink } from "lucide-react"
import Image from "next/image"
import { fetchYouTubeChannelId } from "../actions"

interface ChannelInfo {
  id: string
  title: string
  url: string
  imageUrl: string
}

export default function ChannelIdFinder() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await getChannelId()
  }

  const getChannelId = async () => {
    const regex = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/@([a-zA-Z0-9-_]+)/
    const match = url.match(regex)

    if (!match || !match[1]) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube channel URL",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    const username = match[1]

    try {
      const result = await fetchYouTubeChannelId(username)

      if (result.success && result.data) {
        setChannelInfo(result.data)
      } else {
        toast({
          title: "Error",
          description: result.error || "There might be a problem with YouTube's servers",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There might be a problem with YouTube's servers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (channelInfo) {
      navigator.clipboard.writeText(channelInfo.url)
      toast({
        title: "Copied to clipboard",
        description: "Channel URL has been copied to clipboard",
      })
    }
  }

  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-2xl backdrop-blur-md bg-white/10 border-white/20 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">YouTube Channel ID Finder</CardTitle>
          <CardDescription className="text-gray-300">
            Enter a YouTube channel URL to find its channel ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <Input
              type="url"
              placeholder="Enter YouTube Channel URL (e.g., https://youtube.com/@channelname)"
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
                "Show Channel ID"
              )}
            </Button>
          </form>

          {channelInfo && (
            <div className="mt-6 rounded-lg bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-4">
                <Image
                  src={channelInfo.imageUrl || "/placeholder.svg"}
                  alt={channelInfo.title}
                  width={50}
                  height={50}
                  className="rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium truncate">{channelInfo.title}</h3>
                  <p className="text-sm text-gray-300 truncate">{channelInfo.url}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        {channelInfo && (
          <CardFooter className="flex justify-center space-x-2">
            <Button variant="outline" onClick={copyToClipboard}>
              <Copy className="mr-2 h-4 w-4" />
              Copy URL
            </Button>
            <Button variant="outline" asChild>
              <a href={channelInfo.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Channel
              </a>
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
