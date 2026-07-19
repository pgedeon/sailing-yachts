import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from 'next/server'
import { ensureSchema, pool } from '@/lib/db'
import { revalidatePath } from 'next/cache'

function parseId(id: string) {
  const value = Number(id)
  return Number.isFinite(value) ? value : null
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const params = await props.params;

  const { id } = params
  const categoryId = parseId(id)
  if (!categoryId) {
    return NextResponse.json({ error: 'Invalid category id' }, { status: 400 })
  }

  try {
    await ensureSchema()
    const result = await pool.query('DELETE FROM spec_categories WHERE id = $1', [categoryId])
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    revalidatePath('/yachts')
    return NextResponse.redirect(new URL('/admin/spec-categories', request.url))
  } catch (error) {
    console.error('Failed to delete spec category:', error)
    return NextResponse.json(
      { error: 'Failed to delete spec category' },
      { status: 500 }
    )
  }
}
