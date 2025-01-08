import { NextResponse } from "next/server";
import Replicate from "replicate";
import path from 'path';
import * as fs from 'fs/promises';

const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
console.log('API Key available:', !!REPLICATE_API_KEY);

export async function POST(req: Request) {
  try {
    if (!REPLICATE_API_KEY) {
      console.error('API Key is missing in environment variables');
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    const { first_frame_image, seed, motion_prompt } = await req.json();
    console.log('Received request with motion_prompt:', motion_prompt);

    if (!first_frame_image) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      );
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    console.log('Making request to Replicate API with params:', {
      first_frame_image: '(base64 image)',
      prompt: motion_prompt
    });

    const output = await replicate.run(
      "minimax/video-01-live",
      {
        input: {
          first_frame_image,
          seed: seed || Math.floor(Math.random() * 1000000),
          motion_type: "live",
          motion_speed: 1,
          prompt: motion_prompt || "natural movement",
          prompt_optimizer: true
        }
      }
    );

    console.log('Raw output from Replicate:', output);

    if (!output) {
      throw new Error('No output received from Replicate');
    }

    // ReadableStream 처리
    if (output && typeof output === 'object' && 'locked' in output) {
      const reader = (output as ReadableStream).getReader();
      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }

      // 임시 파일로 저장하고 URL 생성
      const timestamp = Date.now();
      const fileName = `live2d-animation-${timestamp}.mp4`;
      const publicPath = `/tmp/${fileName}`;
      const fullPath = path.join(process.cwd(), 'public', 'tmp', fileName);

      // 디렉토리가 없으면 생성
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // 모든 청크를 하나의 버퍼로 합치기
      const buffer = Buffer.concat(chunks);

      // 바이너리 데이터를 파일로 저장
      await fs.writeFile(fullPath, buffer);

      console.log('Video saved to:', fullPath);
      return NextResponse.json({ 
        status: 'succeeded',
        output: publicPath
      }, { status: 201 });
    }

    // 이미 URL인 경우
    const outputValue = output as string | string[];
    if (typeof outputValue === 'string' && outputValue.startsWith('http')) {
      return NextResponse.json({ 
        status: 'succeeded',
        output: outputValue 
      }, { status: 201 });
    }

    console.error('Unexpected output format:', output);
    return NextResponse.json({ 
      error: 'Unexpected output format from API'
    }, { status: 500 });
  } catch (err: unknown) {
    console.error("Error in live2d route:", err);
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    const prediction = await replicate.predictions.get(params.id);
    console.log('Prediction fetched successfully:', prediction);
    return NextResponse.json(prediction, { status: 200 });
  } catch (err: unknown) {
    console.error("Error in live2d GET route:", err);
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
