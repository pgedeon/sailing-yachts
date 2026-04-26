import type { NextAuthOptions } from "next-auth"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { db } from "./db"
import { users } from "./db"

// Lazily validate NEXTAUTH_SECRET — only when auth is actually used at runtime.
// This prevents build-time crashes during `next build` static analysis.
// The secret is validated on first auth request, not at module import time.
let _secretValidated = false
function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error(
      "FATAL: NEXTAUTH_SECRET environment variable is not set. " +
      "Refusing to start without a proper secret. " +
      "Generate one with: openssl rand -base64 32"
    )
  }
  if (!_secretValidated) {
    if (secret.length < 32) {
      console.warn(
        "[auth] WARNING: NEXTAUTH_SECRET is less than 32 characters. " +
        "Consider using a longer secret for better security."
      )
    }
    _secretValidated = true
  }
  return secret
}

// Extend NextAuth types to include our custom user fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    role?: string
    image?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    picture?: string | null
  }
}

async function findUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  return result[0] ?? null
}

async function syncGoogleUser(input: {
  email: string
  name?: string | null
  image?: string | null
}) {
  const existingUser = await findUserByEmail(input.email)

  if (existingUser) {
    if (!existingUser.isActive) {
      return null
    }

    await db
      .update(users)
      .set({
        name: input.name ?? existingUser.name,
        image: input.image ?? existingUser.image,
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      })
      .where(eq(users.id, existingUser.id))

    return {
      ...existingUser,
      name: input.name ?? existingUser.name,
      image: input.image ?? existingUser.image,
    }
  }

  const generatedPasswordHash = await bcrypt.hash(randomUUID(), 12)
  const insertedUsers = await db
    .insert(users)
    .values({
      email: input.email,
      name: input.name ?? input.email.split("@")[0],
      image: input.image ?? null,
      passwordHash: generatedPasswordHash,
      role: "user",
      isActive: true,
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    })
    .returning()

  return insertedUsers[0] ?? null
}

const googleProviderEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
)

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        const normalizedEmail = credentials.email.trim().toLowerCase()

        try {
          const result = await db
            .select()
            .from(users)
            .where(eq(users.email, normalizedEmail))
            .limit(1)

          if (result.length === 0) return null

          const user = result[0]

          if (!user.isActive) return null
          if (!user.passwordHash) return null

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
          if (!isValid) return null

          db.update(users)
            .set({ lastLoginAt: new Date(), updatedAt: new Date() })
            .where(eq(users.id, user.id))
            .catch(() => {/* non-critical */})

          return {
            id: String(user.id),
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          }
        } catch (error) {
          console.error("[auth] Authorization error:", error)
          return null
        }
      }
    }),
    ...(googleProviderEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours (reduced from 24h for admin security)
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin"
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true
      }

      const email = user.email?.trim().toLowerCase()
      if (!email) {
        return false
      }

      try {
        const dbUser = await syncGoogleUser({
          email,
          name: user.name,
          image: user.image,
        })

        if (!dbUser) {
          return false
        }

        user.id = String(dbUser.id)
        user.email = dbUser.email
        user.name = dbUser.name
        user.image = dbUser.image
        user.role = dbUser.role

        return true
      } catch (error) {
        console.error("[auth] Google sign-in error:", error)
        return false
      }
    },
    async jwt({ token, user, trigger }) {
      // On sign-in, populate from DB
      if (user?.email) {
        const normalizedEmail = user.email.trim().toLowerCase()
        try {
          const dbUser = await findUserByEmail(normalizedEmail)
          if (dbUser) {
            token.sub = String(dbUser.id)
            token.role = dbUser.role
            token.name = dbUser.name ?? token.name
            token.email = dbUser.email
            token.picture = dbUser.image ?? null
            return token
          }
        } catch (error) {
          console.error("[auth] JWT sync error:", error)
        }
      }

      // Always refresh role from DB on session access to catch role changes
      if (token.email) {
        try {
          const dbUser = await findUserByEmail(token.email as string)
          if (dbUser) {
            token.sub = String(dbUser.id)
            token.role = dbUser.role
            token.name = dbUser.name ?? token.name
            token.picture = dbUser.image ?? token.picture ?? null
            // Deactivate sessions for disabled users
            if (!dbUser.isActive) {
              return { ...token, role: "disabled" }
            }
          }
        } catch (error) {
          console.error("[auth] JWT refresh error:", error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ""
        session.user.role = (token.role as string) ?? "user"
        session.user.name = token.name ?? session.user.name ?? null
        session.user.email = token.email ?? session.user.email ?? null
        session.user.image = (token.picture as string | null | undefined) ?? session.user.image ?? null
      }
      return session
    }
  },
  // Use getter so the secret is resolved lazily — avoids crashing during
  // `next build` when NEXTAUTH_SECRET isn't available (CI / static analysis).
  // The secret is validated on the first actual auth request.
  get secret() {
    return getSecret()
  },
}
