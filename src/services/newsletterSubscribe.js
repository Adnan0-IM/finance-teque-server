const express = require("express");
const sgClient = require("@sendgrid/client");

const router = express.Router();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_LIST_ID =
  process.env.SENDGRID_LIST_ID || "935f23c1-e8a6-419a-8172-05951d2d1a00";

if (!SENDGRID_API_KEY) {
  console.warn("[newsletter] SENDGRID_API_KEY is missing");
}
sgClient.setApiKey(SENDGRID_API_KEY);
// Optional but explicit
sgClient.setDefaultRequest("baseUrl", "https://api.sendgrid.com");

const isValidEmail = (email) =>
  typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

router.post("/subscribe", async (req, res) => {
  const { email } = req.body || {};

  if (!isValidEmail(email)) {
    return res
      .status(400)
      .json({ success: false, error: "Valid email is required" });
  }
  if (!SENDGRID_API_KEY) {
    return res
      .status(500)
      .json({ success: false, error: "SendGrid not configured" });
  }

  try {
    const request = {
      url: "/v3/marketing/contacts",
      method: "PUT",
      body: {
        list_ids: [SENDGRID_LIST_ID],
        contacts: [{ email: email.trim() }],
      },
    };

    const [resp, body] = await sgClient.request(request);
    // 202 accepted from SendGrid
    return res
      .status(200)
      .json({
        success: true,
        message: "Subscribed successfully via SendGrid!",
      });
  } catch (err) {
    const sgErr =
      err?.response?.body?.errors || err?.response?.body || err?.message;
    console.error("[newsletter] SendGrid error:", sgErr);

    // Bubble up a clearer error for scope problems
    if (
      err?.response?.statusCode === 403 ||
      String(sgErr).toLowerCase().includes("access forbidden")
    ) {
      return res.status(403).json({
        success: false,
        error:
          "SendGrid API key lacks Marketing permissions. Enable Marketing Campaigns → Contacts/Lists (RW) and try again.",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Could not subscribe",
      detail: err?.response?.body?.errors || undefined,
    });
  }
});

module.exports = router;
