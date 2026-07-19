import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from 'next/server'
import { ensureSchema } from '@/lib/db'
import { revalidateTag } from 'next/cache'
import {
  createManufacturerSpotlight,
  getAllManufacturerSpotlights,
  type ManufacturerSpotlight,
} from '@/lib/manufacturer-spotlights'
import { validate, createManufacturerSpotlightSchema } from '@/lib/validations'

function revalidateSpotlightTags(spotlight: Pick<ManufacturerSpotlight, 'slug' | 'manufacturer'>) {
  revalidateTag('manufacturer-spotlights', 'default')
  revalidateTag('manufacturers', 'default')
  revalidateTag(`manufacturer-spotlight:${spotlight.slug}`, 'default')
  revalidateTag(`manufacturer:${spotlight.manufacturer.slug}`, 'default')
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureSchema()
    const spotlights = await getAllManufacturerSpotlights()
    return NextResponse.json({ spotlights })
  } catch (error) {
    console.error('Failed to fetch manufacturer spotlights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch manufacturer spotlights' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureSchema()
    const body = await request.json()

    const validation = validate(createManufacturerSpotlightSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const spotlight = await createManufacturerSpotlight(validation.data)

    if (!spotlight) {
      return NextResponse.json(
        { error: 'Failed to create manufacturer spotlight' },
        { status: 500 }
      )
    }

    revalidateSpotlightTags(spotlight)

    return NextResponse.json({ spotlight }, { status: 201 })
  } catch (error) {
    console.error('Failed to create manufacturer spotlight:', error)
    return NextResponse.json(
      { error: 'Failed to create manufacturer spotlight' },
      { status: 500 }
    )
  }
}
