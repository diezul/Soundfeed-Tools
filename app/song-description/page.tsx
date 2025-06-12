"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Sparkles, Copy, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { generateSongDescription } from "../actions/ai-description"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SongDescriptionPage() {
  const [songTitle, setSongTitle] = useState("")
  const [artistName, setArtistName] = useState("")
  const [genre, setGenre] = useState("")
  const [mood, setMood] = useState("")
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [description, setDescription] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [characterCount, setCharacterCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  // Update character count when description changes
  useEffect(() => {
    setCharacterCount(description.length)
  }, [description])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!songTitle || !artistName) {
      toast({
        title: "Missing information",
        description: "Please provide at least the song title and artist name.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGenerating(true)
      setError(null)
      setDescription("Generating your song description... This may take a moment.")

      const result = await generateSongDescription(artistName, songTitle, genre, mood, additionalInfo)

      // Only update if we're still in generating state (user hasn't cancelled)
      if (isGenerating) {
        setDescription(result)
        toast({
          title: "Description generated!",
          description: "Your song description has been created successfully.",
        })
      }
    } catch (error) {
      console.error("Error generating description:", error)
      setDescription("")

      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred. Please try again."
      setError(errorMessage)

      toast({
        title: "Generation failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(description)
    toast({
      title: "Copied!",
      description: "Description copied to clipboard.",
    })
  }

  const handleCancel = () => {
    setIsGenerating(false)
    setDescription("")
    setError(null)
  }

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Song Description Generator</h1>
          <p className="text-muted-foreground">Generate professional song descriptions powered by AI</p>
        </div>
        <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
          <Sparkles className="h-3 w-3 mr-1" />
          Soundfeed A.I.
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-2">
              <p className="text-sm">
                Make sure the OpenRouter API key is properly configured in the environment variables.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Song Information</CardTitle>
            <CardDescription>Fill in the details about your song to generate a description.</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="description-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="song-title">Song Title *</Label>
                <Input
                  id="song-title"
                  ref={inputRef}
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="Enter song title"
                  disabled={isGenerating}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="artist-name">Artist Name *</Label>
                <Input
                  id="artist-name"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Enter artist name"
                  disabled={isGenerating}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="e.g., Pop, Hip-Hop, Rock"
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mood">Mood</Label>
                <Input
                  id="mood"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  placeholder="e.g., Energetic, Melancholic, Uplifting"
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional-info">Additional Information</Label>
                <Textarea
                  id="additional-info"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Any other details about the song, influences, or specific elements to highlight"
                  disabled={isGenerating}
                  className="min-h-[100px]"
                />
              </div>
            </form>
          </CardContent>
          <CardFooter>
            {isGenerating ? (
              <div className="w-full flex gap-2">
                <Button disabled className="flex-1">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button type="submit" form="description-form" disabled={!songTitle || !artistName} className="w-full">
                Generate Description
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Description</CardTitle>
            <CardDescription className="flex items-center justify-between">
              <span>Your professional song description will appear here</span>
              {description && description !== "Generating your song description... This may take a moment." && (
                <Badge variant={characterCount > 500 ? "destructive" : "outline"}>
                  {characterCount}/500 characters
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-md border min-h-[250px] ${description ? "bg-muted/50" : "bg-muted/20"}`}>
              {description ? (
                <p className="whitespace-pre-wrap">
                  {description === "Generating your song description... This may take a moment." ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {description}
                    </span>
                  ) : (
                    description
                  )}
                </p>
              ) : (
                <p className="text-muted-foreground text-center italic mt-12">
                  Fill in the form and click "Generate Description" to create your song description
                </p>
              )}
            </div>
          </CardContent>
          {description && description !== "Generating your song description... This may take a moment." && (
            <CardFooter>
              <Button onClick={handleCopy} className="w-full" variant="secondary">
                <Copy className="mr-2 h-4 w-4" />
                Copy to Clipboard
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
