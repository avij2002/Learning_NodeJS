import { Schema, model } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, // User who is subscribing
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, // To whom user is subscribing
      ref: "User",
    },
  },
  { timestamps: true }
);

export default Subscription = model("Subscription", subscriptionSchema);
