import { db } from './server/db.js';
import { gameItems } from './shared/schema.js';

async function checkAudio() {
  console.log('Проверка на аудио файлове...');
  const items = await db.select().from(gameItems);

  let withAudio = 0;
  let withoutAudio = 0;

  items.forEach(item => {
    if (item.audio && item.audio.trim() !== '') {
      withAudio++;
      console.log(`✅ ${item.name}: ${item.audio}`);
    } else {
      withoutAudio++;
      console.log(`❌ ${item.name}: няма аудио`);
    }
  });

  console.log('---');
  console.log(`Общо: ${withAudio} с аудио, ${withoutAudio} без аудио.`);
}

checkAudio().catch(console.error);