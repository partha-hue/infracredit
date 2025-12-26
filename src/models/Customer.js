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
      },
      { _id: true }
);

const CustomerSchema = new Schema(
      {
            ownerId: { type: Schema.Types.ObjectId, ref: 'Owner', required: true },
            name: { type: String, required: true },
            phone: { type: String, required: true },
            ledger: { type: [LedgerSchema], default: [] },
            currentDue: { type: Number, default: 0 },
      },
      { timestamps: true }
);

// One customer per phone PER owner
CustomerSchema.index({ ownerId: 1, phone: 1 }, { unique: true });

export default mongoose.models.Customer ||
      mongoose.model('Customer', CustomerSchema);
