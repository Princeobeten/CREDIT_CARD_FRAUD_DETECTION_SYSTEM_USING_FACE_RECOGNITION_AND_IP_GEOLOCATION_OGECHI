"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadFaceModels, captureDescriptor } from "@/lib/face/client";

type Phase = "idle" | "starting" | "ready" | "capturing" | "captured" | "error";

export interface CapturePayload {
  descriptor: number[];
  detectionScore: number;
}

export default function FaceCapture({
  onCapture,
  onReset,
  disabled = false,
  captureLabel = "Capture face",
}: {
  onCapture: (payload: CapturePayload) => void;
  onReset?: () => void;
  disabled?: boolean;
  captureLabel?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string>("");
  const [score, setScore] = useState<number | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Routes are hidden (not unmounted) on client navigation in Next 16 — always stop tracks.
  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = useCallback(async () => {
    setPhase("starting");
    setMessage("Requesting camera access…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 480, height: 360 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase("ready");
      setMessage("Position your face in the frame, then capture.");
    } catch {
      setPhase("error");
      setMessage("Could not access the camera. Please grant permission and try again.");
    }
  }, []);

  const capture = useCallback(async () => {
    if (!videoRef.current) return;
    setPhase("capturing");
    try {
      await loadFaceModels((m) => setMessage(m));
      setMessage("Detecting face…");
      const result = await captureDescriptor(videoRef.current);
      if (!result) {
        setPhase("ready");
        setMessage("No face detected. Ensure good lighting and face the camera, then try again.");
        return;
      }
      setScore(result.detectionScore);
      setPhase("captured");
      setMessage("Face captured successfully.");
      onCapture(result);
    } catch {
      setPhase("ready");
      setMessage("Face capture failed. Please try again.");
    }
  }, [onCapture]);

  const recapture = useCallback(() => {
    setScore(null);
    setPhase("ready");
    setMessage("Position your face in the frame, then capture.");
    onReset?.();
  }, [onReset]);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-black">
        <video
          ref={videoRef}
          muted
          playsInline
          className="h-full w-full object-cover [transform:scaleX(-1)]"
        />
        {phase === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
            Camera is off
          </div>
        )}
        {phase === "captured" && (
          <div className="absolute right-2 top-2 rounded-full bg-green-600 px-2 py-1 text-xs font-medium text-white">
            ✓ Captured
          </div>
        )}
      </div>

      {message && (
        <p
          className={`text-sm ${
            phase === "error"
              ? "text-red-600"
              : phase === "captured"
                ? "text-green-700"
                : "text-muted"
          }`}
        >
          {message}
          {phase === "captured" && score != null && (
            <span className="text-muted"> (detection confidence {(score * 100).toFixed(0)}%)</span>
          )}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {phase === "idle" || phase === "error" ? (
          <button
            type="button"
            onClick={startCamera}
            disabled={disabled}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90 disabled:opacity-60"
          >
            Start camera
          </button>
        ) : null}

        {(phase === "ready" || phase === "capturing") && (
          <button
            type="button"
            onClick={capture}
            disabled={disabled || phase === "capturing"}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90 disabled:opacity-60"
          >
            {phase === "capturing" ? "Working…" : captureLabel}
          </button>
        )}

        {phase === "captured" && (
          <button
            type="button"
            onClick={recapture}
            disabled={disabled}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-background disabled:opacity-60"
          >
            Recapture
          </button>
        )}
      </div>
    </div>
  );
}
