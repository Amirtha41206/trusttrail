import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";

export default function GestureDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Loading camera...");
  const [isDetecting, setIsDetecting] = useState(false);
  const [sosCancelled, setSosCancelled] = useState(false);
  const { setSosActive } = useApp();
  const navigate = useNavigate();
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const sosTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    loadMediaPipe();
    return () => {
      if (cameraRef.current) cameraRef.current.stop();
    };
  }, []);

  const loadMediaPipe = async () => {
    // Load MediaPipe scripts dynamically
    await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
    await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
    await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");

    initMediaPipe();
  };

  const loadScript = (src: string) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      document.head.appendChild(script);
    });
  };

  const initMediaPipe = () => {
    const Hands = (window as any).Hands;
    const Camera = (window as any).Camera;

    const hands = new Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.3,
      selfieMode: true,
    });

    hands.onResults((results: any) => {
      drawResults(results);
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        detectGesture(landmarks);
      }
    });

    handsRef.current = hands;

    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current });
        },
        width: 320,
        height: 240,
      });
      camera.start();
      cameraRef.current = camera;
      setIsDetecting(true);
      setStatus("👁️ Watching for Signal for Help gesture...");
    }
  };

  const drawResults = (results: any) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !videoRef.current) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        (window as any).drawConnectors(ctx, landmarks,
          (window as any).HAND_CONNECTIONS,
          { color: "#00D4AA", lineWidth: 2 }
        );
        (window as any).drawLandmarks(ctx, landmarks,
          { color: "#FF3B6B", lineWidth: 1, radius: 3 }
        );
      }
    }
  };

  // Detect Signal for Help gesture
  // Step 1: Thumb tucked inside palm
  // Step 2: Fingers closed over thumb
  const detectGesture = (landmarks: any[]) => {
    // Landmark indices
    const WRIST = 0;
    const THUMB_TIP = 4;
    const THUMB_MCP = 2;
    const INDEX_TIP = 8;
    const INDEX_MCP = 5;
    const MIDDLE_TIP = 12;
    const MIDDLE_MCP = 9;
    const RING_TIP = 16;
    const RING_MCP = 13;
    const PINKY_TIP = 20;
    const PINKY_MCP = 17;

    // Check if thumb is tucked inside (thumb tip below index finger MCP)
    const thumbTucked =
      landmarks[THUMB_TIP].x > landmarks[INDEX_MCP].x - 0.05 &&
      landmarks[THUMB_TIP].x < landmarks[MIDDLE_MCP].x + 0.05;

    // Check if all fingers are closed (fingertips below their MCPs)
    const indexClosed = landmarks[INDEX_TIP].y > landmarks[INDEX_MCP].y;
    const middleClosed = landmarks[MIDDLE_TIP].y > landmarks[MIDDLE_MCP].y;
    const ringClosed = landmarks[RING_TIP].y > landmarks[RING_MCP].y;
    const pinkyClosed = landmarks[PINKY_TIP].y > landmarks[PINKY_MCP].y;

    const isHelpGesture = thumbTucked && indexClosed && middleClosed && ringClosed && pinkyClosed;

    // Thumbs up = cancel SOS
    const thumbUp =
      landmarks[THUMB_TIP].y < landmarks[WRIST].y - 0.2 &&
      !indexClosed && !middleClosed;

    if (isHelpGesture && !sosTriggeredRef.current) {
      sosTriggeredRef.current = true;
      setStatus("🚨 HELP GESTURE DETECTED! Triggering SOS...");
      triggerSOS();
    } else if (thumbUp && !sosCancelled) {
      setStatus("👍 Thumbs up detected — SOS Cancelled!");
      setSosCancelled(true);
      setTimeout(() => setSosCancelled(false), 3000);
    } else {
      setStatus("👁️ Watching for Signal for Help gesture...");
    }
  };

  const triggerSOS = async () => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        await fetch("http://localhost:3000/api/sos/trigger", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": "user-001",
          },
          body: JSON.stringify({ lat: latitude, lng: longitude }),
        });
      } catch (err) {
        console.error("SOS failed:", err);
      }
      setSosActive(true);
      navigate("/sos-active");
    });
  };

  return (
    <div className="app-container min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-heading font-extrabold text-foreground mb-2">
        👁️ Gesture Detection
      </h1>
      <p className="text-sm text-muted-foreground font-body mb-4 text-center">
        Show the <b>Signal for Help</b> gesture to trigger SOS
      </p>

      {/* Status */}
      <div className={`w-full p-3 rounded-xl mb-4 text-center text-sm font-body font-semibold ${
        status.includes("DETECTED")
          ? "bg-primary/20 text-primary border border-primary"
          : status.includes("Cancelled")
          ? "bg-teal/20 text-teal border border-teal"
          : "bg-card border border-border text-muted-foreground"
      }`}>
        {status}
      </div>

      {/* Camera Feed */}
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-border">
        <video
          ref={videoRef}
          className="w-full"
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />
      </div>

      {/* Instructions */}
      <div className="w-full mt-4 p-4 bg-card rounded-xl border border-border">
        <p className="text-xs font-heading font-bold text-foreground mb-2">
          Signal for Help Gesture:
        </p>
        <p className="text-xs font-body text-muted-foreground">
          1. Hold up your hand, palm facing outward
        </p>
        <p className="text-xs font-body text-muted-foreground">
          2. Tuck your thumb inside your palm
        </p>
        <p className="text-xs font-body text-muted-foreground">
          3. Close your fingers over your thumb
        </p>
        <p className="text-xs font-body text-muted-foreground mt-2">
          👍 Show thumbs up to cancel SOS
        </p>
      </div>

      <button
        onClick={() => navigate("/home")}
        className="mt-4 w-full py-3 bg-card border border-border rounded-xl text-foreground font-body font-semibold"
      >
        ← Back to Home
      </button>
    </div>
  );
}