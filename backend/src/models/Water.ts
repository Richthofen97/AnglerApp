import mongoose, { Schema, Document } from "mongoose";

// Das saubere TypeScript-Interface für die fixen Hauptgewässer (erweitert um location)
export interface IWater extends Document {
  name: string;
  waterType: "see" | "fluss" | "meer";
  location: {
    type: "Point";
    coordinates: number[]; // [longitude, latitude]
  };
}

const waterSchema = new Schema<IWater>(
  {
    name: { type: String, required: true, unique: true },
    waterType: {
      type: String,
      enum: ["see", "fluss", "meer"],
      default: "see",
    },
    // HIER NEU: Das GeoJSON-Feld für die Koordinaten
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // Ein Array aus Zahlen: [lng, lat]
        required: true,
      },
    },
  },
  { timestamps: true },
);

// GANZ WICHTIG: MongoDB mitteilen, dass auf diesem Feld geografisch gesucht werden kann!
waterSchema.index({ location: "2dsphere" });

export default mongoose.model<IWater>("Water", waterSchema);
