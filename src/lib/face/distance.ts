// Pure, dependency-free Euclidean distance between two face descriptors.
// Safe to import on server or client (face verification uses it server-side).

export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

// Lower distance = more similar. A typical match threshold for face-api descriptors
// is ~0.5–0.6 (configurable via SystemConfig.faceMatchDistance).
export function isFaceMatch(distance: number, threshold: number): boolean {
  return distance <= threshold;
}
