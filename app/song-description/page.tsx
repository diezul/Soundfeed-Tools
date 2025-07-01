"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Sparkles, SendHorizontal, Copy, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { generateIntelligentDescription } from "../lib/description-generator"

// Define message types
type MessageRole = "system" | "user" | "assistant" | "info" | "error" | "selection"

interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  selections?: string[]
  selectedOption?: string
}

// Define the steps in our conversation
type Step =
  | "welcome"
  | "release_title"
  | "release_type"
  | "song_title"
  | "artist_name"
  | "featuring_question"
  | "featuring_artists"
  | "genre"
  | "language"
  | "mood"
  | "inspiration"
  | "previous_releases_question"
  | "previous_releases_details"
  | "additional_info"
  | "generating"
  | "complete"

export default function SongDescriptionPage() {
  // State for the chat interface
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step>("welcome")
  const [songInfo, setSongInfo] = useState({
    release_title: "",
    release_type: "", // "single", "album", "ep"
    song_title: "",
    artist_name: "",
    has_featuring: "", // "yes", "no"
    featuring_artists: "",
    genre: "",
    language: "",
    mood: "",
    inspiration: "",
    has_previous_releases: "", // "yes", "no"
    previous_releases_details: "",
    additional_info: "",
  })
  const [finalDescription, setFinalDescription] = useState("")
  const [characterCount, setCharacterCount] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Initialize the chat with welcome message
  useEffect(() => {
    const initialMessage: Message = {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Hi! I'll help you create a professional song description. Let's start with some questions about your release. What is the title of the release?",
      timestamp: new Date(),
    }
    setMessages([initialMessage])
    setCurrentStep("release_title")
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when available
  useEffect(() => {
    if (
      !isProcessing &&
      inputRef.current &&
      currentStep !== "release_type" &&
      currentStep !== "featuring_question" &&
      currentStep !== "previous_releases_question"
    ) {
      inputRef.current.focus()
    }
  }, [isProcessing, currentStep])

  // Handle selection for multiple choice questions
  const handleSelection = (selection: string, messageId: string) => {
    console.log("Selection clicked:", selection, "Message ID:", messageId, "Current step:", currentStep)

    // Update the message to show the selection
    setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, selectedOption: selection } : msg)))

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: selection,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Process the selection immediately
    processSelection(selection)
  }

  const processSelection = (selection: string) => {
    console.log("Processing selection:", selection, "for step:", currentStep)

    switch (currentStep) {
      case "release_type":
        console.log("Setting release type to:", selection.toLowerCase())
        setSongInfo((prev) => ({ ...prev, release_type: selection.toLowerCase() }))

        if (selection.toLowerCase() === "single") {
          console.log("Single selected, going to artist name")
          addAssistantMessage("What is the name of the artist for this song?")
          setCurrentStep("artist_name")
        } else {
          console.log("Album/EP selected, going to song title")
          addAssistantMessage("What is the title of the song you want to describe?")
          setCurrentStep("song_title")
        }
        break

      case "featuring_question":
        console.log("Setting featuring to:", selection.toLowerCase())
        setSongInfo((prev) => ({ ...prev, has_featuring: selection.toLowerCase() }))

        if (selection.toLowerCase() === "yes") {
          addAssistantMessage("What is the name of the featuring artists?")
          setCurrentStep("featuring_artists")
        } else {
          addAssistantMessage("What genre would you categorize this song as? (e.g., Pop, Hip-Hop, Rock, Electronic)")
          setCurrentStep("genre")
        }
        break

      case "previous_releases_question":
        console.log("Setting previous releases to:", selection.toLowerCase())
        setSongInfo((prev) => ({ ...prev, has_previous_releases: selection.toLowerCase() }))

        if (selection.toLowerCase() === "yes") {
          addAssistantMessage("What is the title of that release and how did it become notable?")
          setCurrentStep("previous_releases_details")
        } else {
          addAssistantMessage(
            "Any additional information about the song you'd like to include? (Who produced the instrumental, unique elements, etc.)",
          )
          setCurrentStep("additional_info")
        }
        break

      default:
        console.log("Unknown step for selection:", currentStep)
    }
  }

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsProcessing(true)

    try {
      // Process the user's input based on the current step
      switch (currentStep) {
        case "release_title":
          setSongInfo((prev) => ({ ...prev, release_title: input.trim() }))
          addSelectionMessage("Is this a single, album, or EP?", ["Single", "Album", "EP"])
          setCurrentStep("release_type")
          break

        case "song_title":
          setSongInfo((prev) => ({ ...prev, song_title: input.trim() }))
          addAssistantMessage("What is the name of the artist for this song?")
          setCurrentStep("artist_name")
          break

        case "artist_name":
          const updatedSongInfo = { ...songInfo, artist_name: input.trim() }
          setSongInfo(updatedSongInfo)
          const songTitle = updatedSongInfo.song_title || updatedSongInfo.release_title
          addSelectionMessage(`Does "${songTitle}" have any featuring artists or is it just ${input.trim()}?`, [
            "Yes",
            "No",
          ])
          setCurrentStep("featuring_question")
          break

        case "featuring_artists":
          setSongInfo((prev) => ({ ...prev, featuring_artists: input.trim() }))
          addAssistantMessage("What genre would you categorize this song as? (e.g., Pop, Hip-Hop, Rock, Electronic)")
          setCurrentStep("genre")
          break

        case "genre":
          setSongInfo((prev) => ({ ...prev, genre: input.trim() }))
          addAssistantMessage("What language are the lyrics in? (e.g., English, Romanian, Spanish, etc.)")
          setCurrentStep("language")
          break

        case "language":
          setSongInfo((prev) => ({ ...prev, language: input.trim() }))
          addAssistantMessage(
            "How would you describe the mood or emotional tone of the song? (e.g., Energetic, Melancholic, Uplifting, Sad)",
          )
          setCurrentStep("mood")
          break

        case "mood":
          setSongInfo((prev) => ({ ...prev, mood: input.trim() }))
          addAssistantMessage("What inspired the creation of this song?")
          setCurrentStep("inspiration")
          break

        case "inspiration":
          setSongInfo((prev) => ({ ...prev, inspiration: input.trim() }))
          addSelectionMessage("Does the artist have any notable previous releases or a signature sound?", ["Yes", "No"])
          setCurrentStep("previous_releases_question")
          break

        case "previous_releases_details":
          setSongInfo((prev) => ({ ...prev, previous_releases_details: input.trim() }))
          addAssistantMessage(
            "Any additional information about the song you'd like to include? (Who produced the instrumental, unique elements, etc.)",
          )
          setCurrentStep("additional_info")
          break

        case "additional_info":
          setSongInfo((prev) => ({ ...prev, additional_info: input.trim() }))
          addSystemMessage("Analyzing your responses and crafting a unique description...")
          await generateDescription()
          break
      }
    } catch (error) {
      console.error("Error processing message:", error)
      addErrorMessage("Sorry, I encountered an error. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Generate the final description using the new intelligent system
  const generateDescription = async () => {
    setCurrentStep("generating")

    const rawInfo = {
      song_title: songInfo.song_title || songInfo.release_title,
      artist_name: songInfo.artist_name,
      genre: songInfo.genre,
      mood: songInfo.mood,
      inspiration: songInfo.inspiration,
      previous_releases_details: songInfo.previous_releases_details,
      additional_info: songInfo.additional_info,
    }

    const result = await generateIntelligentDescription(rawInfo)

    if (result.success && result.description) {
      setFinalDescription(result.description)
      setCharacterCount(result.description.length)
      addAssistantMessage("Here is your unique, AI-crafted description:")
      addAssistantMessage(result.description)
      addSystemMessage(`Character count: ${result.description.length}/500 ✓`)
      setCurrentStep("complete")
    } else {
      addErrorMessage(result.error || "Failed to generate a description. Please try again with different details.")
      setCurrentStep("additional_info") // Allow user to retry
    }
  }

  // Helper to add assistant messages
  const addAssistantMessage = (content: string) => {
    const message: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, message])
  }

  // Helper to add selection messages
  const addSelectionMessage = (content: string, selections: string[]) => {
    const messageId = `selection-${Date.now()}`
    const message: Message = {
      id: messageId,
      role: "selection",
      content,
      timestamp: new Date(),
      selections,
    }
    setMessages((prev) => [...prev, message])
  }

  // Helper to add system messages
  const addSystemMessage = (content: string) => {
    const message: Message = {
      id: `system-${Date.now()}`,
      role: "info",
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, message])
  }

  // Helper to add error messages
  const addErrorMessage = (content: string) => {
    const message: Message = {
      id: `error-${Date.now()}`,
      role: "error",
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, message])
  }

  // Handle copying the description
  const handleCopy = () => {
    navigator.clipboard.writeText(finalDescription)
    toast({
      title: "Copied!",
      description: "Description copied to clipboard.",
    })
  }

  // Handle starting over
  const handleReset = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: "👋 Let's create a new song description. What is the title of the release?",
        timestamp: new Date(),
      },
    ])
    setSongInfo({
      release_title: "",
      release_type: "",
      song_title: "",
      artist_name: "",
      has_featuring: "",
      featuring_artists: "",
      genre: "",
      language: "",
      mood: "",
      inspiration: "",
      has_previous_releases: "",
      previous_releases_details: "",
      additional_info: "",
    })
    setFinalDescription("")
    setCharacterCount(0)
    setCurrentStep("release_title")
    setInput("")
  }

  // Handle key press for sending messages
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isProcessing) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Get badge color based on character count
  const getBadgeVariant = () => {
    if (characterCount > 500 || characterCount < 490) return "destructive"
    return "default"
  }

  // Calculate progress percentage for character count
  const getProgressPercentage = () => {
    return Math.min(100, (characterCount / 500) * 100)
  }

  return (
    <div className="container max-w-4xl py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Song Description Generator</h1>
          <p className="text-muted-foreground">Create professional song descriptions with AI assistance</p>
        </div>
        <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
          <Sparkles className="h-3 w-3 mr-1" />
          Soundfeed A.I.
        </Badge>
      </div>

      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src="/ai-assistant.png" alt="AI" />
              <AvatarFallback className="bg-purple-500 text-white">AI</AvatarFallback>
            </Avatar>
            Description Assistant
          </CardTitle>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                  {(message.role === "assistant" || message.role === "selection") && (
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src="/ai-assistant.png" alt="AI" />
                      <AvatarFallback className="bg-purple-500 text-white">AI</AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 max-w-[80%]",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : message.role === "assistant" || message.role === "selection"
                          ? "bg-muted"
                          : message.role === "error"
                            ? "bg-red-500/20 text-red-700 dark:text-red-300"
                            : "bg-amber-500/20 text-amber-700 dark:text-amber-300",
                    )}
                  >
                    {message.role === "error" && <AlertCircle className="h-4 w-4 mb-1" />}
                    <p className="whitespace-pre-wrap mb-2">{message.content}</p>

                    {message.role === "selection" && message.selections && !message.selectedOption && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.selections.map((selection) => (
                          <Button
                            key={selection}
                            onClick={() => {
                              console.log("Button clicked for selection:", selection)
                              handleSelection(selection, message.id)
                            }}
                            disabled={isProcessing}
                            size="sm"
                            variant="outline"
                            className="bg-white text-black border-gray-300 hover:bg-gray-100"
                          >
                            {selection}
                          </Button>
                        ))}
                      </div>
                    )}

                    {message.role === "selection" && message.selectedOption && (
                      <div className="mt-2 text-sm text-muted-foreground">Selected: {message.selectedOption} ✓</div>
                    )}
                  </div>

                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 ml-2">
                      <AvatarImage src="/default-user.png" alt="User" />
                      <AvatarFallback>You</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          {currentStep !== "release_type" &&
            currentStep !== "featuring_question" &&
            currentStep !== "previous_releases_question" && (
              <div className="flex w-full items-center space-x-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={
                    isProcessing
                      ? "Please wait..."
                      : currentStep === "complete"
                        ? "Start over to create a new description"
                        : "Type your message..."
                  }
                  disabled={isProcessing || currentStep === "complete"}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isProcessing || !input.trim() || currentStep === "complete"}
                  size="icon"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                </Button>
              </div>
            )}

          {currentStep === "complete" && finalDescription && (
            <div className="w-full space-y-4">
              <div className="flex flex-col gap-2 w-full">
                <div className="flex justify-between items-center">
                  <Badge variant={getBadgeVariant()}>
                    {characterCount} characters {characterCount >= 490 && characterCount <= 500 ? "✓" : "⚠️"}
                  </Badge>
                  <div className="space-x-2">
                    <Button onClick={handleCopy} size="sm" variant="secondary">
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button onClick={handleReset} size="sm" variant="outline">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      New Description
                    </Button>
                  </div>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
