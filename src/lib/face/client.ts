// Browser-only wrapper around @vladmandic/face-api.
// Import ONLY from client components. The face-api ESM bundle (with TensorFlow.js)
// is dynamically imported so it stays out of the server bundle and only loads in
// the browser when first needed. Model weights are served from /public/models.

type FaceApi = typeof import("@vladmandic/face-api");

let faceApiPromise: Promise<FaceApi> | null = null;
let modelsLoaded = false;

async function getFaceApi(): Promise<FaceApi> {
  if (!faceApiPromise) {
    faceApiPromise = import("@vladmandic/face-api");
  }
  return faceApiPromise;
}

export async function loadFaceModels(onProgress?: (message: string) => void): Promise<void> {
  if (modelsLoaded) return;
  const faceapi = await getFaceApi();
  onProgress?.("Loading face detector…");
  await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
  onProgress?.("Loading facial landmarks…");
  await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
  onProgress?.("Loading recognition model…");
  await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
  modelsLoaded = true;
}

export interface FaceCaptureResult {
  descriptor: number[]; // 128-d face embedding
  detectionScore: number; // detector confidence 0..1
}

// Detect a single face in the given video/image element and return its 128-d
// descriptor. Returns null when no face (or more than usable signal) is found.
export async function captureDescriptor(
  input: HTMLVideoElement | HTMLImageElement,
): Promise<FaceCaptureResult | null> {
  const faceapi = await getFaceApi();
  const detection = await faceapi
    .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;
  return {
    descriptor: Array.from(detection.descriptor as Float32Array),
    detectionScore: detection.detection.score,
  };
}
