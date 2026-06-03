import mongoose, { Schema, Document } from "mongoose";

// 1. TypeScript-Interface erweitern, damit der Compiler die neuen Felder kennt
export interface IWater extends Document {
  name: string;
  location: string;
  lat: number;
  lng: number;
  waterType: "see" | "fluss" | "meer";
  imageUrl?: string;
  isFavorite: boolean;
}

const waterSchema = new Schema<IWater>(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    // 2. Mongoose-Schema erweitern, damit MongoDB die Felder auch wirklich in die Datenbank schreibt
    waterType: {
      type: String,
      enum: ["see", "fluss", "meer"],
      default: "see",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model<IWater>("Water", waterSchema);
