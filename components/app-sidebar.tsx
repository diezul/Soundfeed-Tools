"use client"

import { Home, Music, Search, Download, Clock, Link2, Youtube, Fingerprint, Settings, LifeBuoy } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

const mainNav = [
  { title: "Home", href: "/", icon: Home },
  { title: "Song Description", href: "/song-description", icon: Music },
  { title: "Artist Finder", href: "/artist-finder", icon: Search },
  { title: "Artwork Downloader", href: "/artwork-downloader", icon: Download },
  { title: "BPM Tapper", href: "/bpm-tapper", icon: Clock },
  { title: "Link to Stream", href: "/link-to-stream", icon: Link2 },
  { title: "Channel ID Finder", href: "/channel-id-finder", icon: Youtube },
  { title: "ISRC/UPC Finder", href: "/isrc-upc-finder", icon: Fingerprint },
]

const secondaryNav = [
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Support", href: "/support", icon: LifeBuoy },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <Music className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold">Soundfeed Tools</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <Separator className="my-2" />
        <SidebarMenu>
          {secondaryNav.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
