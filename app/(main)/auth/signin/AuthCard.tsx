"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useMemo, useState } from "react"

type AuthCardProps = {
  errorCode?: string
  googleEnabled: boolean
}

type AuthMode = "signin" | "signup"

function getErrorMessage(errorCode?: string) {
  if (!errorCode) {
    return ""
  }

  switch (errorCode) {
    case "CredentialsSignin":
      return "Invalid email or password."
    case "AccessDenied":
      return "This account cannot sign in right now."
    case "OAuthAccountNotLinked":
      return "This email is already linked to a different sign-in method."
    default:
      return "We could not sign you in. Please try again."
  }
}

export default function AuthCard({ errorCode, googleEnabled }: AuthCardProps) {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>("signin")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState(getErrorMessage(errorCode))

  const title = useMemo(
    () => (mode === "signin" ? "Welcome back" : "Create your account"),
    [mode],
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage("")

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get("name") || "").trim()
    const email = String(formData.get("email") || "").trim().toLowerCase()
    const password = String(formData.get("password") || "")

    try {
      if (mode === "signup") {
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        })

        const registerData = await registerResponse.json()
        if (!registerResponse.ok) {
          setMessage(registerData.error || "Unable to create your account.")
          setLoading(false)
          return
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/account",
      })

      if (result?.error) {
        setMessage("Invalid email or password.")
        setLoading(false)
        return
      }

      router.push(result?.url || "/account")
      router.refresh()
    } catch (error) {
      console.error("[auth] Form submit error:", error)
      setMessage("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setMessage("")
    await signIn("google", { callbackUrl: "/account" })
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-blue-50/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:px-8 lg:py-20">
        <div className="max-w-xl flex-1">
          <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            Your saved yachts, searches, and alerts in one place
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Sign in to manage your sailing shortlist.
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Save favorites, keep comparisons handy, and get back to the boats you are researching faster.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">Fast account setup</div>
              <p className="mt-2 text-sm text-slate-600">Use Google in one click or create an email account in under a minute.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">Built for research</div>
              <p className="mt-2 text-sm text-slate-600">Keep favorites, saved searches, notifications, and comparisons synced to your account.</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-lg flex-1">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-blue-100/40">
            <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {mode === "signin"
                      ? "Use your email and password or continue with Google."
                      : "Create a public account to unlock the full account dashboard."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin")
                    setMessage("")
                  }}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                >
                  {mode === "signin" ? "Create account" : "Have an account?"}
                </button>
              </div>
            </div>

            <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={!googleEnabled || googleLoading || loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.8-2.7-5.8-6s2.6-6 5.8-6c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.6 3.5 14.5 2.7 12 2.7A9.3 9.3 0 0 0 2.7 12 9.3 9.3 0 0 0 12 21.3c5.4 0 9-3.8 9-9.1 0-.6-.1-1.2-.2-2H12Z" />
                  <path fill="#34A853" d="M3.8 7.6 7 9.9c.9-2 2.8-3.4 5-3.4 1.8 0 3 .8 3.7 1.5l2.5-2.4C16.6 3.5 14.5 2.7 12 2.7c-3.6 0-6.7 2-8.2 4.9Z" />
                  <path fill="#4A90E2" d="M12 21.3c2.4 0 4.5-.8 6-2.2l-2.8-2.2c-.8.6-1.8 1-3.2 1-3.8 0-5.1-2.5-5.4-3.8l-3.1 2.4c1.5 2.9 4.6 4.8 8.5 4.8Z" />
                  <path fill="#FBBC05" d="M3.6 16.4a9.4 9.4 0 0 1 0-8.8L.5 5.2A9.3 9.3 0 0 0 .5 18.8l3.1-2.4Z" />
                </svg>
                {googleLoading ? "Connecting to Google..." : "Continue with Google"}
              </button>

              {!googleEnabled ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Google sign-in is not configured yet. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to enable it.
                </p>
              ) : null}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  <span className="bg-white px-3">or use email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" ? (
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                      Full name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Alex Morgan"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                ) : null}

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    required
                    minLength={8}
                    placeholder={mode === "signin" ? "Enter your password" : "Create a password"}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                  {mode === "signup" ? (
                    <p className="mt-2 text-xs text-slate-500">Use at least 8 characters.</p>
                  ) : null}
                </div>

                {message ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {message}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading
                    ? mode === "signin"
                      ? "Signing you in..."
                      : "Creating your account..."
                    : mode === "signin"
                      ? "Sign In"
                      : "Create Account"}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500">
                {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin")
                    setMessage("")
                  }}
                  className="font-semibold text-blue-700 transition hover:text-blue-800"
                >
                  {mode === "signin" ? "Create one" : "Sign in instead"}
                </button>
              </p>

              <p className="text-center text-xs text-slate-400">
                Admins still sign in from <Link href="/admin" className="font-medium text-slate-500 hover:text-slate-700">/admin</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
