"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { AppSidebar } from "./app-sidebar"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

export function MobileHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close the sheet when the pathname changes (i.e., when navigating to a new page)
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between p-4 backdrop-blur-md bg-black/50 border-b border-white/10 md:hidden">
      <div className="text-lg font-semibold text-white">Soundfeed Tools</div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 bg-black border-r border-white/10 w-[280px]">
          <AppSidebar isMobileSheet={true} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
