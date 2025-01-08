import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const prediction = await replicate.predictions.get(params.id);
    
    if (!prediction) {
      return NextResponse.json(
        { detail: "Prediction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(prediction);
  } catch (error) {
    console.error("Error fetching prediction:", error);
    return NextResponse.json(
      { detail: (error as Error).message },
      { status: 500 }
    );
  }
}
