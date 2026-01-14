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
      },
      { timestamps: true },
);

// We remove the unique index for (ownerId, phone) because a user might delete a phone number 
// and then try to add it again. We only want unique active phones.
// However, handling unique indexes with soft-delete is tricky. 
// For now, we will handle this in the API logic.
// CustomerSchema.index({ ownerId: 1, phone: 1 }, { unique: true });

export default mongoose.models.Customer ||
      mongoose.model('Customer', CustomerSchema);
