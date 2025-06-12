"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Copy, Sparkles, Send, Bot, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { generateSongDescription } from "../actions/ai-description"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

interface FormData {
  songTitle: string
  artistInfo: string
  promotionInfo: string
  genre: string
  mood: string
  additionalInfo: string
}

export default function SongDescription() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content:
        "Welcome to Song Description AI! I'll help you create a compelling description for your song. Please provide the details below to get started.",
    },
  ])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    songTitle: "",
    artistInfo: "",
    promotionInfo: "",
    genre: "",
    mood: "",
    additionalInfo: "",
  })
  const [currentStep, setCurrentStep] = useState<keyof FormData>("songTitle")
  const [description, setDescription] = useState<string | null>(null)
  const [characterCount, setCharacterCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Update character count when description changes
  useEffect(() => {
    if (description) {
      setCharacterCount(description.length)
    } else {
      setCharacterCount(0)
    }
  }, [description])

  // Focus textarea when step changes
  useEffect(() => {
    if (textareaRef.current && !isGenerating) {
      textareaRef.current.focus()
    }
  }, [currentStep, isGenerating])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const addMessage = (role: "user" | "assistant" | "system", content: string) => {
    setMessages((prev) => [...prev, { role, content }])
  }

  const getNextStep = (currentStep: keyof FormData): keyof FormData | null => {
    const steps: (keyof FormData)[] = ["songTitle", "artistInfo", "promotionInfo", "genre", "mood", "additionalInfo"]
    const currentIndex = steps.indexOf(currentStep)

    if (currentIndex < steps.length - 1) {
      return steps[currentIndex + 1]
    }

    return null
  }

  const getPromptForStep = (step: keyof FormData): string => {
    switch (step) {
      case "songTitle":
        return "What's the title of your song?"
      case "artistInfo":
        return "Tell me about the artist (name, background, style, previous releases, etc.):"
      case "promotionInfo":
        return "How are you promoting this song? (TikTok, concerts, playlists, etc.)"
      case "genre":
        return "What genre(s) does your song fall under?"
      case "mood":
        return "Describe the mood or vibe of your song:"
      case "additionalInfo":
        return "Any additional information you'd like to include? (inspiration, production details, featured artists, etc.)"
      default:
        return ""
    }
  }

  const handleSubmitStep = () => {
    // Don't allow submission while generating
    if (isGenerating) return

    const currentValue = formData[currentStep]

    if (!currentValue.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide the requested information before continuing.",
        variant: "destructive",
      })
      return
    }

    // Add user message
    addMessage("user", currentValue)

    // Get next step
    const nextStep = getNextStep(currentStep)

    if (nextStep) {
      // Add assistant message with next prompt
      const nextPrompt = getPromptForStep(nextStep)
      addMessage("assistant", nextPrompt)
      setCurrentStep(nextStep)
    } else {
      // This is the last step, generate the description
      handleGenerateDescription()
    }
  }

  const handleGenerateDescription = async () => {
    setLoading(true)
    setErrorMessage(null)
    setIsGenerating(true)

    // Store the current form data for the API call
    const currentFormData = { ...formData }

    // Clear the current input field
    setFormData((prev) => ({
      ...prev,
      [currentStep]: "",
    }))

    try {
      // Add a message to show we're generating
      addMessage("assistant", "Generating your song description... This may take a moment.")

      const result = await generateSongDescription(currentFormData)

      if (result.success && result.description) {
        setDescription(result.description)
        addMessage(
          "assistant",
          `Here's your song description (${result.description.length} characters):\n\n${result.description}`,
        )
      } else {
        const errorMsg = result.error || "Failed to generate description. Please try again."
        setErrorMessage(errorMsg)
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        })
        addMessage("assistant", `Error: ${errorMsg}`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred. Please try again."
      setErrorMessage(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
      addMessage("assistant", `Error: ${errorMsg}`)
    } finally {
      setLoading(false)
      setIsGenerating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Don't allow submission via Enter key while generating
    if (isGenerating) return

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmitStep()
    }
  }

  const copyDescription = () => {
    if (description) {
      navigator.clipboard.writeText(description)
      toast({
        title: "Copied to clipboard",
        description: "Song description has been copied to clipboard",
      })
    }
  }

  const resetChat = () => {
    setMessages([
      {
        role: "system",
        content:
          "Welcome to Song Description AI! I'll help you create a compelling description for your song. Please provide the details below to get started.",
      },
    ])
    setFormData({
      songTitle: "",
      artistInfo: "",
      promotionInfo: "",
      genre: "",
      mood: "",
      additionalInfo: "",
    })
    setCurrentStep("songTitle")
    setDescription(null)
    setCharacterCount(0)
    setErrorMessage(null)
    setIsGenerating(false)

    // Add first prompt
    setTimeout(() => {
      addMessage("assistant", getPromptForStep("songTitle"))
    }, 100)
  }

  // Add first prompt if it doesn't exist
  useEffect(() => {
    if (messages.length === 1) {
      addMessage("assistant", getPromptForStep("songTitle"))
    }
  }, [])

  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-3xl backdrop-blur-md bg-white/10 border-white/20 text-white">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2">
            <CardTitle className="text-2xl">Song Description</CardTitle>
            <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              <Sparkles className="h-3 w-3 mr-1" />
              Soundfeed A.I.
            </Badge>
          </div>
          <CardDescription className="text-gray-300">
            Generate compelling song descriptions for distribution platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-black/20 rounded-lg p-4 h-[300px] overflow-y-auto mb-4">
            {messages.map(
              (message, index) =>
                message.role !== "system" && (
                  <div
                    key={index}
                    className={`mb-4 flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`flex max-w-[80%] ${
                        message.role === "assistant"
                          ? "bg-gray-800/70 rounded-tr-lg rounded-br-lg rounded-bl-lg"
                          : "bg-purple-600/30 rounded-tl-lg rounded-tr-lg rounded-bl-lg"
                      } p-3`}
                    >
                      <div className="mr-2 mt-0.5">
                        {message.role === "assistant" ? (
                          <Bot className="h-5 w-5 text-purple-400" />
                        ) : (
                          <User className="h-5 w-5 text-gray-300" />
                        )}
                      </div>
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    </div>
                  </div>
                ),
            )}
            <div ref={messagesEndRef} />
          </div>

          {errorMessage && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-md p-3 text-sm text-red-300">
              <p className="font-medium">Error Details:</p>
              <p className="mt-1">{errorMessage}</p>
            </div>
          )}

          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              name={currentStep}
              value={formData[currentStep]}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Enter ${currentStep.replace(/([A-Z])/g, " $1").toLowerCase()}`}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 flex-1 min-h-[80px] resize-none"
              disabled={isGenerating}
            />
            <Button
              onClick={handleSubmitStep}
              disabled={isGenerating || loading || !formData[currentStep].trim()}
              className="mb-[1px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          {description && (
            <div className="mt-6 rounded-lg bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Generated Description</h3>
                <span className={`text-sm ${characterCount > 500 ? "text-red-400" : "text-gray-400"}`}>
                  {characterCount}/500 characters
                </span>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-wrap mb-4">{description}</p>
              <Button variant="outline" onClick={copyDescription}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Description
              </Button>
            </div>
          )}

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="suggestions" className="border-white/10">
              <AccordionTrigger className="text-sm text-gray-300">Need help with your responses?</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-sm text-gray-400">
                  <div>
                    <h4 className="font-medium text-gray-300">Song Title</h4>
                    <p>Simply provide the title of your song.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-300">Artist Information</h4>
                    <p>Include the artist name, background, style, previous releases, and any notable achievements.</p>
                    <p className="text-xs italic mt-1">
                      Example: "RAVA is an emerging electronic producer from Berlin, known for blending ambient textures
                      with hard-hitting beats. Previously released the EP 'Midnight Hours' which gained support from
                      major DJs."
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-300">Promotion Information</h4>
                    <p>
                      Mention how you're promoting the song - TikTok campaigns, live performances, playlist placements,
                      etc.
                    </p>
                    <p className="text-xs italic mt-1">
                      Example: "The song has been featured in several TikTok videos with over 50K views and was
                      premiered at the Underground Festival last month."
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-300">Genre</h4>
                    <p>List the primary and secondary genres of your song.</p>
                    <p className="text-xs italic mt-1">Example: "Deep House with elements of Ambient and Techno"</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-300">Mood</h4>
                    <p>Describe the emotional tone and atmosphere of your song.</p>
                    <p className="text-xs italic mt-1">
                      Example: "Melancholic yet uplifting, with a dreamy atmosphere that builds to an energetic climax"
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-300">Additional Information</h4>
                    <p>
                      Include any other details like inspiration, production techniques, featured artists, or special
                      elements.
                    </p>
                    <p className="text-xs italic mt-1">
                      Example: "Inspired by late-night drives through the city. Features analog synths recorded through
                      vintage equipment and vocals from featured artist Luna."
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="outline" onClick={resetChat}>
            Start Over
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
