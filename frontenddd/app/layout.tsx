import { Providers } from './providers'
import './globals.css'

export const metadata = {
  title: 'Id<Map>',
  description: 'Secure Web3 identity and authentication',
  icons: {
    icon: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
