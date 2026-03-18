import type { Metadata } from 'next'
import { Noto_Sans_Hebrew, Inter, Geist_Mono } from 'next/font/google'
import './globals.css'

const notoSansHebrew = Noto_Sans_Hebrew({
  variable: '--font-hebrew',
  subsets: ['hebrew'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'פינוי-בינוי — מערכת ניהול',
  description: 'מערכת ניהול חכמה ושקופה לפרויקטי פינוי-בינוי',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${notoSansHebrew.variable} ${inter.variable} ${geistMono.variable}`}
    >
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
