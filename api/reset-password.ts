import { prisma } from "./lib/prisma.js";
import bcrypt from "bcryptjs";

const email = (process.argv[2] ?? "").trim().toLowerCase();
const password = process.argv[3] ?? "";
const name = (process.argv[4] ?? "Store Admin").trim();

function usage() {
  console.log("Usage: reset-password <email> <password> [name]");
  console.log("  tsx api/reset-password.ts admin@shop.com 'MyPass123' 'Muhiuddin'");
  console.log("  node dist/reset-password.js admin@shop.com 'MyPass123' 'Muhiuddin'");
}

async function main() {
  if (!email || !password) {
    usage();
    process.exitCode = 1;
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    console.error(`Invalid email: ${email}`);
    process.exitCode = 1;
    return;
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, role: "ADMIN", name },
        select: { id: true, email: true, role: true },
      })
    : await prisma.user.create({
        data: { email, passwordHash, role: "ADMIN", name },
        select: { id: true, email: true, role: true },
      });

  if (existing) {
    await prisma.session.deleteMany({ where: { userId: user.id } });
    console.log(`Password reset for existing user (${existing.role} -> ADMIN): ${user.email}`);
    console.log("All existing sessions were cleared.");
  } else {
    console.log(`Admin created: ${user.email}  role=${user.role}`);
  }
  console.log(`  name:     ${name}`);
  console.log("Log in at /admin with this password.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());