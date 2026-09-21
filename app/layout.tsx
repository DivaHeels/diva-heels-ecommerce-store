import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'
import { StoreProvider } from '@/components/store-provider'
import { LanguageProvider } from '@/components/language-provider'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' })
const cormorant = Cormorant_Garamond({ subsets: ['latin', 'cyrillic'], variable: '--font-cormorant', weight: ['400', '500', '600'] })
export const metadata: Metadata = { title: 'Diva Heels | Дамски обувки с висок ток', description: 'Елегантни дамски обувки с висок ток от Diva Heels. Безплатна доставка до България, Европа и Великобритания.' }
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="bg"><body className={`${inter.variable} ${cormorant.variable}`}><LanguageProvider><StoreProvider><Header />{children}<Footer /></StoreProvider></LanguageProvider><Analytics /></body></html> }
