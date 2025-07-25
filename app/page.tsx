'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, Image as ImageIcon, FileImage, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  previewUrl?: string;
  downloadData?: string;
  filename?: string;
  metadata?: {
    width: number;
    height: number;
    size: number;
    format: string;
  };
  error?: string;
}

export default function Home() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages: ImageFile[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
    }));

    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    multiple: true,
  });

  const convertImage = async (imageFile: ImageFile) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageFile.id ? { ...img, status: 'processing' } : img
      )
    );

    try {
      const formData = new FormData();
      formData.append('image', imageFile.file);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Conversion failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      setImages((prev) =>
        prev.map((img) =>
          img.id === imageFile.id
            ? {
                ...img,
                status: 'completed',
                previewUrl: result.previewUrl,
                downloadData: result.downloadData,
                filename: result.filename,
                metadata: result.metadata,
              }
            : img
        )
      );
    } catch (error) {
      console.error('Conversion error:', error);
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageFile.id
            ? {
                ...img,
                status: 'error',
                error: error instanceof Error ? error.message : 'Failed to convert image. Please try again.',
              }
            : img
        )
      );
    }
  };

  const convertAllImages = async () => {
    setIsProcessing(true);
    const pendingImages = images.filter((img) => img.status === 'pending');

    for (const image of pendingImages) {
      await convertImage(image);
    }

    setIsProcessing(false);
  };

  const downloadImage = async (imageFile: ImageFile) => {
    if (!imageFile.downloadData || !imageFile.filename) return;

    try {
      // Convert base64 to blob
      const base64Data = imageFile.downloadData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/tiff' });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = imageFile.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const clearImages = () => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.preview);
    });
    setImages([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Professional CMYK Converter
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Convert your images to CMYK color space with professional-grade quality.
            Perfect for print preparation and professional photography workflows.
          </p>
        </div>

        {/* Upload Area */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                {isDragActive ? 'Drop images here' : 'Upload Images'}
              </h3>
              <p className="text-slate-500 mb-4">
                Drag and drop your JPG, JPEG, or PNG files here, or click to browse
              </p>
              <Button variant="outline" disabled={isProcessing}>
                <FileImage className="mr-2 h-4 w-4" />
                Choose Files
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {images.length > 0 && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <Button
                    onClick={convertAllImages}
                    disabled={isProcessing || images.every((img) => img.status !== 'pending')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isProcessing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ImageIcon className="mr-2 h-4 w-4" />
                    )}
                    Convert All to CMYK
                  </Button>
                  <Button variant="outline" onClick={clearImages} disabled={isProcessing}>
                    Clear All
                  </Button>
                </div>
                <div className="text-sm text-slate-600">
                  {images.length} image{images.length !== 1 ? 's' : ''} uploaded
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Images Grid */}
        {images.length > 0 && (
          <div className="grid gap-6">
            {images.map((imageFile) => (
              <Card key={imageFile.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg truncate max-w-xs">
                      {imageFile.file.name}
                    </CardTitle>
                    <Badge
                      variant={
                        imageFile.status === 'completed'
                          ? 'default'
                          : imageFile.status === 'error'
                          ? 'destructive'
                          : imageFile.status === 'processing'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {imageFile.status === 'completed' && <CheckCircle className="mr-1 h-3 w-3" />}
                      {imageFile.status === 'error' && <AlertCircle className="mr-1 h-3 w-3" />}
                      {imageFile.status === 'processing' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      {imageFile.status.charAt(0).toUpperCase() + imageFile.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Original Image */}
                    <div>
                      <h4 className="font-semibold mb-3 text-slate-700">Original (RGB)</h4>
                      <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden">
                        <img
                          src={imageFile.preview}
                          alt="Original"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="mt-3 text-sm text-slate-600">
                        <div>Size: {formatFileSize(imageFile.file.size)}</div>
                        <div>Format: {imageFile.file.type}</div>
                      </div>
                    </div>

                    {/* Converted Image */}
                    <div>
                      <h4 className="font-semibold mb-3 text-slate-700">Converted (CMYK)</h4>
                      <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden">
                        {imageFile.status === 'processing' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                              <p className="text-sm text-slate-600">Converting to CMYK...</p>
                            </div>
                          </div>
                        )}
                        {imageFile.status === 'completed' && imageFile.previewUrl && (
                          <img
                            src={imageFile.previewUrl}
                            alt="Converted"
                            className="w-full h-full object-contain"
                          />
                        )}
                        {imageFile.status === 'pending' && (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                            <div className="text-center">
                              <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                              <p className="text-sm">Ready for conversion</p>
                            </div>
                          </div>
                        )}
                        {imageFile.status === 'error' && (
                          <div className="absolute inset-0 flex items-center justify-center text-red-500">
                            <div className="text-center">
                              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                              <p className="text-sm">Conversion failed</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {imageFile.metadata && (
                        <div className="mt-3 text-sm text-slate-600">
                          <div>Dimensions: {imageFile.metadata.width} × {imageFile.metadata.height}</div>
                          <div>Format: TIFF (CMYK)</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Error Message */}
                  {imageFile.status === 'error' && imageFile.error && (
                    <Alert className="mt-4" variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{imageFile.error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={() => convertImage(imageFile)}
                      disabled={imageFile.status !== 'pending' && imageFile.status !== 'error'}
                      variant="outline"
                    >
                      {imageFile.status === 'processing' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ImageIcon className="mr-2 h-4 w-4" />
                      )}
                      Convert to CMYK
                    </Button>
                    
                    {imageFile.status === 'completed' && (
                      <Button
                        onClick={() => downloadImage(imageFile)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download TIFF
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>About CMYK Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600">
                Our professional CMYK converter transforms your RGB images into CMYK color space using advanced color management techniques. 
                The output TIFF format preserves all color information and is perfect for professional printing applications.
              </p>
              <ul className="text-sm text-slate-600 mt-4 space-y-1">
                <li>• Supports JPG, JPEG, and PNG input formats</li>
                <li>• Outputs high-quality TIFF files with CMYK color space</li>
                <li>• Maintains maximum image quality throughout the conversion process</li>
                <li>• Uses professional color management for accurate color reproduction</li>
                <li>• Perfect for print preparation and professional workflows</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}