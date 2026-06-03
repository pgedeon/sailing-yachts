import { NextResponse } from 'next/server'
import { ensureSchema, pool } from '@/lib/db'
import { revalidateTag } from 'next/cache'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { validate } from '@/lib/validations'

// Zod schema for image upload validation
const imageUploadSchema = {
  url: 'string',
  caption: 'string|optional',
  altText: 'string|optional',
  isPrimary: 'boolean|optional',
  sortOrder: 'number|optional',
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {

  try {
    await ensureSchema()
    const { id } = params
    const yachtId = parseInt(id, 10)
    
    if (isNaN(yachtId)) {
      return NextResponse.json(
        { error: 'Invalid yacht ID' },
        { status: 400 }
      )
    }

    // Check if yacht exists
    const yachtCheck = await pool.query(
      'SELECT id FROM yacht_models WHERE id = $1',
      [yachtId]
    )
    
    if (yachtCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Yacht not found' },
        { status: 404 }
      )
    }

    // Get all images for this yacht
    const result = await pool.query(
      `
        SELECT id, url, caption, alt_text, is_primary, sort_order, created_at
        FROM images
        WHERE yacht_model_id = $1
        ORDER BY sort_order, created_at
      `,
      [yachtId]
    )

    return NextResponse.json({ 
      images: result.rows 
    })
  } catch (error) {
    console.error('Failed to fetch images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {

  try {
    await ensureSchema()
    const { id } = params
    const yachtId = parseInt(id, 10)
    
    if (isNaN(yachtId)) {
      return NextResponse.json(
        { error: 'Invalid yacht ID' },
        { status: 400 }
      )
    }

    // Check if yacht exists
    const yachtCheck = await pool.query(
      'SELECT id FROM yacht_models WHERE id = $1',
      [yachtId]
    )
    
    if (yachtCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Yacht not found' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    const url = formData.get('url') as string
    const caption = formData.get('caption') as string
    const altText = formData.get('altText') as string
    const isPrimary = formData.get('isPrimary') === 'true'
    const sortOrder = formData.get('sortOrder') ? parseInt(formData.get('sortOrder') as string, 10) : 0

    // Validate inputs
    if (!file && !url) {
      return NextResponse.json(
        { error: 'Either image file or URL is required' },
        { status: 400 }
      )
    }

    let finalUrl: string

    if (file) {
      // Handle file upload
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Only image files are allowed' },
          { status: 400 }
        )
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        return NextResponse.json(
          { error: 'Image file size must be less than 5MB' },
          { status: 400 }
        )
      }

      // Generate unique filename
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop() || 'jpg'
      const filename = `${yachtId}_${timestamp}.${fileExtension}`
      const uploadPath = join(process.cwd(), 'public', 'yachts', filename)
      
      // Save file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(uploadPath, buffer)
      
      finalUrl = `/yachts/${filename}`
    } else {
      // Handle URL validation
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return NextResponse.json(
          { error: 'Image URL must be a valid URL' },
          { status: 400 }
        )
      }
      finalUrl = url
    }

    // Check if this would be the primary image
    if (isPrimary) {
      // Remove existing primary flag for this yacht
      await pool.query(
        'UPDATE images SET is_primary = false WHERE yacht_model_id = $1',
        [yachtId]
      )
    }

    // Insert image record
    const result = await pool.query(
      `
        INSERT INTO images (
          yacht_model_id, url, caption, alt_text, is_primary, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, url, caption, alt_text, is_primary, sort_order, created_at
      `,
      [yachtId, finalUrl, caption || null, altText || null, isPrimary, sortOrder]
    )

    const image = result.rows[0]
    
    // Revalidate cache
    revalidateTag('yachts')
    revalidateTag(`yacht:${yachtId}`)

    return NextResponse.json({ 
      message: 'Image uploaded successfully',
      image 
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to upload image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {

  try {
    await ensureSchema()
    const { id } = params
    const yachtId = parseInt(id, 10)
    
    if (isNaN(yachtId)) {
      return NextResponse.json(
        { error: 'Invalid yacht ID' },
        { status: 400 }
      )
    }

    // Check if yacht exists
    const yachtCheck = await pool.query(
      'SELECT id FROM yacht_models WHERE id = $1',
      [yachtId]
    )
    
    if (yachtCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Yacht not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      )
    }

    const parsedImageId = parseInt(imageId, 10)
    if (isNaN(parsedImageId)) {
      return NextResponse.json(
        { error: 'Invalid image ID' },
        { status: 400 }
      )
    }

    // Get image info before deleting (to potentially remove file)
    const imageInfo = await pool.query(
      'SELECT url FROM images WHERE id = $1 AND yacht_model_id = $2',
      [parsedImageId, yachtId]
    )

    if (imageInfo.rows.length === 0) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Delete image record
    await pool.query(
      'DELETE FROM images WHERE id = $1 AND yacht_model_id = $2',
      [parsedImageId, yachtId]
    )

    // Note: In a production environment, you would also delete the actual file
    // from the filesystem if it was uploaded via file upload (not URL)

    // Revalidate cache
    revalidateTag('yachts')
    revalidateTag(`yacht:${yachtId}`)

    return NextResponse.json({ 
      message: 'Image deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete image:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}