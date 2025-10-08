const User = require("../models/User");
const path = require("path");
const mail = require("../services/mail"); // add

// @desc    Submit investor verification data
// @route   POST /api/verification
// @access  Private
exports.submitVerification = async (req, res) => {
  try {
    const {
      firstName,
      surname,
      phoneNumber,
      ageBracket,
      dateOfBirth,
      localGovernment,
      stateOfResidence,
      residentialAddress,
      ninNumber,
      kinFullName,
      kinPhoneNumber,
      kinEmail,
      kinResidentialAddress,
      kinRelationship,
      accountName,
      accountNumber,
      bankName,
      bvnNumber,
      accountType,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.set({
      "verification.personal": {
        firstName,
        surname,
        phoneNumber,
        ageBracket,
        dateOfBirth,
        localGovernment,
        stateOfResidence,
        residentialAddress,
        ninNumber,
      },
      "verification.nextOfKin": {
        fullName: kinFullName,
        phoneNumber: kinPhoneNumber,
        email: kinEmail,
        residentialAddress: kinResidentialAddress,
        relationship: kinRelationship,
      },
      "verification.bankDetails": {
        accountName,
        accountNumber,
        bankName,
        bvnNumber,
        accountType,
      },
      "verification.status": "pending",
      "verification.submittedAt": new Date(), // set timestamp
    });

    await user.save();

    // Fire emails (do not block response if mail fails)
    const displayName =
      firstName ||
      user.name ||
      (user.email ? user.email.split("@")[0] : "User");
    mail
      .sendVerificationSubmittedEmail(user.email, displayName)
      .catch((e) =>
        console.error("sendVerificationSubmittedEmail failed:", e.message)
      );

    if (process.env.ADMIN_EMAIL) {
      const adminName =
        [firstName, surname].filter(Boolean).join(" ") || displayName;
      mail
        .sendAdminVerificationNotification(process.env.ADMIN_EMAIL, {
          email: user.email,
          name: adminName,
        })
        .catch((e) =>
          console.error("sendAdminVerificationNotification failed:", e.message)
        );
    }

    res.status(200).json({
      success: true,
      message: "Verification information submitted successfully",
      data: user.verification,
    });
  } catch (error) {
    console.error("Verification submission error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during verification submission",
      error: error.message,
    });
  }
};

// Helper: convert multer's saved absolute path to web path under /uploads
function toWebPath(absPath) {
  if (!absPath) return absPath;
  const marker = `${path.sep}uploads${path.sep}`;
  const idx = absPath.lastIndexOf(marker);
  if (idx >= 0) {
    // Normalize to a single leading slash web path: /uploads/...
    const rel = absPath.slice(idx).split(path.sep).join("/");
    return rel.startsWith("/") ? rel : `/${rel}`;
  }
  // Fallback: ensure single leading slash
  const web = absPath.split(path.sep).join("/");
  return web.startsWith("/") ? web : `/${web}`;
}

// @desc    Upload verification documents
// @route   POST /api/verification/documents
// @access  Private
exports.uploadDocuments = async (req, res) => {
  try {
    const idDocumentPath = req.files?.identificationDocument?.[0]?.path;
    const passportPhotoPath = req.files?.passportPhoto?.[0]?.path;
    const utilityBillPath = req.files?.utilityBill?.[0]?.path;

    if (!idDocumentPath || !passportPhotoPath || !utilityBillPath) {
      return res.status(400).json({
        success: false,
        message: "All required documents must be uploaded",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Save web-facing paths for frontend/admin consumption
    const idWeb = toWebPath(idDocumentPath);
    const ppWeb = toWebPath(passportPhotoPath);
    const ubWeb = toWebPath(utilityBillPath);

    user.set({
      "verification.documents.idDocument": idWeb,
      "verification.documents.passportPhoto": ppWeb,
      "verification.documents.utilityBill": ubWeb,
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Documents uploaded successfully",
      data: user.verification.documents,
    });
  } catch (error) {
    console.error("Document upload error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during document upload",
      error: error.message,
    });
  }
};

// @desc    Get verification status
// @route   GET /api/verification/status
// @access  Private
exports.getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        status: user.verification.status,
        isVerified: user.isVerified,
        reviewedAt: user?.verification?.reviewedAt,
        submittedAt: user?.verification?.submittedAt,
      },
    });
  } catch (error) {
    console.error("Get verification status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving verification status",
      error: error.message,
    });
  }
};

