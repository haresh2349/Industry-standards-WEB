import { asyncHandler } from "../utils/asyncHandler.js";

export const RegisterUser = asyncHandler(async (req, res) => {
  res.status(201).json({ message: "Ok" });
});
