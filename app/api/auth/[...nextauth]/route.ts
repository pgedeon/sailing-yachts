import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) {
          return null
        }

        // Hardcoded admin credentials (replace with DB later)
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
    })
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
        token.role = user.role
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

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
