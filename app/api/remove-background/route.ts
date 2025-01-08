import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface ReplicateResponse {
  id: string;
  version: string;
  status: string;
  output: string[] | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

async function waitForResult(predictionId: string): Promise<ReplicateResponse> {
  const maxAttempts = 20;
  const delayMs = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await axios.get(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status === 'succeeded') {
      return response.data;
    } else if (response.data.status === 'failed') {
      throw new Error('Image processing failed');
    }

    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  throw new Error('Timeout waiting for result');
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file = data.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Convert file to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Encode to base64
    const base64Image = buffer.toString('base64');

    // Initial API call to start processing
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
        input: {
          image: `data:${file.type};base64,${base64Image}`
        }
      },
      {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Wait for the result
    const result = await waitForResult(response.data.id);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process image' },
      { status: 500 }
    );
  }
}
