"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Music, ImageIcon, Search, ListMusic, MoreHorizontal } from "lucide-react"

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/song-description", label: "Song Description", icon: Music },
  { href: "/artwork-downloader", label: "Artwork", icon: ImageIcon },
  { href: "/artist-finder", label: "Artist Finder", icon: Search },
  { href: "/link-to-stream", label: "Link to Stream", icon: ListMusic },
]

export function AppSidebar({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "flex flex-col gap-2 p-4 w-full md:w-64 shrink-0 border-r border-border bg-background/70 backdrop-blur",
        className,
      )}
    >
      <div className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MoreHorizontal className="h-5 w-5 text-purple-500" />
        Soundfeed&nbsp;Tools
      </div>
      <nav className="space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-purple-600/20 text-purple-600 dark:text-purple-400"
                  : "hover:bg-muted hover:text-foreground/90 text-foreground/70",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
