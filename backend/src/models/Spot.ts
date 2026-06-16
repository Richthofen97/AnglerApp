import mongoose, { Schema, Document } from "mongoose";

export interface ISpot extends Document {
  // NEW: TypeScript-Typ für die Benutzer-Zuweisung hinzugefügt
  userId: mongoose.Types.ObjectId;
  waterId: mongoose.Types.ObjectId;
  name: string;
  location: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  isFavorite: boolean;
  notes?: string;
}

const spotSchema = new Schema<ISpot>(
  {
    // NEW: Das Mongoose-Schema verlangt ab jetzt zwingend die ID des Anglers!
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    waterId: { type: Schema.Types.ObjectId, ref: "Water", required: false },
    name: { type: String, required: true },
    location: { type: String, default: "GPS Spot" },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    imageUrl: { type: String, default: "" },
    isFavorite: { type: Boolean, default: false },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

// KORREKTUR: Verhindert doppelte Modell-Registrierungs-Fehler bei ts-node-dev Restarts
const Spot = mongoose.models.Spot || mongoose.model<ISpot>("Spot", spotSchema);

export default Spot;
