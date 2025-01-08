import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get('url');
    console.log('Received download request for URL:', url);
    
    if (!url) {
      console.error('URL parameter is missing');
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('Fetching video from URL:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Failed to fetch video:', response.statusText);
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    console.log('Video fetched successfully, preparing download...');
    const videoBuffer = await response.arrayBuffer();
    
    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="live2d-animation-${Date.now()}.mp4"`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download video' },
      { status: 500 }
    );
  }
}
