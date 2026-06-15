import mongoose, { Schema, Document } from "mongoose";

// Das saubere TypeScript-Interface für die fixen Hauptgewässer
export interface IWater extends Document {
  name: string;
  waterType: "see" | "fluss" | "meer";
}

const waterSchema = new Schema<IWater>(
  {
    // unique: true sorgt dafür, dass kein Gewässer doppelt angelegt werden kann
    name: { type: String, required: true, unique: true },
    waterType: {
      type: String,
      enum: ["see", "fluss", "meer"],
      default: "see",
    },
  },
  { timestamps: true },
);

export default mongoose.model<IWater>("Water", waterSchema);
