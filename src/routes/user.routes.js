import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyLoggedInUser } from "../middlewares/auth.middleware.js";

const router = Router();

//Register User route
/**
 * upload.fileds is a middleware used to extract the images from the request
 */
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
  registerUser
);

router.route("/login").post(loginUser);

/**
 * Special route as we are using a middleware auth to get the user
 */

router.route("/logout").post(verifyLoggedInUser, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

export default router;
