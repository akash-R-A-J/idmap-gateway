# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 14 app router frontend for Solana token transfers with NextAuth.js social authentication (Google & GitHub). Features a dark UI with Tailwind CSS, protected routes via NextAuth middleware, and Solana public-key validation.

**Tech Stack:** Next.js 14 (App Router), NextAuth.js, TypeScript, Tailwind CSS, @solana/web3.js, React Hot Toast, Framer Motion, Jest + React Testing Library

## Common Commands

### Development
```bash
npm install        # Install dependencies
npm run dev        # Start development server on http://localhost:3000
npm run build      # Build for production (runs type checking)
npm start          # Start production server
```

### Testing & Type Checking
```bash
npm test                              # Run all Jest tests
npm run test:watch                    # Run tests in watch mode
npm test -- TransferForm.test.tsx     # Run single test file
npm test -- --coverage                # Run tests with coverage report
npm run lint                          # Run ESLint
npx tsc --noEmit                      # Type check without emitting files
```

## Architecture

### Authentication Flow

**OAuth Flow (Google/GitHub):**
```
1. User clicks "Continue with Google/GitHub"
   → signIn() from next-auth/react
2. Redirect to OAuth provider for consent
3. Provider redirects to /api/auth/callback/[provider]
4. jwt() callback in lib/auth.ts:38 captures access_token, provider, providerAccountId
5. session() callback in lib/auth.ts:44 exposes accessToken to client session
6. Session stored as httpOnly cookie (CSRF-protected)
7. Client components access session via useSession() hook
```

**Key Authentication Files:**
- `lib/auth.ts` - NextAuth configuration with providers, JWT strategy, callbacks
- `middleware.ts:4` - Protected route matcher (currently: ['/transfer'])
- `app/providers.tsx` - SessionProvider wrapper and dark mode initialization
- `app/api/auth/[...nextauth]/route.ts` - NextAuth API route handler

**Critical: Mock JWT Token**
- `generateServerToken()` in `lib/auth.ts:102` creates placeholder tokens when OAuth provider doesn't return access_token
- Format: `"mock-jwt-<base64_payload>"` where payload = `{email, iat}`
- **PRODUCTION BLOCKER**: Replace with proper JWT signing using `jsonwebtoken` library + shared secret with backend

### API Integration
- Backend calls are in `lib/fetcher.ts`
- All backend requests include `Authorization: Bearer <accessToken>` header
- Backend URL configurable via `NEXT_PUBLIC_BACKEND_URL` environment variable
- Expected backend endpoints:
  - `POST /api/users/sync` - User registration after OAuth sign-up
  - `POST /api/transfer` - Solana token transfer

### Solana Validation
- `lib/validation.ts` contains validation utilities
- `isValidSolanaPublicKey()` uses `@solana/web3.js` PublicKey constructor (throws on invalid keys, always wrap in try-catch)
- `isValidAmount()` validates positive finite numbers
- Client-side validation happens before submitting to backend

### Component Structure
- `app/` - Next.js app router pages (layout, home, signin, signup, transfer)
- `components/` - Reusable UI components:
  - Core: `Modal`, `SocialButton`, `TransferForm`, `DarkModeToggle`, `Toast`, `LogoutButton`, `Navbar`
  - Variants: `FuturisticModal`, `FuturisticSocialButton`, `MinimalButton`
  - Backgrounds: `AnimatedBackground`, `MinimalBackground`
- `lib/` - Utilities (auth, fetcher, validation)
- `components/Navbar.tsx` - Fixed navigation bar with logo and links (Sign up, Contact, About)
- Server components fetch session via `getServerSession(authOptions)` on protected pages
- Client components use `useSession()` hook from `next-auth/react`

### Styling & Dark Mode

**Tailwind Configuration:**
- Dark mode strategy: `class` (toggle via `<html class="dark">`)
- Custom theme colors in `tailwind.config.js:11`:
  - Primary: `#6C63FF` (purple brand), hover: `#5A52D5`
  - Dark backgrounds: `#0F0F0F` (bg), `#1A1A1A` (card), `#2A2A2A` (border)
- Global component classes in `app/globals.css`: `.input-field`, `.btn-primary`, `.modal-card`

**Dark Mode Implementation:**
- Toggle component: `components/DarkModeToggle.tsx`
- Persistence: localStorage key `'darkMode'` = `'true'|'false'`
- Applied on mount in `app/providers.tsx:10` via `useEffect`
- Dark styles use Tailwind `dark:` prefix (e.g., `dark:bg-dark-bg`)

**UI Design System (Clerk-Inspired):**
- Signup/Signin pages follow Clerk's minimal dark aesthetic
- **Signup page**:
  - Left panel: Feature blocks with icon + heading + description pattern
  - Right panel: Centered signup card with social OAuth buttons
