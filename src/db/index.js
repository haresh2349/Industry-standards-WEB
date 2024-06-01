import mongoose from "mongoose";
import express from "express";
import { db_name } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${db_name}`
    );
    return connectionInstance;
  } catch (error) {
    console.error("Error", error);
    process.exit(1);
  }
};

export default connectDB;
