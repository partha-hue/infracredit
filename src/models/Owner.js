import mongoose, { Schema } from 'mongoose';

const OwnerSchema = new Schema(
      {
            ownerName: { type: String, required: true },
            shopName: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            passwordHash: { type: String, default: '' },
            provider: { type: String, enum: ['google', 'local'], default: 'local' },
            googleId: { type: String },
      },
      { timestamps: true }
);

export default mongoose.models.Owner ||
      mongoose.model('Owner', OwnerSchema);
