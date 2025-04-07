import { NextResponse } from 'next/server';
import imagekit from '@/lib/imagekit';

export async function DELETE(request: Request) {
  try {
    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json(
        { success: false, message: 'File ID is required' },
        { status: 400 }
      );
    }

    // Delete from ImageKit
    await imagekit.deleteFile(fileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete-image route:', error);
    return NextResponse.json(
      { success: false, message: 'Image deletion failed' },
      { status: 500 }
    );
  }
} 