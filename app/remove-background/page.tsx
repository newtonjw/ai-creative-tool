'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Loader2, Download } from "lucide-react";

export default function RemoveBackground() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!image) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch('/api/remove-background', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.output) {
        setResult(data.output);
      } else {
        throw new Error('No output received from the API');
      }
    } catch (error: unknown) {
      console.error('Error removing background:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Failed to remove background');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;

    try {
      const response = await fetch(result);
      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const originalExt = image?.name.split('.').pop() || 'png';
      const fileName = `${image?.name.split('.')[0] || 'image'}_no_bg.${originalExt}`;
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image');
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Background Remover</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-4 border-2 border-dashed border-muted rounded-lg text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90"
              />
            </div>

            {preview && (
              <div className="space-y-4">
                <div className="relative aspect-video w-full">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="rounded-lg object-contain"
                    priority
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!image || loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Remove Background'
                  )}
                </Button>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="relative aspect-video w-full">
                  <Image
                    src={result}
                    alt="Result"
                    fill
                    className="rounded-lg object-contain"
                    priority
                    unoptimized
                  />
                </div>
                <Button
                  onClick={handleDownload}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Image
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
