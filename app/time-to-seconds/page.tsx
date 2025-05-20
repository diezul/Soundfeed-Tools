"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Copy } from "lucide-react"

export default function TimeToSeconds() {
  const [minutes, setMinutes] = useState("")
  const [seconds, setSeconds] = useState("")
  const [totalSeconds, setTotalSeconds] = useState<number | null>(null)
  const secondsInputRef = useRef<HTMLInputElement>(null)

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^\d*$/.test(value) && value.length <= 1) {
      setMinutes(value)
      if (value.length === 1) {
        secondsInputRef.current?.focus()
      }
    }
  }

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^\d*$/.test(value) && value.length <= 2) {
      // Ensure seconds are not greater than 59
      if (value === "" || Number.parseInt(value) <= 59) {
        setSeconds(value)
      } else {
        setSeconds("59") // Set to maximum allowed value
      }
    }
  }

  useEffect(() => {
    if (minutes || seconds) {
      const minutesNum = minutes ? Number.parseInt(minutes) : 0
      const secondsNum = seconds ? Number.parseInt(seconds) : 0
      setTotalSeconds(minutesNum * 60 + secondsNum)
    } else {
      setTotalSeconds(null)
    }
  }, [minutes, seconds])

  const copyResult = () => {
    if (totalSeconds !== null) {
      navigator.clipboard.writeText(totalSeconds.toString())
      toast({
        title: "Copied to clipboard",
        description: `${totalSeconds} seconds has been copied to clipboard`,
      })
    }
  }

  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-md backdrop-blur-md bg-white/10 border-white/20 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Time to Seconds Converter</CardTitle>
          <CardDescription className="text-gray-300">Convert minutes and seconds to total seconds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-6">
            <div className="flex justify-center space-x-2">
              <div className="w-16">
                <Input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="m"
                  value={minutes}
                  onChange={handleMinutesChange}
                  className="text-center bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  maxLength={1}
                />
                <p className="mt-1 text-xs text-center text-gray-400">Minutes</p>
              </div>
              <div className="flex items-center justify-center text-2xl">:</div>
              <div className="w-16">
                <Input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="ss"
                  value={seconds}
                  onChange={handleSecondsChange}
                  className="text-center bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  maxLength={2}
                  ref={secondsInputRef}
                />
                <p className="mt-1 text-xs text-center text-gray-400">Seconds</p>
              </div>
            </div>

            <div className="rounded-lg bg-white/5 p-4 text-center backdrop-blur-sm">
              <h3 className="text-lg font-medium">Result</h3>
              <p className="mt-2 text-2xl font-bold">
                {totalSeconds !== null ? `${totalSeconds} seconds` : "Enter time values"}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={copyResult} disabled={totalSeconds === null} variant="outline">
            <Copy className="mr-2 h-4 w-4" />
            Copy Result
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
