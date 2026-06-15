import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db, users } from "@/lib/db"
import { validate, authRegisterSchema } from "@/lib/validations";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json()
    const validation = validate(authRegisterSchema, rawBody)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors[0] || "Invalid input" },
        { status: 400 },
      )
    }

    const email = validation.data.email.trim().toLowerCase()
    const password = validation.data.password
    const name = validation.data.name?.trim()

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
