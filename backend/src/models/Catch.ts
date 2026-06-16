import mongoose, { Schema, Document } from "mongoose";

export interface ICatch extends Document {
  userId: mongoose.Types.ObjectId;
  spotId: mongoose.Types.ObjectId;
  species: string; // Fischart (z.B. Hecht, Barsch)
  weight?: number; // Gewicht in Gramm oder kg
  length?: number; // Länge in cm
  imageUrl?: string; // Foto vom Fang (Cloudinary)
  notes?: string; // Köder, Uhrzeit, Wetterbedingungen
  caughtAt: Date; // Wann der Fisch gebissen hat
}

const catchSchema = new Schema<ICatch>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    spotId: { type: Schema.Types.ObjectId, ref: "Spot", required: true },
    species: { type: String, required: true },
    weight: { type: Number },
    length: { type: Number },
    imageUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
    caughtAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const Catch =
  mongoose.models.Catch || mongoose.model<ICatch>("Catch", catchSchema);
export default Catch;
