"use client";

import { useRef, useState } from "react";
import { Camera, type CameraType } from "react-camera-pro";
import { Button } from "@kostas/ui";

export function CameraCapture({
  onCapture,
}: {
  onCapture: (dataUrl: string) => void;
}) {
  const cameraRef = useRef<CameraType>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleShoot() {
    const dataUrl = cameraRef.current?.takePhoto();
    if (typeof dataUrl === "string") {
      setPreview(dataUrl);
      onCapture(dataUrl);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- base64 capture, not an optimizable asset
        <img
          src={preview}
          alt="Captured"
          className="aspect-video w-full rounded-md object-cover"
        />
      ) : (
        <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
          <Camera
            ref={cameraRef}
            errorMessages={{
              noCameraAccessible: "No camera accessible.",
              permissionDenied: "Camera permission denied.",
              switchCamera: "Cannot switch camera.",
              canvas: "Canvas not supported.",
            }}
            facingMode="environment"
            aspectRatio={16 / 9}
          />
        </div>
      )}
      <div className="flex gap-2">
        {preview ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setPreview(null)}
          >
            Retake
          </Button>
        ) : (
          <Button type="button" onClick={handleShoot}>
            Capture photo
          </Button>
        )}
      </div>
    </div>
  );
}
