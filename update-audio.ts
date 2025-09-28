import { db } from './server/db.js';
import { gameItems } from './shared/schema.js';
import { eq } from 'drizzle-orm';

const audioMapping = {
  'Котка': '/audio/animals/cat.mp3',
  'Куче': '/audio/animals/dog.mp3',
  'Кокошка': '/audio/animals/chicken.mp3',
  'Влак': '/audio/vehicles/train.mp3',
  'Врана': '/audio/animals/crow.mp3',
  'Крава': '/audio/animals/cow.mp3',
  'Червеношийка': '/audio/1758682346398-robin.mp3',
  'Вълк': '/audio/1758683310563-wolf.mp3',
  'Влак 1': '/audio/1758684158552-train1.mp3',
  'Влак 2': '/audio/1758684434149-train2.mp3',
  'Влак 3': '/audio/1758686243636-train3.mp3',
  'Гълъб': '/audio/1758686331551-dove.mp3',
  'Лъв': '/audio/1758750796741-Leon.mp3',
  'Самолет': '/audio/vehicles/airplane.mp3',
  'Балон': '/audio/1758693123269-balloon.mp3',
  'Автобус': '/audio/vehicles/bus.mp3'
};

async function updateAudio() {
  console.log('Започвам обновяване на аудио файлове...');

  for (const [name, audioPath] of Object.entries(audioMapping)) {
    try {
      await db.update(gameItems)
        .set({ audio: audioPath })
        .where(eq(gameItems.name, name));
      console.log(`✅ ${name}: ${audioPath}`);
    } catch (error) {
      console.error(`❌ Грешка при ${name}:`, error);
    }
  }

  console.log('🎵 Аудио обновяването завърши!');
  process.exit(0);
}

updateAudio();