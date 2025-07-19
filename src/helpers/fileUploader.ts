import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

  

// Upload single images
const selfie = upload.single("selfie");
const profileImage = upload.single("profileImage");
const chatImage=upload.single("chatImage")

const uploadUserImages = upload.fields([
  { name: "selfie", maxCount: 1 },
  { name: "profileImage", maxCount: 1 },

  { name: "gallery", maxCount: 6 },

]);

export const fileUploader = {
  selfie,
  profileImage,
chatImage,
uploadUserImages

};
