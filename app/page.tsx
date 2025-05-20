import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, Youtube, Clock, Music, Activity, ImageIcon, Hash, Users } from "lucide-react"

export default function Home() {
  const tools = [
    {
      title: "YouTube Channel ID Finder",
      description: "Find the channel ID for any YouTube channel",
      icon: Youtube,
      href: "/channel-id-finder",
    },
    {
      title: "Time to Seconds Converter",
      description: "Convert minutes and seconds to total seconds",
      icon: Clock,
      href: "/time-to-seconds",
    },
    {
      title: "Link2Stream",
      description: "Generate streaming links for songs",
      icon: Music,
      href: "/link-to-stream",
    },
    {
      title: "BPM Tapper",
      description: "Calculate beats per minute by tapping",
      icon: Activity,
      href: "/bpm-tapper",
    },
    {
      title: "Artwork Downloader",
      description: "Download high-quality artwork from Spotify",
      icon: ImageIcon,
      href: "/artwork-downloader",
    },
    {
      title: "ISRC & UPC Finder",
      description: "Find ISRC codes for tracks and UPC codes for albums",
      icon: Hash,
      href: "/isrc-upc-finder",
    },
    {
      title: "Artist Finder",
      description: "Find artists on Spotify and Apple Music",
      icon: Users,
      href: "/artist-finder",
    },
  ]

  return (
    <div className="container py-10">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">Soundfeed Tools</h1>
        <p className="mt-4 text-xl text-gray-300">A collection of useful tools for Soundfeed users</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Card key={tool.title} className="overflow-hidden backdrop-blur-md bg-white/10 border-white/20 text-white">
            <CardHeader className="pb-2">
              <div className="mb-2 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <tool.icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{tool.title}</CardTitle>
              <CardDescription className="text-gray-300">{tool.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild variant="ghost" className="group w-full justify-between hover:bg-white/10">
                <Link href={tool.href}>
                  Open Tool
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
