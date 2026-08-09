import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const vendorSchema = new mongoose.Schema(
  {
    // Core Store Identity
    storeName: {
      type: String,
      required: [true, "Store name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

  

    // Seller Type
    businessType: {
      type: String,
      enum: ["individual", "company", "enterprise"],
      default: "individual",
    },

    // Identity & Legal
    nationalId: {
      type: String,
      required: [true, "National ID is required"],
      validate: {
        validator: function (v) {
          return /^[0-9]{14}$/.test(v);
        },
        message: "National ID must be exactly 14 digits",
      },
    },

    taxID: {
      type: String,
      default: "",
      trim: true,
    },

    businessRegistration: {
      type: String,
      default: "",
      trim: true,
    },

    // Contact
    phone: {
      type: String,
      required: [true, "Vendor phone is required"],
      partialFilterExpression: { phone: { $type: "string" } },
      validate: {
        validator: function (v) {
          return /^01[0125][0-9]{8}$/.test(v);
        },
        message: "Vendor phone must be a valid Egyptian phone number",
      },
    },


    // Seller Performance
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalSales: {
      type: Number,
      default: 0,
      min: 0,
    },

    trustedSeller: {
      type: Boolean,
      default: false,
    },

    // Payout Configuration
    payoutMethod: {
      type: String,
      enum: ["instapay", "vodafone_cash", "bank"],
      required: [true, "Payout method is required"],
      default: "instapay",
    },

    payoutAccount: {
      type: String,
      required: [true, "Payout account is required"],
      trim: true,
    },

    // Legacy/Advanced Payment Methods (Optional future scalability)
    paymentMethods: [
      {
        method: {
          type: String,
          enum: ["instapay", "vodafone_cash", "bank", "paypal", "stripe"],
        },
        details: mongoose.Schema.Types.Mixed,
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],


    rejectionReason: {
      type: String,
      default: "",
    },

    // Branding
    logo: {
      type: String,
      default: "",
    },

    banner: {
      type: String,
      default: "",
    },

    // Analytics
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },

    completedOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);
// user.model.js
const walletSchema = new mongoose.Schema({
  balance: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: 'EGP' },
  lastTransaction: {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    amount: Number,
    type: { type: String, enum: ['deposit', 'withdrawal', 'sale'] },
    date: Date
  },
  pendingBalance: { type: Number, default: 0 },

  // الإضافة الجديدة لتتبع الأرصدة المعلقة لكل طلب على حدة
  pendingTransactions: [{
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    amount: { type: Number, required: true },
    addedAt: { type: Date, default: Date.now },
    releaseDate: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'released'], default: 'pending' }
  }]
});

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    minlength: 3
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  passwordChangeAt: Date,
  role: {
    type: String,
    enum: ['admin', 'seller', 'user', 'Deliver', 'super_admin'],
    index: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  vendorProfile: vendorSchema,
  wallet: walletSchema,

  address: {
    governorate:String,
    city: String,
    addressLine: String
  },
  phone: {
    type: String,
    unique: true,
    set: v => v.trim(),
    validate: {
      validator: v => /^01[0125][0-9]{8}$/.test(v),
      message: props => `${props.value} is not a valid Egyptian phone number!`
    }
  },

  verificationCode: String,
  verificationCodeExpiresAt: Date,
  lastLogin: Date,
  loginHistory: [{
    ipAddress: String,
    device: String,
    timestamp: Date
  }],
  preferences: {
    language: { type: String, default: 'ar' },
    currency: { type: String, default: 'EGP' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    }
  },
  passwordResetCode: {
    type: String,
  },
  passwordResetCodeExpiresAt: {
    type: Date
  },
  passwordResetVerified: {
    type: Boolean,
    default: false
  },
  googleId: {
    type: String,
    sparse: true,
    index: true
  },
  avatar: {
    type: String,
    default: ''
  },
  refreshTokens: [{
    token: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    }
  }]

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Password hashing middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    this.updatedAt = new Date();
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Password comparison method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Memory Leak Protection: Cap Login History
userSchema.pre('save', function (next) {
  if (this.loginHistory && this.loginHistory.length > 50) {
    // Keep only the most recent 50 logins
    this.loginHistory = this.loginHistory.slice(-50);
  }
  next();
});


// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes for better query performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ 'vendorProfile.storeName': 'text' });
userSchema.index({ role: 1, isActive: 1 });

export default mongoose.model('User', userSchema);

