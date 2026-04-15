import { NextAuthOptions } from "next-auth"
import { JWT } from "next-auth/jwt"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "./db"
import { users } from "./db"

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
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        try {
          // Query user from database
          const result = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1)

          if (result.length === 0) return null

          const user = result[0]

          // Check if user is active
          if (!user.isActive) return null

          // Verify password
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
          if (!isValid) return null

          // Update last login timestamp (non-blocking)
          db.update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, user.id))
            .catch(() => {/* non-critical */})

          return {
            id: String(user.id),
            name: user.name,
            email: user.email,
            role: user.role,
          }
        } catch (error) {
          console.error("[auth] Authorization error:", error)
          return null
        }
      }
    }
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/admin",
    error: "/admin?error=invalid"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production"
}
