import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db, users } from "@/lib/db"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body.password === "string" ? body.password : ""
    const name = typeof body.name === "string" ? body.name.trim() : ""

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 })
    }

    if (password.length > 72) {
      return NextResponse.json({ error: "Password must be 72 characters or fewer." }, { status: 400 })
    }

    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists. Sign in instead." },
        { status: 409 },
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await db.insert(users).values({
      email,
      name: name || email.split("@")[0],
      image: null,
      passwordHash,
      role: "user",
      isActive: true,
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "An account with this email already exists. Sign in instead." },
        { status: 409 },
      )
    }

    console.error("[auth] Register error:", error)
    return NextResponse.json({ error: "Unable to create account right now." }, { status: 500 })
  }
}
