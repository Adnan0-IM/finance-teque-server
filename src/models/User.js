const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const CorporateVerificationSchema = new mongoose.Schema(
  {
    company: {
      name: String,
      incorporationNumber: String,
      dateOfIncorporation: String,
      address: String,
      state: String,
      localGovernment: String,
      phone: String,
      email: String,
      logo: String,
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      accountName: String,
      accountType: { type: String, default: "Corporate" },
      bvnNumber: String,
    },
    documents: {
      type: Object,
      default: {}, // important
    },
    signatories: {
      type: [
        {
          fullName: String,
          position: String,
          phoneNumber: String,
          bvnNumber: String,
          email: String,
          idDocument: String,
          signature: String,
        },
      ],
      default: [],
    },
    referral: {
      officerName: String,
      contact: String,
    },
  },
  { _id: false }
);

const VerificationSchema = new mongoose.Schema(
  {
    personal: { type: Object, default: {} },
    nextOfKin: { type: Object, default: {} },
    bankDetails: { type: Object, default: {} },
    documents: { type: Object, default: {} },
    corporate: { type: CorporateVerificationSchema, default: {} }, // default object
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: String,
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    submittedAt: Date,
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
      index: true,
    },
    phone: {
      type: String,
      required: [true, "Please add a phone number"],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["investor", "startup", "admin", "none"],
      default: "none",
      index: true,
    },
    investorType: {
      type: String,
      enum: ["personal", "corporate", "none"],
      default: "none",
      index: true,
    },

    isVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    // Fields for email verification flow
    emailVerificationCodeHash: { type: String },
    emailVerificationExpires: { type: Date },
    emailVerificationLastSentAt: { type: Date },
    // Fields for password reset flow
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    verification: { type: VerificationSchema, default: {} },
    corporateVerification: {},
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful index for admin filtering by verification status
UserSchema.index({ "verification.status": 1, createdAt: -1 });

// Encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Sign accessToken and return
UserSchema.methods.getSignedAccessToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.ACCESS_TOKEN_SECRET || "somesecret",
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m",
    }
  );
};

// Sign refreshToken and return
UserSchema.methods.getSignedRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.REFRESH_TOKEN_SECRET || "somesecret",
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d",
    }
  );
};

// Backward-compatible alias for previous typo
UserSchema.methods.getSignedResfreshToken = function () {
  return this.getSignedRefreshToken();
};

// Helper methods for email verification
UserSchema.methods.setEmailVerificationCode = function (
  ttlMs = 10 * 60 * 1000
) {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  const hash = crypto.createHash("sha256").update(code).digest("hex");
  this.emailVerificationCodeHash = hash;
  this.emailVerificationExpires = new Date(Date.now() + ttlMs);
  return code; // return plain code so it can be emailed
};

UserSchema.methods.validateEmailVerificationCode = function (code) {
  if (!this.emailVerificationCodeHash || !this.emailVerificationExpires)
    return false;
  if (this.emailVerificationExpires.getTime() < Date.now()) return false;
  const hash = crypto.createHash("sha256").update(code).digest("hex");
  return hash === this.emailVerificationCodeHash;
};

UserSchema.methods.clearEmailVerificationCode = function () {
  this.emailVerificationCodeHash = undefined;
  this.emailVerificationExpires = undefined;
};

module.exports = mongoose.model("User", UserSchema);
