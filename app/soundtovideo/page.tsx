'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Download, Upload } from "lucide-react";

interface Prediction {
  status: string;
  output: string | null;
  error: string | null;
}

export default function SoundToVideo() {
  const [prompt, setPrompt] = useState<string>(""); 
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoFile(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt || !videoFile) return;

    setIsLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const response = await fetch('/api/soundtovideo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          videoFile,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process video');
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }
      setPrediction(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!prediction?.output) return;
    
    try {
      setIsDownloading(true);
      setError(null);

      // 서버를 통해 비디오 다운로드
      const downloadUrl = `/api/soundtovideo/download?url=${encodeURIComponent(prediction.output)}`;
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error('Failed to download video');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `video-with-sound-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      
      // 리소스 정리
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Failed to download video');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Add Sound to Video</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Textarea
                placeholder="Describe the sound you want to add to your video (e.g., 'galloping sound', 'peaceful background music')..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-4">
              <Input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="cursor-pointer"
              />
              {videoFile && (
                <div className="space-y-4">
                  <div className="text-sm text-green-500">
                    Video uploaded successfully
                  </div>
                  <video
                    src={videoFile}
                    controls
                    className="w-full rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="submit"
                disabled={!prompt || !videoFile || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Add Sound
                  </>
                )}
              </Button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {prediction?.output && (
            <div className="mt-6 space-y-4">
              <video
                src={prediction.output}
                controls
                className="w-full rounded-lg shadow-lg"
              />
              <Button
                onClick={handleDownload}
                className="w-full"
                variant="outline"
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
        </CardContent>
      </Card>
    </div>
  );
}
