import mongoose, { Schema } from 'mongoose';

const OwnerSchema = new Schema(
      {
            ownerName: { type: String, required: true },
            shopName: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            phone: { type: String, default: '' },
            avatarUrl: { type: String, default: '' },
            bio: { type: String, default: 'Digital Khata Powered by InfraCredit' },
            passwordHash: { type: String, default: '' },
            provider: { type: String, enum: ['google', 'local'], default: 'local' },
            googleId: { type: String },
      },
      { timestamps: true },
);

export default mongoose.models.Owner ||
      mongoose.model('Owner', OwnerSchema);
