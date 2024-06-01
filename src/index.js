import mongoose from "mongoose";
import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log(error, "Error");
      throw error;
    });

    app.listen(process.env.PORT || 8000, () => {
      console.log(`Your app is running on ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.log(err, "error");
  });
