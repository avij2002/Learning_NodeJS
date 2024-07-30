import jsonwebtoken from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model.js";

const verifyLoggedInUser = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization").replace("Bearer ", "");

    if (!token) {
      new ApiError(401, "Unauthorized  request");
    }

    const decodedToken = jsonwebtoken.verify(
      token,
      process.env.JWT_ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      new ApiError(401, "Invalid access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    new ApiError(401, error?.message || "Invalid access Token");
  }
});

export { verifyLoggedInUser };
