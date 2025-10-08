import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateGameSession } from '../server/gameService';

// Run: npx tsx scripts/check-priority-mapping.ts d1 k1

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

async function main() {
  const portalId = process.argv[2] || 'd1';
  const variantId = process.argv[3];
  console.log(`Generating session for portal=${portalId} variant=${variantId || 'none'}`);

  try {
    const session = await generateGameSession(portalId, 'desktop', 'simple', variantId);

    console.log('\nReturned cells (as sent to client)');
    session.cells.forEach((c:any, i:number) => console.log(`  [${i}] index=${c.index.join(',')} id=${(c as any).id}`));

    console.log('\nReturned items (shuffled)');
    session.items.forEach((it:any, i:number) => console.log(`  [${i}] id=${it.id} index=${it.index} name=${it.name}`));

    if (session.solution) {
      console.log('\nSolution mapping (itemId -> cellId)');
      for (const k of Object.keys(session.solution)) {
        console.log(`  item ${k} -> cell ${session.solution[Number(k)]}`);
      }
    } else {
      console.log('\nNo solution mapping present (t1 only)');
    }

  } catch (err:any) {
    console.error('Error generating session:', err.message || err);
  }
}

main();
