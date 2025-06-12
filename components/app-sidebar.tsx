"use client"

import { Home, Youtube, Clock, Music, Activity, ImageIcon, Hash, Users, Sparkles } from "lucide-react"
import NextImage from "next/image"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export function AppSidebar({ isMobileSheet = false }: { isMobileSheet?: boolean }) {
  const pathname = usePathname()

  const menuItems = [
    {
      title: "Home",
      icon: Home,
      href: "/",
    },
    {
      title: "Channel ID Finder",
      icon: Youtube,
      href: "/channel-id-finder",
    },
    {
      title: "Time to Seconds",
      icon: Clock,
      href: "/time-to-seconds",
    },
    {
      title: "Link2Stream",
      icon: Music,
      href: "/link-to-stream",
    },
    {
      title: "BPM Tapper",
      icon: Activity,
      href: "/bpm-tapper",
    },
    {
      title: "Artwork Downloader",
      icon: ImageIcon,
      href: "/artwork-downloader",
    },
    {
      title: "ISRC & UPC Finder",
      icon: Hash,
      href: "/isrc-upc-finder",
    },
    {
      title: "Artist Finder",
      icon: Users,
      href: "/artist-finder",
    },
    {
      title: "Song Description",
      icon: Sparkles,
      href: "/song-description",
      badge: {
        text: "Soundfeed A.I.",
        variant: "purple",
      },
    },
  ]

  return (
    <Sidebar variant="floating" collapsible="icon" className={isMobileSheet ? "border-none shadow-none" : ""}>
      <SidebarHeader className="flex items-center justify-center py-4">
        <div className="flex items-center justify-center">
          <NextImage
            src="https://i.imgur.com/rvzkLlQ.png"
            alt="Soundfeed Logo"
            width={150}
            height={50}
            className="h-auto"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                <Link href={item.href} className="flex items-center w-full">
                  <item.icon className="shrink-0" />
                  <span className="flex items-center truncate">
                    {item.title}
                    {item.badge && (
                      <Badge
                        variant="outline"
                        className={`ml-2 text-[0.6rem] py-0 px-1 inline-flex items-center whitespace-nowrap
                          ${item.badge.variant === "purple" ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : ""}`}
                      >
                        <Sparkles className="h-2 w-2 mr-1" />
                        {item.badge.text}
                      </Badge>
                    )}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 text-center text-xs text-gray-400">
        Soundfeed Tools © {new Date().getFullYear()}
      </SidebarFooter>
    </Sidebar>
  )
}
