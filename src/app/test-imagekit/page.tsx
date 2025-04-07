'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function TestImageKit() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{ url: string; fileId: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        // Call the upload API
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64,
            fileName: file.name,
            folder: 'test-uploads'
          }),
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        const result = await response.json();
        setUploadedImage({ url: result.url, fileId: result.fileId });
        toast.success('Image uploaded successfully!');
      };
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!uploadedImage?.fileId) {
      toast.error('No image to delete');
      return;
    }
    
    setDeleting(true);
    try {
      const response = await fetch('/api/delete-image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: uploadedImage.fileId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      
      toast.success('Image deleted successfully!');
      setUploadedImage(null);
      setFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete image');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">ImageKit Integration Test</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Select an image to upload</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        
        {previewUrl && (
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Preview:</h2>
            <img src={previewUrl} alt="Preview" className="max-h-60 max-w-full object-contain border rounded" />
          </div>
        )}
        
        <div className="mb-6">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`mr-3 px-4 py-2 rounded-md text-white ${
              !file || uploading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
        </div>
        
        {uploadedImage && (
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium mb-2">Uploaded Image:</h2>
            <div className="mb-4">
              <img src={uploadedImage.url} alt="Uploaded" className="max-h-60 max-w-full object-contain border rounded" />
            </div>
            
            <div className="mb-2">
              <strong>Image URL:</strong> 
              <a href={uploadedImage.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">
                {uploadedImage.url}
              </a>
            </div>
            
            <div className="mb-4">
              <strong>File ID:</strong> <span className="ml-2">{uploadedImage.fileId}</span>
            </div>
            
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`px-4 py-2 rounded-md text-white ${
                deleting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {deleting ? 'Deleting...' : 'Delete Image'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 