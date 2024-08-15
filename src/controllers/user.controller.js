import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadMediaOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const cookieOption = {
  httpOnly: true,
  secure: true,
};

/**
 *
 * @param {*} userID
 * @returns {accessToken, refreshToken}
 * This function helps in generating accessToken and refreshToken
 * and saving refreshToken in database
 */
const generateAccessAndRefreshToken = async (userID) => {
  try {
    // getting user from database
    const user = await User.findById(userID);

    // generating new accessToken
    const accessToken = user.generateAccessToken();

    //generate new refreshToken
    const refreshToken = user.generateRefreshToken();

    // adding refreshToken in user object
    user.refreshToken = refreshToken;

    // saving user in database
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh Token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //First we will extract the fields coming in the request
  const { fullName, username, email, password } = req.body;

  //After extracting all the data from the request, we will check that these
  //fields should not be null

  if (
    [fullName, email, username, password].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Now we will check if the user is already existed or not in database
  const userAlreadyExist = await User.findOne({
    $or: [{ username, email }],
  });
  if (userAlreadyExist) {
    throw new ApiError(
      409,
      "User already exist in the database. Please use a different a usename or email"
    );
  }
  // Now getting localPath of the avatar and coverImage
  // We have used a middleware upload that will give us some more variables
  const avatarLocalFilePath = req?.files?.avatar[0]?.path;
  const coverImageLocalFilePath = req?.files?.coverImage[0]?.path;

  // Checking if avatar image came or not
  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Avatar Image is required");
  }

  // Uploading media to cloudinary
  const avatar = await uploadMediaOnCloudinary(avatarLocalFilePath);
  const coverImage = await uploadMediaOnCloudinary(coverImageLocalFilePath);
  // Now creating user in database
  const user = await User.create({
    username: username.toLowerCase(),
    password,
    email,
    fullName,
    avatar: avatar,
    coverImage: coverImage || "",
  });

  // Checking is user is created successfully
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // If user is not created successfully, throw an error
  if (!createdUser) {
    throw new ApiError(500, "Internal Server Error");
  }

  // User is created, Send 201 response
  res
    .status(201)
    .json(new ApiResponse(201, "User created successfully", createdUser));
});

const loginUser = asyncHandler(async (req, res) => {
  // Fetch username, email, password from request
  const { username, email, password } = req.body;

  // Check if username or email is empty
  console.log("This is username :::: ", username);
  console.log("This is email :::: ", email);
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // Check if user exist
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User doesn't exist");
  }

  // if user exist, validate the password
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // generate new accessToken and refreshToken
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // send cookies

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOption)
    .cookie("refreshToken", refreshToken, cookieOption)
    .json(
      new ApiResponse(200, "User logged in Successfully", {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = req.user;

  // Here we are removing the refreshToken from the database.
  await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  // Here we are clearing the cookies at the end user side
  return res
    .status(200)
    .clearCookie("accessToken", cookieOption)
    .clearCookie("refreshToken", cookieOption)
    .json(new ApiResponse(200, "User Logged Out Successfully", {}));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const decodedIncomingRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedIncomingRefreshToken._id).select(
      "-password"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh Token Expired");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      decodedIncomingRefreshToken._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOption)
      .cookie("refreshToken", refreshToken, cookieOption)
      .json(
        new ApiResponse(200, "AccessToken Refreshed", {
          accessToken,
          refreshToken,
        })
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // This is just to check if user is logges in
  // req.user is coming from the auth middleware
  const user = await User.findById(req?.user._id);

  const isPasswordCorrect = await User.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: true });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password updated successfully", {}));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "User fetched successfully", req.user));
});

const updateAccountDetail = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All field are required");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, "User Account Details updated Successfully", user)
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const { avatarLocalFilePath } = req.file?.path;
  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Avatar Image is missing");
  }

  const avatar = await uploadMediaOnCloudinary(avatarLocalFilePath);

  if (!avatar) {
    throw new ApiError(400, "Upload Avatar on Cloudinary failed");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(new ApiResponse(200, "Avatar Image updated successfully", user));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetail,
};
