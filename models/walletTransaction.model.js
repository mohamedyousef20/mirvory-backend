import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema(
    {
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        },

        amount: {
            type: Number,
            required: true
        },

        type: {
            type: String,
            enum: ['credit', 'debit'],
            required: true
        },

        balanceAfter: {
            type: Number,
            required: true
        },

        source: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'completed'
        },

        note: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model(
    'WalletTransaction',
    walletTransactionSchema
);