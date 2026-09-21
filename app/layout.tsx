import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'
import { StoreProvider } from '@/components/store-provider'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

const inter = Inter({ subsets:['latin','cyrillic'], variable:'--font-inter' })
const cormorant = Cormorant_Garamond({ subsets:['latin','cyrillic'], variable:'--font-cormorant', weight:['400','500','600'] })
export const metadata: Metadata = { title:'Diva Heels | Дамски обувки с висок ток', description:'Открий елегантни дамски обувки с висок ток от Diva Heels. Безплатна доставка до България и доставка до 2 работни дни.' }
export default function RootLayout({ children }:{children:React.ReactNode}) { return <html lang="bg"><body className={`${inter.variable} ${cormorant.variable}`}><StoreProvider><Header />{children}<Footer /></StoreProvider></body></html> }
