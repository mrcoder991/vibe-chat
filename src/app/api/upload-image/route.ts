import { NextResponse } from 'next/server';
import imagekit from '@/lib/imagekit';

export async function POST(request: Request) {
  try {
    const { image, fileName, folder } = await request.json();

    // Input validation
    if (!image) {
      return NextResponse.json(
        { success: false, message: 'Image data is required' },
        { status: 400 }
      );
    }

    if (!fileName) {
      return NextResponse.json(
        { success: false, message: 'File name is required' },
        { status: 400 }
      );
    }

    // Extract base64 data
    const base64Data = image.split(',');
    if (base64Data.length !== 2) {
      return NextResponse.json(
        { success: false, message: 'Invalid image format' },
        { status: 400 }
      );
    }
    
    // Remove data:image/xyz;base64, prefix from base64 string
    const base64Image = base64Data[1];
    
    // Prepare upload options
    const uploadOptions = {
      file: base64Image,
      fileName: fileName,
      folder: folder || 'chat_images',
      useUniqueFileName: false, // Use the provided fileName which already has UUID
    };
    
    console.log(`Uploading image to ImageKit: ${fileName} in folder: ${folder || 'chat_images'}`);
    
    // Upload to ImageKit
    const result = await imagekit.upload(uploadOptions);

    console.log(`Image uploaded successfully: ${result.name} (${result.fileId})`);
    
    return NextResponse.json({ 
      success: true, 
      url: result.url,
      fileId: result.fileId,
      name: result.name,
      size: result.size,
      filePath: result.filePath,
      height: result.height,
      width: result.width,
    });
  } catch (error) {
    console.error('Error in upload-image route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { success: false, message: `Image upload failed: ${errorMessage}` },
      { status: 500 }
    );
  }
} 