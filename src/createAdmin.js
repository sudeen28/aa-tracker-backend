import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "./lib/prisma.js"; // confirm this path matches your project structure

async function main() {
  const email = "terrimornue@gmail.com";
  const password = "Okikiola122!";
  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashed, role: "SUPER_ADMIN" },
    create: {
      name: "Admin",
      email,
      password: hashed,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Admin ready:", user.email, user.role);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});