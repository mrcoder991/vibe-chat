import ImageKit from 'imagekit';

// Initialize ImageKit with your public and private keys
// Get these from your ImageKit dashboard
const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '', // This is used server-side only
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '',
});

// Generate authentication parameters for client-side upload
export const getAuthenticationParameters = () => {
  const token = imagekit.getAuthenticationParameters();
  return token;
};

// Upload image and return URL
export const uploadImage = async (file: File, folder: string): Promise<string> => {
  // Convert file to base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64data = reader.result as string;
      
      try {
        // Upload to ImageKit
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64data,
            fileName: `${Date.now()}-${file.name}`,
            folder: folder,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Upload failed');
        }
        
        resolve(data.url);
      } catch (error) {
        console.error('Error uploading image:', error);
        reject(error);
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
};

// Delete image from ImageKit
export const deleteImage = async (fileId: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/delete-image', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileId,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Delete failed');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

export default imagekit; 