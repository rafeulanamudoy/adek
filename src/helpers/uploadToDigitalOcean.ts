import { S3Client, S3ClientConfig, ObjectCannedACL } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import path from "path";
import ApiError from "../errors/ApiErrors";
import { ConnectionCheckOutStartedEvent } from "mongodb";

const DO_CONFIG = {
  endpoint: "https://nyc3.digitaloceanspaces.com",
  region: "nyc3",
  credentials: {
    accessKeyId: "DO002RGDJ947DJHJ9WDT",
    secretAccessKey: "e5+/pko6Ojar51Hb8ojUKfq2HtXy+tnGKOfs3rIcEfo",
  },
  spaceName: "smtech-space",
};

const s3Config: S3ClientConfig = {
  endpoint: DO_CONFIG.endpoint,
  region: DO_CONFIG.region,
  credentials: DO_CONFIG.credentials,
  forcePathStyle: true,
};

const s3 = new S3Client(s3Config);

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

const uploadToDigitalOcean = async (
  file: Express.Multer.File
): Promise<string> => {
  try {
    if (!file) {
      throw new ApiError(400, "No file provided");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new ApiError(
        400,
        `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // Use the file's mimetype or fallback to application/octet-stream
    const mimeType = file.mimetype || "application/octet-stream";

    const fileExtension = path.extname(file.originalname) || "";
    const fileName = `uploads/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}${fileExtension}`;

    const uploadParams = {
      Bucket: DO_CONFIG.spaceName,
      Key: fileName,
      Body: file.buffer,
      ACL: "public-read" as ObjectCannedACL,
      ContentType: mimeType,
    };

    const upload = new Upload({
      client: s3,
      params: uploadParams,
    });

    const data = await upload.done();

    const fileUrl =
      data.Location ||
      `${DO_CONFIG.endpoint}/${DO_CONFIG.spaceName}/${fileName}`;

    return fileUrl;
  } catch (error) {
     console.log(error,"check error")
    throw new ApiError(
      500,
      error instanceof Error
        ? `Failed to upload file: ${error.message}`
        : "Failed to upload file to DigitalOcean Spaces"
    );
  }
};

export default uploadToDigitalOcean;
