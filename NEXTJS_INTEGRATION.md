# Background Remover API - Next.js 통합 가이드

## 소개
이 문서는 배경 제거 API를 Next.js 프로젝트에 통합하는 방법을 설명합니다.

## 프로젝트 설정

### 1. shadcn/ui CLI를 통한 프로젝트 생성
```bash
npx create-next-app@latest my-background-remover --template=shadcn-ui
```

프로젝트 생성 시 다음과 같이 설정하세요:
```bash
Would you like to use TypeScript? Yes
Would you like to use ESLint? Yes
Would you like to use Tailwind CSS? Yes
Would you like to use `src/` directory? Yes
Would you like to use App Router? Yes
Would you like to customize the default import alias (@/*)? Yes
```

### 2. 추가 컴포넌트 설치
프로젝트 디렉토리로 이동 후 필요한 컴포넌트들을 설치합니다:
```bash
cd my-background-remover
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add toast
```

### 3. 추가 패키지 설치
```bash
npm install axios formidable @types/formidable
```

### 4. 환경 변수 설정
`.env.local` 파일을 프로젝트 루트에 생성하고 다음 변수를 추가합니다:

```env
REPLICATE_API_KEY=your_api_key_here
```

## API 라우트 구현

### 1. 배경 제거 API 엔드포인트
`app/api/remove-background/route.ts` 파일을 생성하고 다음 코드를 추가합니다:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import formidable from 'formidable'
import { promises as fs } from 'fs'
import axios from 'axios'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData()
    const file = data.get('image') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // 파일을 Buffer로 변환
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // base64로 인코딩
    const base64Image = buffer.toString('base64')

    // Replicate API 호출
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
    )

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Error processing image:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process image',
        details: error.response?.data || error.message 
      },
      { status: 500 }
    )
  }
}
```

### 2. 상태 확인 API 엔드포인트
`app/api/status/[id]/route.ts` 파일을 생성하고 다음 코드를 추가합니다:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await axios.get(
      `https://api.replicate.com/v1/predictions/${params.id}`,
      {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
        },
      }
    )

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check status',
        details: error.response?.data || error.message 
      },
      { status: 500 }
    )
  }
}
```

## 클라이언트 구현

### 1. 메인 페이지
`app/page.tsx` 파일을 다음과 같이 수정합니다:

```typescript
import ImageUploader from "@/components/image-uploader"

export default function Home() {
  return (
    <main className="container mx-auto py-6">
      <div className="flex flex-col items-center space-y-4">
        <h1 className="text-3xl font-bold">Background Remover</h1>
        <ImageUploader />
      </div>
    </main>
  )
}
```

### 2. 이미지 업로더 컴포넌트
`components/image-uploader.tsx` 파일을 생성하고 다음 코드를 추가합니다:

```typescript
'use client'

import { useState } from 'react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"

export default function ImageUploader() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const { toast } = useToast()

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return

    setLoading(true)
    setProgress(0)
    const formData = new FormData()
    formData.append('image', event.target.files[0])

    try {
      const { data: prediction } = await axios.post('/api/remove-background', formData)
      setProgress(30)

      while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 1000))
        const { data: status } = await axios.get(`/api/status/${prediction.id}`)
        
        if (status.status === 'succeeded') {
          setResult(status.output)
          setProgress(100)
          toast({
            title: "성공",
            description: "이미지 배경이 성공적으로 제거되었습니다.",
          })
          break
        } else if (status.status === 'failed') {
          throw new Error('Image processing failed')
        } else {
          setProgress(prev => Math.min(90, prev + 10))
        }
      }
    } catch (error) {
      console.error('Error processing image:', error)
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: "이미지 처리 중 오류가 발생했습니다.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="space-y-2">
        <Input
          type="file"
          onChange={handleImageUpload}
          accept="image/*"
          disabled={loading}
          className="cursor-pointer"
        />
        {loading && (
          <Progress value={progress} className="w-full" />
        )}
      </div>
      
      {result && (
        <div className="space-y-2">
          <img 
            src={result} 
            alt="Processed" 
            className="w-full rounded-lg shadow-lg"
          />
          <Button
            onClick={() => window.open(result)}
            className="w-full"
            variant="outline"
          >
            Download
          </Button>
        </div>
      )}
    </div>
  )
}
```

## 주의사항

1. App Router를 사용하므로 API 라우트가 `app/api` 디렉토리에 위치하며, `route.ts` 파일명을 사용합니다.
2. 모든 클라이언트 컴포넌트에 'use client' 지시문을 추가해야 합니다.
3. 환경 변수는 반드시 서버 사이드에서만 사용해야 합니다.
4. 파일 업로드 크기는 기본적으로 Next.js의 제한을 따릅니다.

## 에러 처리

- 400: 이미지 파일이 제공되지 않은 경우
- 500: 서버 내부 오류 또는 Replicate API 오류

## 보안 고려사항

1. API 키를 클라이언트에 노출하지 마세요.
2. 파일 업로드 크기를 제한하세요.
3. 허용된 파일 형식만 받도록 설정하세요.
4. CORS 설정을 적절히 구성하세요.
