import { PrismaClient } from '@prisma/client';
import { readdirSync } from 'fs';
import * as path from 'path';
const prisma = new PrismaClient();

export interface Model {
  data: Record<string, any>[] | Record<string, any>;
  run: (prisma: PrismaClient) => Promise<any>;
}

async function main() {
  const files = readdirSync(path.join(__dirname, 'model'));
  for (const file of files) {
    const model: Model = await import(path.join(__dirname, 'model', file)).then(
      (module) => module.default,
    );
    console.log(`⤵️  Seeding: ${file}`);
    await model.run(prisma);
  }
}

main()
  .then(() => {
    console.log('🎉  Seed successful');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    console.error('\n❌  Seed failed. See above.');
    process.exit(1);
  });
