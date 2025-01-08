'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import { Loader2, Download, Wand2 } from "lucide-react";
import { ModelType, Prediction } from "@/types/replicate";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MODELS = [
  { 
    id: "black-forest-labs/flux-schnell", 
    name: "Flux Schnell",
    description: "Fast and optimized model - Perfect for personal use"
  },
  { 
    id: "black-forest-labs/flux-1.1-pro", 
    name: "Flux 1.1 Pro",
    description: "High-quality image generation with excellent prompt adherence"
  },
]

export default function GenerateImage() {
  const [prompt, setPrompt] = useState<string>(""); 
  const [model, setModel] = useState<ModelType | "">("");
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt || !model) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, model }),
      });

      let prediction = await response.json();

      if (response.status !== 201) {
        setError(prediction.detail);
        setIsLoading(false);
        return;
      }

      setPrediction(prediction);

      while (
        prediction.status !== "succeeded" &&
        prediction.status !== "failed"
      ) {
        await sleep(1000);
        const response = await fetch("/api/generate-image/" + prediction.id);
        prediction = await response.json();
        
        if (response.status !== 200) {
          setError(prediction.detail);
          setIsLoading(false);
          return;
        }

        if (prediction.status === "failed") {
          setError("Image generation failed");
          setIsLoading(false);
          return;
        }

        if (prediction.status === "succeeded") {
          if (!prediction.output?.[0]) {
            if (prediction.urls?.stream) {
              prediction = {
                ...prediction,
                output: [prediction.urls.stream]
              };
            } else {
              setError("No image URL available");
              setIsLoading(false);
              return;
            }
          }
        }

        setPrediction(prediction);
      }
      setIsLoading(false);
    } catch {
      console.error('Error:');
      setError('Failed to generate image');
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!prediction?.output?.[0]) {
      setError('Image URL not available');
      return;
    }
    
    try {
      const imageUrl = prediction.output[0];
      const finalUrl = imageUrl.includes('stream.replicate.com') ? imageUrl : prediction.urls?.stream || imageUrl;
      
      const response = await fetch(finalUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }

      const blob = await response.blob();
      const contentType = response.headers.get('content-type');
      const extension = contentType?.includes('jpeg') ? 'jpg' : 
                       contentType?.includes('png') ? 'png' : 
                       'jpg';
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-image-${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError('Failed to download image');
    }
  };

  const getImageUrl = (prediction: Prediction) => {
    if (!prediction?.output) return null;
    const output = prediction.output;
    return typeof output === 'string' ? output : Array.isArray(output) && output.length > 0 ? output[0] : null;
  };

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Generate Image</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Select
                value={model}
                onValueChange={(value) => setModel(value as ModelType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model to generate image" />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((model) => (
                    <SelectItem
                      key={model.id}
                      value={model.id}
                      className="space-y-1"
                    >
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {model.description}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Textarea
                placeholder="Describe the image you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <Button
              type="submit"
              disabled={!prompt || !model || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg text-center">
              {error}
            </div>
          )}

          {prediction?.output && (
            <div className="space-y-4">
              <div className="relative aspect-video w-full">
                {getImageUrl(prediction) && (
                  <Image
                    src={getImageUrl(prediction)!}
                    alt="Generated image"
                    fill
                    className="rounded-lg object-contain"
                    priority
                    unoptimized
                  />
                )}
              </div>
              <Button 
                onClick={handleDownload}
                className="w-full"
                variant="outline"
                disabled={!getImageUrl(prediction)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Image
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}