// Submit corporate TEXT fields only
// @route POST /api/verification/corporate
exports.submitCorporateVerification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { company, bankDetails, signatories, referral } = req.body;

    if (!company || !bankDetails) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Company and bank details are required",
        });
    }

    if (!Array.isArray(signatories) || signatories.length < 1) {
      return res
        .status(400)
        .json({
          success: false,
          message: "At least one signatory is required",
        });
    }

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Use dot-notation to avoid overwriting the whole subdocument
    const updates = {
      "verification.corporate.company": company,
      "verification.corporate.bankDetails": bankDetails,
      "verification.corporate.signatories": signatories,
      "verification.corporate.referral": referral,
      "verification.status": "pending",
      "verification.rejectionReason": undefined,
      "verification.submittedAt": new Date(),
    };

    // Ensure documents subdoc exists (schema expects an object)
    if (!user?.verification?.corporate?.documents) {
      updates["verification.corporate.documents"] = {};
    }

    user.set(updates);
    await user.save();

    res.status(201).json({ success: true, verification: user.verification });
  } catch (error) {
    console.error("Corporate verification (text) submission error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during corporate verification submission",
      error: error.message,
    });
  }
};

// Submit corporate DOCUMENTS (multipart/form-data)
// Accepts: companyLogo, certificateOfIncorporation, memorandumAndArticles?, utilityBill, tinCertificate?,
//          signatories[0][idDocument], signatories[0][signature] (and for each index)
exports.submitCorporateVerificationDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const files = Array.isArray(req.files) ? req.files : [];

    if (!files || files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    user.verification = user.verification || {};
    user.verification.corporate = user.verification.corporate || {};
    user.verification.corporate.company =
      user.verification.corporate.company || {};
    user.verification.corporate.documents =
      user.verification.corporate.documents || {};
    user.verification.corporate.signatories =
      user.verification.corporate.signatories || [];

    // Ensure signatory index exists
    const ensureSignatory = (idx) => {
      while ((user.verification.corporate.signatories?.length || 0) <= idx) {
        user.verification.corporate.signatories.push({});
      }
    };

    // Multer .any(): each file has { fieldname, path, ... }
    for (const f of files) {
      const field = f.fieldname;
      const webPath = toWebPath(f.path);

      if (field === "companyLogo") {
        user.verification.corporate.company.logo = webPath;
        continue;
      }
      if (field === "certificateOfIncorporation") {
        user.verification.corporate.documents.certificateOfIncorporation =
          webPath;
        continue;
      }
      if (field === "memorandumAndArticles") {
        user.verification.corporate.documents.memorandumAndArticles = webPath;
        continue;
      }
      if (field === "utilityBill") {
        user.verification.corporate.documents.utilityBill = webPath;
        continue;
      }
      if (field === "tinCertificate") {
        user.verification.corporate.documents.tinCertificate = webPath;
        continue;
      }

      // signatories[<idx>][idDocument] or signatories[<idx>][signature]
      const m = field.match(/^signatories\[(\d+)\]\[(idDocument|signature)\]$/);
      if (m) {
        const idx = Number(m[1]);
        const key = m[2];
        ensureSignatory(idx);
        user.verification.corporate.signatories[idx][key] = webPath;
        continue;
      }

      // Unknown fieldname; skip or log
      console.warn("Unexpected corporate upload field:", field);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Corporate documents uploaded successfully",
      data: user.verification.corporate,
    });
  } catch (error) {
    console.error("Corporate document upload error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during corporate document upload",
      error: error.message,
    });
  }
};
