import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadMediaOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {

  //First we will extract the fields coming in the request
  const { fullName, username, email, password } = req.body;

  //After extracting all the data from the request, we will check that these
  //fields should not be null

  if ([fullName, email, username, password].some((field) => field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // Now we will check if the user is already existed or not in database
  const userAlreadyExist = await User.findOne({
    $or: [{ username, email }]
  });
  if (userAlreadyExist) {
    throw new ApiError(409, "User already exist in the database. Please use a different a usename or email");
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
    coverImage: coverImage || ""
  });

  // Checking is user is created successfully
  const createdUser = await User.findById(user._id)
    .select("-password -refreshToken");

  // If user is not created successfully, throw an error
  if (!createdUser) {
    throw new ApiError(500, "Internal Server Error");
  }

  // User is created, Send 201 response
  res.status(201).json(
    new ApiResponse(201, "User created successfully", createdUser)
  );
});

export { registerUser };
