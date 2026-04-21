'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { useState, useRef } from 'react'

export default function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialError = searchParams.get('error')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)
  const [lockedOut, setLockedOut] = useState(false)
  const [retryAfter, setRetryAfter] = useState<number>(0)
  const failedAttempts = useRef(0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)

    // Client-side brute-force tracking
    if (failedAttempts.current >= 5) {
      const backoff = Math.min(1000 * Math.pow(2, failedAttempts.current - 5), 30000)
      await new Promise(resolve => setTimeout(resolve, backoff))
    }

    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
      callbackUrl: '/admin',
    })

    if (result?.error) {
      failedAttempts.current += 1
      setError('Invalid email or password')
      setLoading(false)
      
      if (failedAttempts.current >= 10) {
        setLockedOut(true)
        setRetryAfter(30 * 60) // 30 minutes
        setError('Too many failed attempts. Please try again later.')
      } else if (failedAttempts.current >= 5) {
        setError(`Invalid email or password. ${10 - failedAttempts.current} attempts remaining before lockout.`)
      }
      return
    }

    // Successful login
    failedAttempts.current = 0
    router.push(result?.url || '/admin')
    router.refresh()
  }

  if (lockedOut) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
        <h1 className="text-3xl font-bold mb-6 text-red-700">Account Temporarily Locked</h1>
        <p className="mb-4 text-lg text-gray-700">
          Too many failed login attempts. Please try again in {Math.ceil(retryAfter / 60)} minutes.
        </p>
        <button
          onClick={() => {
            setLockedOut(false)
            setRetryAfter(0)
            setError(null)
            failedAttempts.current = 0
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Admin Access</h1>
      <p className="mb-4 text-lg text-gray-700">Sign in to access the admin panel.</p>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              autoComplete="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@sailingyachtinfo.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
