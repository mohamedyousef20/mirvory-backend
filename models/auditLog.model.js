import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  actionType: {
    type: String,
    required: true,
    enum: [
      'balance_adjustment',
      'balance_freeze',
      'balance_unfreeze',
      'user_delete',
      'user_suspend',
      'user_unsuspend',
      'role_change',
      'permission_grant',
      'permission_revoke',
      'seller_approve',
      'seller_reject',
      'order_cancel',
      'product_delete',
      'system_setting_change'
    ]
  },
  entityType: {
    type: String,
    required: true,
    enum: ['user', 'seller', 'order', 'product', 'wallet', 'system', 'permission']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for better query performance
auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ targetUserId: 1, createdAt: -1 });
auditLogSchema.index({ actionType: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
