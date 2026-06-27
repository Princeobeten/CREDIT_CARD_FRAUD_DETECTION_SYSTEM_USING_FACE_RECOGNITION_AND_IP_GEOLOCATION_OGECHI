import "server-only";
import { getFaceDescriptor } from "@/lib/enrollment";
import { euclideanDistance, isFaceMatch } from "@/lib/face/distance";

export interface FaceVerifyResult {
  hasTemplate: boolean;
  matched: boolean;
  distance: number | null;
}

// Compares a freshly captured 128-d descriptor against the cardholder's enrolled
// template by Euclidean distance. Lower distance = closer match.
export async function verifyFace(
  userId: string,
  descriptor: number[],
  threshold: number,
): Promise<FaceVerifyResult> {
  const stored = await getFaceDescriptor(userId);
  if (!stored) {
    return { hasTemplate: false, matched: false, distance: null };
  }
  const distance = euclideanDistance(descriptor, stored);
  return { hasTemplate: true, matched: isFaceMatch(distance, threshold), distance };
}
