import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JARVIS — Inteligencia Artificial Empresarial',
  description: 'La plataforma de IA más poderosa para agencias y negocios en Latinoamérica. 9 agentes especializados, voz humana, videos, marketing y más — todo en piloto automático.',
  keywords: ['IA empresarial', 'inteligencia artificial', 'agentes IA', 'automatización', 'LATAM'],
  openGraph: {
    title: 'JARVIS — El cerebro de IA de tu empresa',
    description: 'Plataforma multi-agente de IA empresarial. Más de 10 IAs integradas trabajando para ti.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
