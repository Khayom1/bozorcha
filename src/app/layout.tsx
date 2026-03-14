// src/app/layout.tsx
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/Providers'

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tg" className={`${inter.variable} dark`}>
      <body className="bg-[#020617] font-sans text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
