import express from "express";
import { authController } from "./auth.controller";
import validateRequest from "../../middlewares/validateRequest";
import { authValidation } from "./auth.validation";


import verifyOtpToken from "../../middlewares/verifyOtpToken";
import auth from "../../middlewares/auth";


const router = express.Router();

router.post(
  "/login",
  validateRequest(authValidation.authLoginSchema),
  authController.loginUser
);




router.post(
  "/forgetpassword-otp-to-gmail",
  authController.forgetPasswordToGmail
);

router.post("/verfiy-otp",  validateRequest(authValidation.verifyOtpSchema), verifyOtpToken(), authController.verifyOtp);
router.patch(
  "/reset-password",
  verifyOtpToken(),
  authController.resetPassword
);

router.post("/resend-otp",validateRequest(authValidation.resendOtpSchema),authController.resendOtp)
router.post("/change-password",auth(),authController.changePassword)

export const authRoute = router;
