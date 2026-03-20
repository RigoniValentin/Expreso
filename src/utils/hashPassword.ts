import bcrypt from "bcrypt";

/**
 * Script para generar hash de contraseña
 * Uso: npx ts-node src/utils/hashPassword.ts
 */

const password = "tu_nueva_contraseña"; // Cambia esto por la contraseña que quieras

async function generateHash() {
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);
  console.log("\n=== Password Hash Generator ===");
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log("\nCopia este hash y actualízalo en la base de datos MongoDB");
  console.log("Campo: password");
  console.log("================================\n");
}

generateHash().catch(console.error);
