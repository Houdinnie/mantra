/**
 * Voice upload endpoint — receives raw audio blob from browser MediaRecorder,
 * stores it temporarily, returns a URL for the tRPC transcribe procedure.
 */

import type { Express, Request, Response } from "express";
import { storagePut } from "../storage";

export async function registerVoiceUpload(app: Express) {
  // POST /api/voice/upload — receives raw audio, stores, returns URL
  app.post("/api/voice/upload", async (req: Request, res: Response) => {
    try {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      await new Promise<void>(resolve => req.on("end", resolve));

      const audioBuffer = Buffer.concat(chunks);
      if (!audioBuffer.length) {
        res.status(400).json({ error: "Empty audio data" });
        return;
      }

      const contentType =
        (req.headers["content-type"] as string) || "audio/webm";
      const ext =
        contentType.includes("mp4") || contentType.includes("m4a")
          ? "m4a"
          : contentType.includes("ogg")
            ? "ogg"
            : contentType.includes("wav")
              ? "wav"
              : "webm";

      const { url } = await storagePut(
        `voice/${Date.now()}.${ext}`,
        audioBuffer,
        contentType
      );

      res.json({ url, size: audioBuffer.length });
    } catch (error) {
      console.error("[Voice Upload]", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });
}
