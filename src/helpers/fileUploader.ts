import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

// Upload single images
const selfie = upload.single("selfie");
const profileImage = upload.single("profileImage");
const chatImage = upload.single("chatImage");

const articleImage=upload.single("articleImage")
const goalImage=upload.single("goalImage")

const uploadGroundSound = upload.fields([
  { name: "soundAudioFile", maxCount: 1 },
  { name: "soundImage", maxCount: 1 },


]);

const providerDocument = upload.single("document");
export const fileUploader = {
  selfie,
  profileImage,
  chatImage,
  uploadGroundSound,
  providerDocument,
  articleImage,
  goalImage
};
