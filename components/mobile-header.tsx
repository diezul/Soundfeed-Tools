"use client"

import { ArrowLeft, Menu, Home, Youtube, Clock, Music, Activity, ImageIcon, Hash, Users, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"

export function MobileHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const isHomePage = pathname === "/"

  const getPageTitle = () => {
    switch (pathname) {
      case "/":
        return "Soundfeed Tools"
      case "/channel-id-finder":
        return "Channel ID Finder"
      case "/time-to-seconds":
        return "Time to Seconds"
      case "/link-to-stream":
        return "Link2Stream"
      case "/bpm-tapper":
        return "BPM Tapper"
      case "/artwork-downloader":
        return "Artwork Downloader"
      case "/isrc-upc-finder":
        return "ISRC & UPC Finder"
      case "/artist-finder":
        return "Artist Finder"
      case "/song-description":
        return "Song Description"
      default:
        return "Soundfeed Tools"
    }
  }

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between bg-black/30 p-4 backdrop-blur-md md:hidden">
      <div className="flex items-center">
        {!isHomePage && (
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-lg font-medium">
          {getPageTitle()}
          {pathname === "/song-description" && (
            <Badge
              variant="outline"
              className="ml-2 bg-purple-500/20 text-purple-300 border-purple-500/30 text-[0.6rem]"
            >
              <Sparkles className="h-2 w-2 mr-1" />
              Soundfeed A.I.
            </Badge>
          )}
        </h1>
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="p-0 w-[250px]">
          <div className="py-4">
            <div className="flex justify-center mb-4">
              <img src="https://i.imgur.com/rvzkLlQ.png" alt="Soundfeed Logo" className="h-10" />
            </div>
            <nav className="space-y-1 px-2">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <a href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <a href="/channel-id-finder">
                  <Youtube className="mr-2 h-4 w-4" />
                  Channel ID Finder
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <a href="/time-to-seconds">
                  <Clock className="mr-2 h-4 w-4" />
                  Time to Seconds
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <a href="/link-to-stream">
                  <Music className="mr-2 h-4 w-4" />
                  Link2Stream
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <a href="/bpm-tapper">
                  <Activity className="mr-2 h-4 w-4" />
                  BPM Tapper
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <a href="/artwork-downloader">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Artwork Downloader
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <a href="/isrc-upc-finder">
                  <Hash className="mr-2 h-4 w-4" />
                  ISRC & UPC Finder
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <a href="/artist-finder">
                  <Users className="mr-2 h-4 w-4" />
                  Artist Finder
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start items-center" asChild>
                <a href="/song-description">
                  <Sparkles className="mr-2 h-4 w-4" />
                  <span className="flex items-center">
                    Song Description
                    <Badge
                      variant="outline"
                      className="ml-2 bg-purple-500/20 text-purple-300 border-purple-500/30 text-[0.6rem] inline-flex items-center"
                    >
                      <Sparkles className="h-2 w-2 mr-1" />
                      A.I.
                    </Badge>
                  </span>
                </a>
              </Button>
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
