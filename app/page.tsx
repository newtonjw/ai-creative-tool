'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight, ImageIcon, Wand2, Video, Music } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12 pt-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text py-2">
            AI Creative Tools
          </h1>
          <p className="text-xl text-muted-foreground">
            Generate images, create videos, and enhance content with powerful AI technology
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                Generate Image
              </CardTitle>
              <CardDescription>
                Generate images with AI using text prompts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <ul className="list-disc list-inside space-y-2">
                    <li>High-quality image generation</li>
                    <li>Multiple style options</li>
                    <li>Detailed prompt control</li>
                  </ul>
                </div>
                <Link href="/generate-image" className="block">
                  <Button className="w-full group-hover:bg-primary/90">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Remove Background
              </CardTitle>
              <CardDescription>
                Remove background from your images with AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <ul className="list-disc list-inside space-y-2">
                    <li>High-quality background removal</li>
                    <li>Fast processing speed</li>
                    <li>Support for various image formats</li>
                  </ul>
                </div>
                <Link href="/remove-background" className="block">
                  <Button className="w-full group-hover:bg-primary/90">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                2D Image to Video
              </CardTitle>
              <CardDescription>
                Convert your 2D images into animated videos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <ul className="list-disc list-inside space-y-2">
                    <li>Multiple motion types</li>
                    <li>Adjustable animation speed</li>
                    <li>High-quality video output</li>
                    <li>Easy-to-use interface</li>
                  </ul>
                </div>
                <Link href="/live2d" className="block">
                  <Button className="w-full group-hover:bg-primary/90">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5" />
                Add Sound to Video
              </CardTitle>
              <CardDescription>
                Enhance your videos with AI-powered sound generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <ul className="list-disc list-inside space-y-2">
                    <li>AI-powered sound generation</li>
                    <li>Multiple sound styles</li>
                    <li>Easy video enhancement</li>
                    <li>High-quality audio output</li>
                  </ul>
                </div>
                <Link href="/soundtovideo" className="block">
                  <Button className="w-full group-hover:bg-primary/90">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
