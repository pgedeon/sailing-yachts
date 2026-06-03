import { NextResponse } from 'next/server'
import { ensureSchema } from '@/lib/db'
import { revalidateTag } from 'next/cache'
import {
  deleteManufacturerSpotlight,
  getManufacturerSpotlightById,
  updateManufacturerSpotlight,
  type ManufacturerSpotlight,
} from '@/lib/manufacturer-spotlights'
import { validate, updateManufacturerSpotlightSchema } from '@/lib/validations'

function parseId(id: string) {
  const value = Number(id)
  return Number.isFinite(value) ? value : null
}

function revalidateSpotlightTags(spotlight: Pick<ManufacturerSpotlight, 'slug' | 'manufacturer'>) {
  revalidateTag('manufacturer-spotlights')
  revalidateTag('manufacturers')
  revalidateTag(`manufacturer-spotlight:${spotlight.slug}`)
  revalidateTag(`manufacturer:${spotlight.manufacturer.slug}`)
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {

  const { id } = params
  const spotlightId = parseId(id)
  if (!spotlightId) {
    return NextResponse.json({ error: 'Invalid spotlight id' }, { status: 400 })
  }

  try {
    await ensureSchema()
    const spotlight = await getManufacturerSpotlightById(spotlightId)

    if (!spotlight) {
      return NextResponse.json({ error: 'Manufacturer spotlight not found' }, { status: 404 })
    }

    return NextResponse.json({ spotlight })
  } catch (error) {
    console.error('Failed to fetch manufacturer spotlight:', error)
    return NextResponse.json(
      { error: 'Failed to fetch manufacturer spotlight' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {

  const { id } = params
  const spotlightId = parseId(id)
  if (!spotlightId) {
    return NextResponse.json({ error: 'Invalid spotlight id' }, { status: 400 })
  }

  try {
    await ensureSchema()
    const body = await request.json()

    const validation = validate(updateManufacturerSpotlightSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const existing = await getManufacturerSpotlightById(spotlightId)
    if (!existing) {
      return NextResponse.json({ error: 'Manufacturer spotlight not found' }, { status: 404 })
    }

    const spotlight = await updateManufacturerSpotlight(spotlightId, validation.data)

    if (!spotlight) {
      return NextResponse.json(
        { error: 'Failed to update manufacturer spotlight' },
        { status: 500 }
      )
    }

    revalidateSpotlightTags(existing)
    revalidateSpotlightTags(spotlight)

    return NextResponse.json({ spotlight })
  } catch (error) {
    console.error('Failed to update manufacturer spotlight:', error)
    return NextResponse.json(
      { error: 'Failed to update manufacturer spotlight' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {

  const { id } = params
  const spotlightId = parseId(id)
  if (!spotlightId) {
    return NextResponse.json({ error: 'Invalid spotlight id' }, { status: 400 })
  }

  try {
    await ensureSchema()
    const existing = await getManufacturerSpotlightById(spotlightId)
    if (!existing) {
      return NextResponse.json({ error: 'Manufacturer spotlight not found' }, { status: 404 })
    }

    const deleted = await deleteManufacturerSpotlight(spotlightId)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Manufacturer spotlight not found' },
        { status: 404 }
      )
    }

    revalidateSpotlightTags(existing)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete manufacturer spotlight:', error)
    return NextResponse.json(
      { error: 'Failed to delete manufacturer spotlight' },
      { status: 500 }
    )
  }
}
