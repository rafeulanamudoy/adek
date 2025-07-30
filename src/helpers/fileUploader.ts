import multer from "multer";

// Use in-memory storage
const storage = multer.memoryStorage();

// Supported MIME types for images
const allowedImageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

const upload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter: (req, file, cb) => {
    const mimetype = file.mimetype;


    cb(null, true);
    // Allow specific image types, and all audio/video types
  },
});

// Upload handlers
const selfie = upload.single("selfie");
const profileImage = upload.single("profileImage");
const chatImage = upload.single("chatImage");
const articleImage = upload.single("articleImage");
const goalImage = upload.single("goalImage");

const uploadGroundSound = upload.fields([
  { name: "soundAudioFile", maxCount: 1 },
  { name: "soundImage", maxCount: 1 },
]);

const userImage = upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "coverPhoto", maxCount: 1 },
]);

const providerDocument = upload.single("document");

const communityPostDoc=upload.fields([
  { name: "imageUrl", maxCount: 1 },
  { name: "videoUrl", maxCount: 1 },
])
const groupImage = upload.single("groupImage");
// Export all configured upload handlers
export const fileUploader = {
  selfie,
  profileImage,
  chatImage,
  uploadGroundSound,
  providerDocument,
  articleImage,
  goalImage,
  userImage,
  communityPostDoc,
  groupImage
};
