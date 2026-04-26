import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import AuthCard from "./AuthCard"
import { authOptions } from "@/lib/auth"

type SignInPageProps = {
  searchParams?: {
    error?: string
  }
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await getServerSession(authOptions)

  if (session?.user?.id) {
    redirect("/account")
  }

  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  )

  return <AuthCard errorCode={searchParams?.error} googleEnabled={googleEnabled} />
}
