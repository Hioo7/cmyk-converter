import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    console.log('API route called - POST method');
    
    const formData = await request.formData();
    const file = formData.get('image') as File;

    console.log('File received:', file?.name, file?.type);

    if (!file) {
      console.log('No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      console.log('Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, JPEG, and PNG are supported.' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('Processing image with Sharp...');

    // Get image metadata
    const metadata = await sharp(buffer).metadata();

    // Create preview version (RGB JPEG for display)
    const previewBuffer = await sharp(buffer)
      .jpeg({ quality: 90 })
      .toBuffer();

    // Convert to CMYK TIFF
    const convertedBuffer = await sharp(buffer)
      .tiff({
        compression: 'lzw',
        quality: 100,
        predictor: 'horizontal',
      })
      .toColorspace('cmyk')
      .toBuffer();

    console.log('Conversion successful');

    // Convert buffers to base64 for direct transmission
    const previewBase64 = `data:image/jpeg;base64,${previewBuffer.toString('base64')}`;
    const convertedBase64 = `data:image/tiff;base64,${convertedBuffer.toString('base64')}`;

    return NextResponse.json({
      success: true,
      previewUrl: previewBase64,
      downloadData: convertedBase64,
      filename: `${file.name.split('.')[0]}_cmyk.tiff`,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: 'TIFF (CMYK)',
        size: convertedBuffer.length,
      },
    });

  } catch (error) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert image. Please try again.' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}