"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { useCallback, useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"

type HeaderAuthControlsProps = {
  mobile?: boolean
}

type SessionState = {
  user?: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
} | null

function getDisplayName(session: SessionState) {
  const name = session?.user?.name?.trim()
  if (name) {
    return name
  }

  return session?.user?.email?.split("@")[0] || "Account"
}

function getInitials(session: SessionState) {
  const displayName = getDisplayName(session)
  const parts = displayName.split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] || "A") + (parts[1]?.[0] || "")
}

export default function HeaderAuthControls({ mobile = false }: HeaderAuthControlsProps) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<SessionState>(null)
  const locale = useLocale()
  const t = useTranslations("Layout.auth")

  const refreshSession = useCallback(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        setSession(data?.user?.id ? data : null)
        setLoading(false)
      })
      .catch(() => {
        setSession(null)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    refreshSession()

    // Listen for auth state changes from sign-in/sign-up pages
    const handleAuthChange = () => {
      setLoading(true)
      refreshSession()
    }
    window.addEventListener("auth-change", handleAuthChange)
    return () => window.removeEventListener("auth-change", handleAuthChange)
  }, [refreshSession])

  if (loading) {
    return mobile ? (
      <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
    ) : (
      <div className="h-10 w-32 animate-pulse rounded-full bg-slate-100" />
    )
  }

  if (!session?.user?.id) {
    if (mobile) {
      return (
        <Link
          href="/auth/signin"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {t("signIn")}
        </Link>
      )
    }

    return (
      <Link
        href="/auth/signin"
        className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        {t("signIn")}
      </Link>
    )
  }

  if (mobile) {
    return (
      <div className="grid gap-3">
        <Link
          href={`/${locale}/account`}
          className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
        >
          <Avatar session={session} />
          <div>
            <div className="text-sm font-semibold text-slate-900">{getDisplayName(session)}</div>
            <div className="text-xs text-slate-500">{t("accountDashboard")}</div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => {
            setSession(null)
            setLoading(true)
            signOut({ callbackUrl: `/${locale}` })
          }}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          {t("signOut")}
        </button>
      </div>
    )
  }

  return (
    <details className="group relative">
      <summary className="flex list-none cursor-pointer items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm transition hover:border-slate-300 hover:bg-slate-50">
        <Avatar session={session} />
        <div className="text-left leading-tight">
          <div className="max-w-[140px] truncate font-semibold text-slate-900">{getDisplayName(session)}</div>
          <div className="max-w-[140px] truncate text-xs text-slate-500">{session.user.email}</div>
        </div>
        <svg className="h-4 w-4 text-slate-400 transition group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
        </svg>
      </summary>

      <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/70">
        <Link
          href={`/${locale}/account`}
          className="flex items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
        >
          {t("account")}
        </Link>
        <button
          type="button"
          onClick={() => {
            setSession(null)
            setLoading(true)
            signOut({ callbackUrl: `/${locale}` })
          }}
          className="flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
        >
          {t("signOut")}
        </button>
      </div>
    </details>
  )
}

function Avatar({ session }: { session: SessionState }) {
  if (session?.user?.image) {
    return (
      <img
        src={session.user.image}
        alt={getDisplayName(session)}
        className="h-9 w-9 rounded-full object-cover"
      />
    )
  }

  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
      {getInitials(session).toUpperCase()}
    </span>
  )
}
