import './globals.css'
import { ThemeProvider } from './providers'
import { WorkspaceProvider } from '@/lib/contexts/workspace-context'
import { Toaster } from '@/components/ui/toaster'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Palmframe - AI Agents at Work',
  description: 'Open source platform to put your AI agents to work',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <WorkspaceProvider>
            {children}
          </WorkspaceProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}
