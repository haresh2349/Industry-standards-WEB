import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadFileOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { options } from "../constants.js";

export const RegisterUser = asyncHandler(async (req, res) => {
  const { userName, email, password, fullName } = req.body;

  const requiredFields = [userName, email, password, fullName];

  //   CHECK PRESENSE OF ALL REQUIRED FIELDS
  if (requiredFields.some((field) => field.trim() === "")) {
    throw new ApiError(400, "Please provide all required fields");
  }

  // CHECK UNIQUENESS OF EMAIL AND USERNAME
  const isEmailAlreadyExists = await User.findOne({ email });
  const isUserNameAlreadyExists = await User.findOne({ userName });
  if (isEmailAlreadyExists) {
    throw new ApiError(409, "Email already Exists!");
  } else if (isUserNameAlreadyExists) {
    throw new ApiError(409, "UserName already Exists!");
  }
  // GET THE FILE PATH LOCALLY UPLOADED BY MULTER
  const avatarLocaFilePath = req.files?.avatar[0]?.path;
  const coverImageLocalPath =
    req.files?.coverImage && req.files?.coverImage[0]?.path;

  console.log(avatarLocaFilePath, "avatarLocaFilePath");
  if (!avatarLocaFilePath) {
    throw new ApiError(400, "Please provide avatar file!");
  }

  const avatarFromCloudinary = await uploadFileOnCloudinary(avatarLocaFilePath);
  const coverImagesFromCloudinary =
    await uploadFileOnCloudinary(coverImageLocalPath);

  if (!avatarFromCloudinary) {
    throw new ApiError(400, "Please provide avatar file!");
  }

  const newUser = await User.create({
    userName,
    fullName,
    email,
    password,
    avatar: avatarFromCloudinary.url,
    coverImage: coverImagesFromCloudinary?.url || "",
  });

  const createdUser = await User.findById(newUser?._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while user registration");
  }

  console.log("createdUser", createdUser);

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User created successfully."));
});

export const generateAccessOrRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating token.");
  }
};

export const loginUser = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body;
  console.log(email, userName);
  if (!email) {
    throw new ApiError(400, "Please provide UserName or Email.");
  } else if (!password) {
    throw new ApiError(400, "Please provide Password.");
  }

  const user = await User.findOne({ $or: [{ email }, { userName }] });
  if (!user) {
    throw new ApiError(404, "User does not exists.");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid user credentials.");
  }

  const { accessToken, refreshToken } = await generateAccessOrRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User loggedIn successfully."
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  const user = req.user;
  await User.findByIdAndUpdate(
    user?._id,
    {
      $set: { refreshToken: null },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie(accessToken, options)
    .clearCookie(refreshToken, options)
    .json(new ApiResponse(200, {}, "User Loggedout successfully."));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedRefreshToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalide refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired");
    }

    const { accessToken, refreshToken } = await generateAccessOrRefreshToken(
      user?._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { refreshToken, accessToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalide refresh token");
  }
});
