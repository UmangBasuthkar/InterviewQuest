import { Configuration, OpenAIApi } from "openai";
import { IncomingForm } from "formidable";
const fs = require("fs");

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 3000;

export default async function handler(req: any, res: any) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  // Here, we create a temporary file to store the audio file using Vercel's tmp directory
  // As we compressed the file and are limiting recordings to 2.5 minutes, we won't run into trouble with storage capacity
  try {
    const { fields, files } = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
      const form = new IncomingForm({
        multiples: false,
        uploadDir: "./tmp",
        keepExtensions: true,
      });
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const videoFile = files.file;
    const videoFilePath = videoFile?.filepath;
    if (!videoFilePath) {
      throw new Error("No file uploaded.");
    }

    let transcriptionResponse;
    let retries = 0;

    while (retries <= MAX_RETRIES) {
      try {
        transcriptionResponse = await openai.createTranscription(
          fs.createReadStream(videoFilePath) as any, // cast if needed
          "whisper-1"
        );
        break; // Success
      } catch (error: any) {
        if (error.response?.status === 429 && retries < MAX_RETRIES) {
          console.warn(`Rate limit hit. Retrying in ${RETRY_DELAY / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          retries++;
          continue;
        } else {
          throw error; // Other error: stop retrying
        }
      }
    }

    const transcript = transcriptionResponse?.data?.text;
    if (!transcript) {
      throw new Error("Failed to get transcription.");
    }

    const moderationResponse = await openai.createModeration({
      input: transcript,
    });

    if (moderationResponse?.data?.results[0]?.flagged) {
      res.status(200).json({ error: "Inappropriate content detected. Please try again." });
    } else {
      res.status(200).json({ transcript });
    }

    // Clean up the uploaded file
    fs.unlink(videoFilePath, (err: any) => {
      if (err) console.error("Failed to delete temp file:", err);
    });

  } catch (error: any) {
    if (error.response) {
      console.error("OpenAI API Error:", error.response.status, error.response.data);
    } else {
      console.error("Server Error:", error.message);
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
}