export interface Prediction {
  id: string;
  version: string;
  input: {
    prompt: string;
  };
  output: string[];
  status: "starting" | "processing" | "succeeded" | "failed";
  error?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  urls?: {
    stream?: string;
    get?: string;
    cancel?: string;
  };
}

export interface PredictionResponse {
  detail?: string;
}

export type ModelType = "black-forest-labs/flux-schnell" | "black-forest-labs/flux-1.1-pro";

export interface FluxModelInput {
  prompt: string;
  seed?: number;
  go_fast?: boolean;
  megapixels?: '1' | '0.25';
  num_outputs?: number;
  aspect_ratio?: '1:1' | '16:9' | '21:9' | '3:2' | '2:3' | '4:5' | '5:4' | '3:4' | '4:3' | '9:16' | '9:21';
  output_format?: 'webp' | 'jpg' | 'png';
  output_quality?: number;
  num_inference_steps?: number;
  disable_safety_checker?: boolean;
}

export type Live2DModelType = "minimax/video-01-live";

export interface Live2DPrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed";
  created_at: string;
  completed_at: string | null;
  output: string | null;
  error: string | null;
  urls: {
    stream: string;
    get: string;
    cancel: string;
  };
}

export interface Live2DResponse {
  id: string;
  version: string;
  urls: {
    get: string;
    cancel: string;
  };
}
