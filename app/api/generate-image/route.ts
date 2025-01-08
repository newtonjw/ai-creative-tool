import { NextResponse } from "next/server";
import Replicate from "replicate";
import { FluxModelInput, ModelType } from "@/types/replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

export async function POST(request: Request) {
  if (!process.env.REPLICATE_API_KEY) {
    return NextResponse.json(
      { detail: "REPLICATE_API_KEY is not set" },
      { status: 500 }
    );
  }

  try {
    const { prompt, model } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'No prompt provided' },
        { status: 400 }
      );
    }

    if (!model || !["black-forest-labs/flux-schnell", "black-forest-labs/flux-1.1-pro"].includes(model)) {
      return NextResponse.json(
        { error: 'Invalid model selected' },
        { status: 400 }
      );
    }

    console.log('Creating prediction with model:', model);
    const prediction = await replicate.predictions.create({
      model: model as ModelType,
      input: { 
        prompt,
        aspect_ratio: "16:9",
        num_inference_steps: 4,
        negative_prompt: "low quality, bad anatomy, bad hands, cropped, worst quality",
        output_format: "png"
      } as FluxModelInput
    });
    console.log('Prediction response:', prediction);

    return NextResponse.json(prediction, { status: 201 });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { detail: (error as Error).message },
      { status: 500 }
    );
  }
}
