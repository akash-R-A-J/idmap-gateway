import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
    // Email-only login (MVP - NOT SECURE, no verification)
    CredentialsProvider({
      id: 'email-only',
      name: 'Email',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" }
      },
      async authorize(credentials) {
        // MVP: Just accept any email without verification
        if (credentials?.email) {
          return {
            id: credentials.email,
            email: credentials.email,
            name: credentials.email.split('@')[0], // Use email prefix as name
          }
        }
        return null
      }
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // After successful sign-in, always redirect to /transfer
      // If url is already an absolute URL that starts with baseUrl, use it
      // Otherwise, redirect to /transfer by default
      if (url.startsWith(baseUrl)) {
        // If the URL contains callbackUrl, extract and use it
        const urlObj = new URL(url)
        const callbackUrl = urlObj.searchParams.get('callbackUrl')
        if (callbackUrl?.startsWith('/')) {
          return `${baseUrl}${callbackUrl}`
        }
        return url
      }
      // If it's a relative URL, combine with baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // Default to /transfer for successful authentication
      return `${baseUrl}/transfer`
    },
    async jwt({ token, user, account }) {
      // Attach provider info and generate access token on first sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token || generateServerToken(user.email || ''),
          provider: account.provider,
          providerId: account.providerAccountId || user.id,
        }
      }
      return token
    },
    async session({ session, token }) {
      // Expose access token and provider info to client session
      if (session?.user && token) {
        ;(session as any).accessToken = token.accessToken
        ;(session as any).provider = token.provider
        ;(session as any).providerId = token.providerId
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Generate a server-signed JWT token for backend authorization
// In production, implement proper JWT signing with a shared secret or RSA keys
function generateServerToken(email: string): string {
  // This is a placeholder - in production use a proper JWT library like `jsonwebtoken`
  // Example: jwt.sign({ email, iat: Date.now() }, process.env.JWT_SECRET, { expiresIn: '7d' })
  const payload = Buffer.from(JSON.stringify({ email, iat: Date.now() })).toString('base64')
  return `mock-jwt-${payload}`
}
