"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Sparkles, SendHorizontal, Copy, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { generateAIResponse } from "../lib/ai-client"

// Define message types
type MessageRole = "system" | "user" | "assistant" | "info"

interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
}

// Define the steps in our conversation
type Step = "welcome" | "title" | "artist" | "genre" | "mood" | "additional" | "generating" | "complete"

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
    additional: "",
  })
  const [finalDescription, setFinalDescription] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Initialize the chat with welcome message
  useEffect(() => {
    const initialMessage: Message = {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Hi! I'll help you create a professional song description. Let's start with the song title. What's the name of your song?",
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
          addAssistantMessage("What genre would you categorize this song as? (e.g., Pop, Hip-Hop, Rock)")
          setCurrentStep("genre")
          break

        case "genre":
          setSongInfo((prev) => ({ ...prev, genre: input.trim() }))
          addAssistantMessage("How would you describe the mood of the song? (e.g., Energetic, Melancholic, Uplifting)")
          setCurrentStep("mood")
          break

        case "mood":
          setSongInfo((prev) => ({ ...prev, mood: input.trim() }))
          addAssistantMessage(
            "Any additional information about the song you'd like to include? (influences, specific elements to highlight, etc.)",
          )
          setCurrentStep("additional")
          break

        case "additional":
          setSongInfo((prev) => ({ ...prev, additional: input.trim() }))
          await generateDescription()
          break
      }
    } catch (error) {
      console.error("Error processing message:", error)
      addSystemMessage("Sorry, I encountered an error. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Generate the final description
  const generateDescription = async () => {
    setCurrentStep("generating")
    addSystemMessage("Generating your song description...")

    try {
      // Create the conversation for the AI
      const aiMessages = [
        {
          role: "system",
          content: `You are a professional music copywriter who creates engaging song descriptions. 
          Create a captivating song description that is EXACTLY between 490-500 characters.
          Do not include any explanations, notes, or character counts in your response.
          Just provide the description text directly.`,
        },
        {
          role: "user",
          content: `Write a professional song description for "${songInfo.title}" by ${songInfo.artist}.
          Genre: ${songInfo.genre || "Not specified"}
          Mood: ${songInfo.mood || "Not specified"}
          Additional information: ${songInfo.additional || "None provided"}`,
        },
      ]

      // Call the AI API
      const description = await generateAIResponse(aiMessages)

      // Ensure the description is within character limits
      let finalDesc = description
      if (finalDesc.length > 500) {
        const lastPeriodIndex = finalDesc.lastIndexOf(".", 500)
        if (lastPeriodIndex > 450) {
          finalDesc = finalDesc.substring(0, lastPeriodIndex + 1)
        } else {
          finalDesc = finalDesc.substring(0, 497) + "..."
        }
      }

      setFinalDescription(finalDesc)
      addAssistantMessage("Here's your song description:")
      addAssistantMessage(finalDesc)
      setCurrentStep("complete")
    } catch (error) {
      console.error("Error generating description:", error)
      addSystemMessage(
        "I'm having trouble connecting to the AI service. Please check your API configuration or try again later.",
      )
      setCurrentStep("additional") // Go back to allow retry
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
      additional: "",
    })
    setFinalDescription("")
    setCurrentStep("title")
    setInput("")
  }

  // Handle key press for sending messages
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isProcessing) {
      e.preventDefault()
      handleSendMessage()
    }
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
              <AvatarImage src="/placeholder-logo.svg" alt="AI" />
              <AvatarFallback>AI</AvatarFallback>
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
                      <AvatarImage src="/placeholder-logo.svg" alt="AI" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 max-w-[80%]",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : message.role === "assistant"
                          ? "bg-muted"
                          : "bg-amber-500/20 text-amber-700 dark:text-amber-300",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 ml-2">
                      <AvatarImage src="/placeholder-user.jpg" alt="User" />
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
              <div className="flex justify-between items-center">
                <Badge variant="outline">{finalDescription.length} characters</Badge>
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
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
