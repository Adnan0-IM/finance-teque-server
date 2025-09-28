const User = require("../models/User");

async function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "System Admin";
  const phone = process.env.ADMIN_PHONE || "0000000000";

  if (!email || !password) {
    console.warn(
      "[Admin seed] ADMIN_EMAIL/ADMIN_PASSWORD not set. Skipping admin seeding."
    );
    return;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.log("[Admin seed] Admin user already exists:", email);
    return;
  }

  await User.create({
    name,
    email,
    phone,
    password, // hashed by pre-save hook
    role: "admin",
    isVerified: true,
    emailVerified: true,
    verification: { status: "approved", submittedAt: new Date()},
  });

  console.log("[Admin seed] Admin user created:", email);
}

async function seedFakeUsers(countPerRole = 5) {
  if (process.env.NODE_ENV === "production") {
    console.warn("[Seed] Skipping fake users seeding in production.");
    return;
  }

  const roles = ["investor", "startup", "admin"];
  const basePassword = process.env.SEED_TEST_PASSWORD || "Test1234!";

  const created = [];

  for (const role of roles) {
    for (let i = 1; i <= countPerRole; i++) {
      const email = `test${role}${i}@example.com`;
      const name = `${role.charAt(0).toUpperCase()}${role.slice(1)} Test ${i}`;
      const phone = `999-${roles.indexOf(role)}${i
        .toString()
        .padStart(3, "0")}-0000`;

      const exists = await User.findOne({ email }).lean();
      if (exists) {
        console.log(`[Seed] ${email} already exists. Skipping.`);
        continue;
      }

      await User.create({
        name,
        email,
        phone,
        password: basePassword, // hashed by pre-save hook
        role,
        isVerified: true,
        emailVerified: true,
        verification: role === "admin" ? undefined : { status: "approved" },
      });

      created.push(email);
    }
  }

  console.log(`[Seed] Created ${created.length} fake users:`, created);
}

module.exports = { ensureAdminUser, seedFakeUsers };
