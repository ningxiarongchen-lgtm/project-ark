const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  createdByIp: {
    type: String
  },
  revokedAt: {
    type: Date
  },
  revokedByIp: {
    type: String
  },
  replacedByToken: {
    type: String
  },
  isRevoked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Virtual property to check if token is expired
refreshTokenSchema.virtual('isExpired').get(function() {
  return Date.now() >= this.expiresAt;
});

// Virtual property to check if token is active
refreshTokenSchema.virtual('isActive').get(function() {
  return !this.isRevoked && !this.isExpired;
});

// Method to revoke token
refreshTokenSchema.methods.revoke = function(ipAddress, replacedByToken) {
  this.revokedAt = Date.now();
  this.revokedByIp = ipAddress;
  this.isRevoked = true;
  if (replacedByToken) {
    this.replacedByToken = replacedByToken;
  }
};

// Index for automatic deletion of expired tokens (TTL index)
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Clean up expired and revoked tokens periodically
refreshTokenSchema.statics.cleanupExpired = async function() {
  const now = new Date();
  const result = await this.deleteMany({
    $or: [
      { expiresAt: { $lt: now } },
      { isRevoked: true, revokedAt: { $lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } } // Revoked tokens older than 30 days
    ]
  });
  return result;
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);

