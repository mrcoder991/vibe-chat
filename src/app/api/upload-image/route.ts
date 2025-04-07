import { NextResponse } from 'next/server';
import imagekit from '@/lib/imagekit';

export async function POST(request: Request) {
  try {
    const { image, fileName, folder } = await request.json();

    // Remove data:image/xyz;base64, prefix from base64 string
    const base64Image = image.split(',')[1];
    
    // Upload to ImageKit
    const result = await imagekit.upload({
      file: base64Image,
      fileName: fileName,
      folder: folder,
    });

    return NextResponse.json({ 
      success: true, 
      url: result.url,
      fileId: result.fileId,
    });
  } catch (error) {
    console.error('Error in upload-image route:', error);
    return NextResponse.json(
      { success: false, message: 'Image upload failed' },
      { status: 500 }
    );
  }
} 