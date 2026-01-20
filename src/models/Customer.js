import mongoose, { Schema } from 'mongoose';

const LedgerSchema = new Schema(
      {
            type: { type: String, enum: ['credit', 'payment'], required: true },
            amount: { type: Number, required: true },
            note: String,
            date: {
                  type: String,
                  default: () => new Date().toLocaleDateString('en-IN'),
            },
            createdAt: {
                  type: Date,
                  default: () => new Date(),
            },
            balanceAfter: { type: Number },
            isDeleted: { type: Boolean, default: false },
            deletedAt: { type: Date },
      },
      { _id: true },
);

const CustomerSchema = new Schema(
      {
            ownerId: { type: Schema.Types.ObjectId, ref: 'Owner', required: true },
            name: { type: String, required: true },
            phone: { type: String, required: true },
            ledger: { type: [LedgerSchema], default: [] },
            currentDue: { type: Number, default: 0 },
            isDeleted: { type: Boolean, default: false },
            deletedAt: { type: Date },
            
            // New fields for Customer Self-Login
            passwordHash: { type: String }, // Set when customer registers themselves
            isRegistered: { type: Boolean, default: false }
      },
      { timestamps: true },
);

export default mongoose.models.Customer ||
      mongoose.model('Customer', CustomerSchema);
