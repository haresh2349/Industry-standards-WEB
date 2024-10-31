import mongoose, { Schema } from "mongoose";

const SubscriptionSchema = new Schema({
  subscriber: {
    type: Schema.Types.ObjectId, // one who is subscribing
    ref: "User",
  },
  channel: {
    type: Schema.Types.ObjectId, // one to whome "subscriber" is subscribing
    ref: "User",
  },
});

export const SubscriptionModel = mongoose.model(
  "Subscription",
  SubscriptionSchema
);
