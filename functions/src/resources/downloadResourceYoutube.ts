import * as functions from "firebase-functions";
import { Storage } from "@google-cloud/storage";
import * as path from "path";
import * as os from "os";
import { log } from "firebase-functions/logger";
import * as fs from "fs";
import { HttpsError } from "firebase-functions/v2/https";
import * as ytdl from "@distube/ytdl-core";

type DownloadYoutubeVideoRequest = {
  url: string;
  userMetadata: {
    userId: string;
    username: string;
  };
};

type DownloadYoutubeVideoResponse = {
  success: boolean;
  message?: string;
};

const storage = new Storage();
const BUCKET_NAME = "youtube-temp-storage";

export const downloadYoutubeVideoFn = functions.https.onCall<
  DownloadYoutubeVideoRequest,
  Promise<DownloadYoutubeVideoResponse>
>(async (req) => {
  try {
    // Authentication check
    if (!req.auth) {
      throw new HttpsError("permission-denied", "User not authenticated");
    }

    const { url, userMetadata } = req.data ?? {};

    // Validate request data
    if (!url || !userMetadata || !ytdl.validateURL(url)) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid URL or missing user data."
      );
    }

    const tempFilePath = path.join(
      os.tmpdir(),
      `video-${userMetadata.userId}.mp4`
    );
    const blobName = `videos/${userMetadata.userId}-${Date.now()}.mp4`;

    log(`Downloading video from ${url}...`);
    await new Promise((resolve, reject) => {
      ytdl(url, {
        quality: "highest",
        filter: (format) =>
          format.container === "mp4" && format.hasVideo && format.hasAudio,
      })
        .pipe(fs.createWriteStream(tempFilePath))
        .on("finish", resolve)
        .on("error", reject);
    });

    await storage
      .bucket(BUCKET_NAME)
      .upload(tempFilePath, { destination: blobName });
    fs.unlinkSync(tempFilePath);

    log(`Uploaded to GCS bucket as ${blobName}`);
    return { success: true, message: "Download successful!" };
  } catch (error: any) {
    console.error("Error:", error);
    // if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    throw new HttpsError("internal", `Download failed: ${error.message}`);
  }
});