- **Signin page**:
  - Left panel: "Identity Mapping Id<Map>" heading with purple accent (#7c6aef) on brand name
  - Right panel: Auth card with GitHub/Google OAuth
  - Fixed navbar at top with logo, Sign up, Contact, About links
- Typography hierarchy: `text-[15px] font-semibold` (headings), `text-[13px] font-normal` (descriptions)
- Spacing: Consistent use of `space-y-10` for feature blocks, `mb-6` to `mb-10` for sections
- Logo positioning: `/logo.png` displayed in navbar and pages with `Id<Map>` branding
- Brand color: `#7c6aef` (purple) used for links and accents

### Testing
- Jest with React Testing Library
- Tests in `__tests__/` directory
- `jest.config.js` uses Next.js Jest integration
- Module path aliases: `@/` maps to project root
- Test files match pattern: `**/__tests__/**/*.test.[jt]s?(x)`

## Environment Setup

Required `.env.local` variables:
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
GITHUB_ID=<from-github-developer-settings>
GITHUB_SECRET=<from-github-developer-settings>
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

## Key Conventions

### Route Protection
- Add routes to `middleware.ts` matcher array to protect them with NextAuth
- Unprotected routes don't require session checks

### Server vs Client Components
- Use server components by default for better performance
- Mark components with `'use client'` only when using hooks (useState, useEffect, useSession) or browser APIs
- `TransferForm` is client component (uses state, form handling, toast notifications)

### Error Handling
- Backend API errors are caught and displayed via `react-hot-toast`
- Validation errors shown inline below form fields
- Always handle promise rejections from `transferTokens()` and `fetch()` calls

### TypeScript
- Strict mode enabled in `tsconfig.json`
- Session type extensions use `(session as any)` for custom fields (accessToken, provider, providerId)
- Consider creating proper type augmentation for NextAuth session in production

## How To: Common Tasks

### Add a New Protected Route
1. Add route path to `middleware.ts:4` matcher array: `matcher: ['/transfer', '/new-route']`
2. In the page component, use `getServerSession(authOptions)` server-side:
   ```typescript
   import { getServerSession } from 'next-auth'
   import { authOptions } from '@/lib/auth'
   import { redirect } from 'next/navigation'

   export default async function ProtectedPage() {
     const session = await getServerSession(authOptions)
     if (!session) redirect('/signin')
     // ... rest of component
   }
   ```

### Add a New Backend API Endpoint
1. Create function in `lib/fetcher.ts`:
   ```typescript
   export async function newApiCall(data: DataType, session: Session) {
     const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/endpoint`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${(session as any).accessToken}`,
       },
       body: JSON.stringify(data),
     })
     if (!response.ok) {
       const error = await response.json().catch(() => ({}))
       throw new Error(error.message || 'Request failed')
     }
     return response.json()
   }
   ```
2. Call from client component with try-catch and toast for errors

### Modify Authentication Providers
1. Edit `lib/auth.ts:6` providers array
2. Add environment variables to `.env.local`
3. Update `app/signin/page.tsx` and `app/signup/page.tsx` to add UI buttons
4. Test OAuth flow with provider's developer console

### Update Styling/Theme
1. Extend colors in `tailwind.config.js:11` theme.extend.colors
2. Use in components with Tailwind classes (e.g., `bg-custom-color`)
3. For dark mode: add `dark:` prefix (e.g., `dark:bg-custom-dark`)
4. For component-level styles: add to `app/globals.css` in `@layer components`

## Production Considerations

### Critical Issues to Resolve

1. **JWT Signing (BLOCKER)**: Replace `generateServerToken()` in `lib/auth.ts:102` with proper JWT library:
   ```typescript
   import jwt from 'jsonwebtoken'
   function generateServerToken(email: string): string {
     return jwt.sign({ email, iat: Date.now() }, process.env.JWT_SECRET!, { expiresIn: '7d' })
   }
   ```
   Add `JWT_SECRET` to environment variables and share with backend for verification.

2. **Session Type Safety**: Replace `(session as any)` casts with proper NextAuth type augmentation:
   ```typescript
   // types/next-auth.d.ts
   import NextAuth from "next-auth"
   declare module "next-auth" {
     interface Session {
       accessToken?: string
       provider?: string
       providerId?: string
     }
   }
   ```

3. **Token Security**: Access tokens are exposed client-side. Consider:
   - Server-side API proxy (Next.js API routes) to keep tokens server-only
   - OR ensure backend validates tokens strictly and implements rate limiting

### Deployment Checklist

- [ ] Replace mock JWT with proper signing (`lib/auth.ts:59`)
- [ ] Update OAuth redirect URIs in Google/GitHub apps to production domain
- [ ] Set all environment variables in hosting platform (Vercel, etc.)
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Configure CORS on backend to allow production frontend domain
- [ ] Test OAuth flow end-to-end on staging environment
- [ ] Verify HTTPS is enabled (required for secure cookies)
