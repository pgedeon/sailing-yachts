import { NextAuthOptions } from "next-auth"
import { JWT } from "next-auth/jwt"

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
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) return null

        // Hardcoded admin credentials - replace with DB later
        const adminUser = {
          id: "1",
          name: "Admin",
          email: "admin@sailing-yachts.com",
          username: "admin",
          password: "SailBoatAdmin!"
        }

        if (credentials.username === adminUser.username && credentials.password === adminUser.password) {
          return {
            id: adminUser.id,
            name: adminUser.name,
            email: adminUser.email,
            username: adminUser.username,
            role: "admin"
          }
        }

        return null
      }
    }
  ],
  session: {
    strategy: "jwt"
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
