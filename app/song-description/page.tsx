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
import { generateAIResponse } from "../lib/ai-client"

// Define message types
type MessageRole = "system" | "user" | "assistant" | "info" | "error"

interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
}

// Define the steps in our conversation
type Step =
  | "welcome"
  | "title"
  | "artist"
  | "genre"
  | "mood"
  | "inspiration"
  | "previous_work"
  | "album_context"
  | "collaborations"
  | "additional"
  | "generating"
  | "complete"

export default function SongDescriptionPage() {
  // State for the chat interface
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step>("welcome")
  const [songInfo, setSongInfo] = useState({
    title: "",
    artist: "",
    genre: "",
    mood: "",
    inspiration: "",
    previous_work: "",
    album_context: "",
    collaborations: "",
    additional: "",
  })
  const [finalDescription, setFinalDescription] = useState("")
  const [characterCount, setCharacterCount] = useState(0)
  const [retryCount, setRetryCount] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Initialize the chat with welcome message
  useEffect(() => {
    const initialMessage: Message = {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Hi! I'll help you create a professional song description under 500 characters. Let's start with the song title. What's the name of your song?",
      timestamp: new Date(),
    }
    setMessages([initialMessage])
    setCurrentStep("title")
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when available
  useEffect(() => {
    if (!isProcessing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isProcessing, currentStep])

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
        case "title":
          setSongInfo((prev) => ({ ...prev, title: input.trim() }))
          addAssistantMessage("Great! Now, who's the artist?")
          setCurrentStep("artist")
          break

        case "artist":
          setSongInfo((prev) => ({ ...prev, artist: input.trim() }))
          addAssistantMessage("What genre would you categorize this song as? (e.g., Pop, Hip-Hop, Rock, Electronic)")
          setCurrentStep("genre")
          break

        case "genre":
          setSongInfo((prev) => ({ ...prev, genre: input.trim() }))
          addAssistantMessage(
            "How would you describe the mood or emotional tone of the song? (e.g., Energetic, Melancholic, Uplifting, Introspective)",
          )
          setCurrentStep("mood")
          break

        case "mood":
          setSongInfo((prev) => ({ ...prev, mood: input.trim() }))
          addAssistantMessage(
            "What inspired the creation of this song? (Skip this question by typing 'skip' if you prefer)",
          )
          setCurrentStep("inspiration")
          break

        case "inspiration":
          if (input.trim().toLowerCase() !== "skip") {
            setSongInfo((prev) => ({ ...prev, inspiration: input.trim() }))
          }
          addAssistantMessage(
            "Does the artist have any notable previous releases or a signature sound? (Type 'skip' if not applicable)",
          )
          setCurrentStep("previous_work")
          break

        case "previous_work":
          if (input.trim().toLowerCase() !== "skip") {
            setSongInfo((prev) => ({ ...prev, previous_work: input.trim() }))
          }
          addAssistantMessage("Is this song part of an upcoming album or EP? (Type 'skip' if not applicable)")
          setCurrentStep("album_context")
          break

        case "album_context":
          if (input.trim().toLowerCase() !== "skip") {
            setSongInfo((prev) => ({ ...prev, album_context: input.trim() }))
          }
          addAssistantMessage(
            "Are there any featured artists or notable collaborators on this track? (Type 'skip' if none)",
          )
          setCurrentStep("collaborations")
          break

        case "collaborations":
          if (input.trim().toLowerCase() !== "skip") {
            setSongInfo((prev) => ({ ...prev, collaborations: input.trim() }))
          }
          addAssistantMessage(
            "Any additional information about the song you'd like to include? (production details, unique elements, etc.)",
          )
          setCurrentStep("additional")
          break

        case "additional":
          if (input.trim().toLowerCase() !== "skip") {
            setSongInfo((prev) => ({ ...prev, additional: input.trim() }))
          }
          addSystemMessage("Thanks for providing all this information! Generating your description now...")
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

  // Generate the final description
  const generateDescription = async () => {
    setCurrentStep("generating")
    setRetryCount(0)

    try {
      // Create the conversation for the AI
      const aiMessages = [
        {
          role: "system",
          content: `You are a professional music copywriter who creates engaging song descriptions.
          Create a captivating song description that is EXACTLY between 480-500 characters.
          Your description must be complete and not cut off mid-sentence.
          Do not include any explanations, notes, or character counts in your response.
          Just provide the description text directly.
          Make sure your description has a proper ending and doesn't feel cut off.
          Do not use ellipses (...) at the end of your description.
          Count your characters carefully before finalizing.
          IMPORTANT: You must return a non-empty description.`,
        },
        {
          role: "user",
          content: `Write a professional song description for "${songInfo.title}" by ${songInfo.artist}.
          Genre: ${songInfo.genre || "Not specified"}
          Mood: ${songInfo.mood || "Not specified"}
          Inspiration: ${songInfo.inspiration || "Not specified"}
          Previous work: ${songInfo.previous_work || "Not specified"}
          Album context: ${songInfo.album_context || "Not specified"}
          Collaborations: ${songInfo.collaborations || "Not specified"}
          Additional information: ${songInfo.additional || "None provided"}
          
          IMPORTANT: The description MUST be between 480-500 characters total, with a proper ending. Do not use ellipses (...) at the end. Your response must contain actual text, not be empty.`,
        },
      ]

      // Call the AI API
      const description = await generateAIResponse(aiMessages)

      // Validate the description
      if (!description || description.length < 10) {
        throw new Error("Received empty or invalid description")
      }

      setFinalDescription(description)
      setCharacterCount(description.length)

      addAssistantMessage("Here's your song description:")
      addAssistantMessage(description)

      // Add character count message
      addSystemMessage(`Character count: ${description.length}/500`)

      setCurrentStep("complete")
    } catch (error) {
      console.error("Error generating description:", error)

      // If we've already retried 3 times, show an error
      if (retryCount >= 2) {
        addErrorMessage(
          "I'm having trouble generating a description. Please try again with different information or check your API configuration.",
        )
        setCurrentStep("additional") // Go back to allow retry
      } else {
        // Otherwise, retry
        setRetryCount((prev) => prev + 1)
        addSystemMessage("The first attempt didn't work well. Trying again...")
        setTimeout(() => generateDescription(), 1000)
      }
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
        content: "👋 Let's create a new song description. What's the name of your song?",
        timestamp: new Date(),
      },
    ])
    setSongInfo({
      title: "",
      artist: "",
      genre: "",
      mood: "",
      inspiration: "",
      previous_work: "",
      album_context: "",
      collaborations: "",
      additional: "",
    })
    setFinalDescription("")
    setCharacterCount(0)
    setCurrentStep("title")
    setInput("")
    setRetryCount(0)
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
    if (characterCount > 500) return "destructive"
    if (characterCount > 490) return "default"
    if (characterCount > 480) return "outline"
    return "secondary"
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
                  {message.role === "assistant" && (
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
                        : message.role === "assistant"
                          ? "bg-muted"
                          : message.role === "error"
                            ? "bg-red-500/20 text-red-700 dark:text-red-300"
                            : "bg-amber-500/20 text-amber-700 dark:text-amber-300",
                    )}
                  >
                    {message.role === "error" && <AlertCircle className="h-4 w-4 mb-1" />}
                    <p className="whitespace-pre-wrap">{message.content}</p>
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

          {currentStep === "complete" && finalDescription && (
            <div className="w-full space-y-4">
              <div className="flex flex-col gap-2 w-full">
                <div className="flex justify-between items-center">
                  <Badge variant={getBadgeVariant()}>{characterCount} characters</Badge>
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
