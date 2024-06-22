import { Router } from "express";
import {
  RegisterUser,
  logoutUser,
  loginUser,
  refreshAccessToken,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlerware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  RegisterUser
);

router.route("/login").post(loginUser);

router.route("/logoutUser").post(verifyToken, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
export default router;
