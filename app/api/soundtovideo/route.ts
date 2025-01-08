import { NextResponse } from 'next/server';
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

    const { prompt, videoFile } = await req.json();
    console.log('Received request with prompt:', prompt);

    if (!videoFile || !prompt) {
      return NextResponse.json(
        { error: "Video and prompt are required" },
        { status: 400 }
      );
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    console.log('Making request to Replicate API with params:', {
      video: '(video file)',
      prompt: prompt
    });

    const output = await replicate.run(
      "zsxkib/mmaudio:4b9f801a167b1f6cc2db6ba7ffdeb307630bf411841d4e8300e63ca992de0be9",
      {
        input: {
          video: videoFile,
          prompt: prompt,
        }
      }
    );

    console.log('Raw output from Replicate:', output);

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
      const fileName = `soundtovideo-${timestamp}.mp4`;
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
      // URL인 경우 파일 다운로드 후 저장
      const response = await fetch(outputValue);
      const buffer = await response.arrayBuffer();

      const timestamp = Date.now();
      const fileName = `soundtovideo-${timestamp}.mp4`;
      const publicPath = `/tmp/${fileName}`;
      const fullPath = path.join(process.cwd(), 'public', 'tmp', fileName);

      // 디렉토리가 없으면 생성
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // 파일 저장
      await fs.writeFile(fullPath, Buffer.from(buffer));

      console.log('Video downloaded and saved to:', fullPath);
      return NextResponse.json({ 
        status: 'succeeded',
        output: publicPath
      }, { status: 201 });
    }

    console.error('Unexpected output format:', output);
    return NextResponse.json({ 
      error: 'Unexpected output format from API'
    }, { status: 500 });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: "Error processing your request" },
      { status: 500 }
    );
  }
}
