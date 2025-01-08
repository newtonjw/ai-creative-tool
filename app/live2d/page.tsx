'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Loader2, Download } from "lucide-react";
import { Live2DPrediction } from "@/types/replicate";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Live2D() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [motionPrompt, setMotionPrompt] = useState<string>("");
  const [prediction, setPrediction] = useState<Live2DPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownload = async (url: string) => {
    try {
      console.log('Attempting to download from URL:', url);
      setIsDownloading(true);
      
      // 상대 경로를 절대 경로로 변환
      const absoluteUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
      console.log('Absolute URL:', absoluteUrl);
      
      const response = await fetch(absoluteUrl);
      
      if (!response.ok) {
        throw new Error('Failed to download video');
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `live2d-animation-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download video');
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkPrediction = async () => {
      if (!prediction?.id || prediction.status === 'succeeded' || prediction.status === 'failed') {
        return;
      }

      try {
        const response = await fetch(`/api/live2d/${prediction.id}`);
        if (!response.ok) throw new Error('Failed to check prediction status');
        
        const updatedPrediction = await response.json();
        if (isMounted) {
          setPrediction(updatedPrediction);
          if (updatedPrediction.status === 'failed') {
            setError(updatedPrediction.error || 'Generation failed');
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Error checking prediction:', error);
        if (isMounted) {
          setError('Failed to check generation status');
          setIsLoading(false);
        }
      }
    };

    const pollPrediction = async () => {
      while (prediction?.status !== 'succeeded' && prediction?.status !== 'failed') {
        await sleep(1000);
        await checkPrediction();
      }
      if (prediction?.status === 'succeeded') {
        setIsLoading(false);
      }
    };

    if (prediction?.id) {
      pollPrediction();
    }

    return () => {
      isMounted = false;
    };
  }, [prediction?.id, prediction?.status]);

  const handleSubmit = async () => {
    if (!image || !preview) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/live2d', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_frame_image: preview,
          motion_prompt: motionPrompt || "natural movement",
        }),
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (response.status !== 201) {
        throw new Error(data.error || 'Failed to generate animation');
      }

      console.log('Generation completed:', data);
      setIsLoading(false);

      if (data.status === 'succeeded' && data.output) {
        console.log('Setting prediction with output:', data.output);
        setPrediction({
          id: data.id || '',
          status: 'succeeded',
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          output: data.output,
          error: null,
          urls: {
            stream: '',
            get: '',
            cancel: ''
          }
        });
      } else {
        console.error('Unexpected output format:', data.output);
        throw new Error('Unexpected output format from API');
      }
    } catch (error: unknown) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>2D Image to Video</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Upload Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              />
            </div>

            <div className="grid w-full gap-2">
              <Label htmlFor="motion-prompt">Motion Description</Label>
              <Textarea
                id="motion-prompt"
                placeholder="Create an animation where a small, tricolor puppy lying on the ground wakes up. The puppy stretches its legs and body gracefully, yawns adorably, and then stands up with a slight wag of its tail. The movements should be natural and smooth, with an emphasis on the cuteness of the puppy's gestures."
                value={motionPrompt}
                onChange={(e) => setMotionPrompt(e.target.value)}
                className="h-32 resize-y min-h-[8rem]"
              />
            </div>

            {preview && (
              <div className="relative w-full aspect-video">
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  className="object-contain"
                />
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!image || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Animation...
                </>
              ) : (
                'Generate Animation'
              )}
            </Button>

            {error && (
              <div className="text-red-500 text-sm mt-2">{error}</div>
            )}

            {prediction?.status === 'succeeded' && prediction.output && (
              <div className="space-y-4 mt-4">
                <div className="relative w-full max-w-[500px] mx-auto rounded-lg overflow-hidden">
                  <video
                    controls
                    className="w-full h-full"
                    src={prediction.output.startsWith('http') 
                      ? prediction.output 
                      : `${window.location.origin}${prediction.output}`}
                    preload="auto"
                    playsInline
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <Button
                  className="w-full"
                  onClick={() => prediction.output && handleDownload(prediction.output)}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download Video
                    </>
                  )}
                </Button>
              </div>
            )}

            {isLoading && prediction?.status && prediction.status !== 'succeeded' && (
              <div className="text-sm text-gray-500 mt-2">
                Status: {prediction.status}...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
