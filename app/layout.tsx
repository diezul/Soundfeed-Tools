import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { MobileHeader } from "@/components/mobile-header"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Soundfeed Tools",
  description: "A collection of tools for Soundfeed users",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <SidebarProvider>
            <div className="flex h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 bg-fixed">
              <AppSidebar />
              <main className="flex-1 overflow-auto">
                <MobileHeader />
                <div className="mx-auto max-w-5xl p-4">{children}</div>
              </main>
            </div>
            <Toaster />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
