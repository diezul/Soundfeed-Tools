"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Copy, RefreshCw } from "lucide-react"

export default function BpmTapper() {
  const [bpm, setBpm] = useState<number | null>(null)
  const [taps, setTaps] = useState<number[]>([])
  const [isActive, setIsActive] = useState(false)
  const tapAreaRef = useRef<HTMLDivElement>(null)

  // Calculate BPM from tap timestamps
  const calculateBPM = useCallback(() => {
    if (taps.length < 2) return null

    // Use only the last 8 taps for more accurate recent tempo
    const recentTaps = taps.slice(-8)

    // Calculate time differences between consecutive taps
    const intervals: number[] = []
    for (let i = 1; i < recentTaps.length; i++) {
      intervals.push(recentTaps[i] - recentTaps[i - 1])
    }

    // Calculate average interval
    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length

    // Convert to BPM (60000 ms in a minute)
    return Math.round(60000 / averageInterval)
  }, [taps])

  // Handle tap event
  const handleTap = useCallback(() => {
    const now = Date.now()

    // If it's been more than 2 seconds since the last tap, reset
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
      setTaps([now])
    } else {
      setTaps((prevTaps) => [...prevTaps, now])
    }

    setIsActive(true)
  }, [taps])

  // Reset the tapper
  const handleReset = useCallback(() => {
    setTaps([])
    setBpm(null)
    setIsActive(false)

    toast({
      title: "Reset",
      description: "BPM counter has been reset",
    })

    // Focus the tap area after reset
    if (tapAreaRef.current) {
      tapAreaRef.current.focus()
    }
  }, [])

  // Copy BPM to clipboard
  const copyBPM = useCallback(() => {
    if (bpm !== null) {
      navigator.clipboard.writeText(bpm.toString())
      toast({
        title: "Copied to clipboard",
        description: `${bpm} BPM has been copied to clipboard`,
      })
    }
  }, [bpm])

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond to spacebar and only if not in an input field
      if (e.code === "Space" && e.target instanceof HTMLElement && e.target.tagName !== "INPUT") {
        e.preventDefault() // Prevent page scrolling
        handleTap()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleTap])

  // Update BPM calculation when taps change
  useEffect(() => {
    if (taps.length >= 2) {
      const calculatedBpm = calculateBPM()
      if (calculatedBpm !== null && calculatedBpm > 0 && calculatedBpm <= 300) {
        setBpm(calculatedBpm)
      }
    }
  }, [taps, calculateBPM])

  // Reset active state after 1 second of no tapping
  useEffect(() => {
    if (isActive) {
      const timeout = setTimeout(() => {
        setIsActive(false)
      }, 1000)
      return () => clearTimeout(timeout)
    }
  }, [isActive, taps])

  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-md backdrop-blur-md bg-white/10 border-white/20 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">BPM Tapper</CardTitle>
          <CardDescription className="text-gray-300">Tap in rhythm or press spacebar to calculate BPM</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div
            ref={tapAreaRef}
            onClick={handleTap}
            className={`w-full h-48 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 mb-6 ${
              isActive ? "bg-primary/30 scale-[0.98]" : "bg-white/5 hover:bg-white/10"
            }`}
            tabIndex={0}
            role="button"
            aria-label="Tap to calculate BPM"
          >
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{bpm !== null ? bpm : "—"}</div>
              <div className="text-gray-300">BPM</div>
            </div>
          </div>

          <div className="text-sm text-gray-300 text-center mb-4">
            {taps.length === 0
              ? "Tap the area above or press spacebar to start"
              : taps.length === 1
                ? "Keep tapping to calculate BPM..."
                : `Based on ${taps.length} taps`}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center space-x-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          {bpm !== null && (
            <Button variant="outline" onClick={copyBPM}>
              <Copy className="mr-2 h-4 w-4" />
              Copy BPM
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
