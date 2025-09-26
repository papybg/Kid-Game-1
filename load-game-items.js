import { db } from './server/db.ts';
import { gameItems } from './shared/schema.ts';
import fs from 'fs';
import path from 'path';

const items = [
  // Основни обекти от themes.json
  { id: 1, name: "Котка", image: "/images/cat.png", index: "h", category: "домашни" },
  { id: 2, name: "Куче", image: "/images/dog.png", index: "h", category: "домашни" },
  { id: 3, name: "Кокошка", image: "/images/chicken.png", index: "p", category: "селскостопански" },
  { id: 4, name: "Влак", image: "/images/train.png", index: "i", category: "транспорт" },
  { id: 5, name: "Автобус", image: "/images/bus.png", index: "r", category: "транспорт" },
  { id: 6, name: "Врана", image: "/images/crow.png", index: "s", category: "птици" },
  { id: 7, name: "Крава", image: "/images/cow.png", index: "p", category: "селскостопански" },
  { id: 8, name: "Самолет", image: "/images/airplane.png", index: "s", category: "транспорт" },
  
  // Нови обекти от снимки
  { id: 9, name: "Червеношийка", image: "/images/1758682345806-robin.png", index: "s", category: "птици" },
  { id: 10, name: "Вълк", image: "/images/1758683309594-wolf.png", index: "j", category: "джунгла" },
  { id: 11, name: "Влак 1", image: "/images/1758684157766-train1.png", index: "i", category: "транспорт" },
  { id: 12, name: "Влак 2", image: "/images/1758684433340-train2.png", index: "i", category: "транспорт" },
  { id: 13, name: "Влак 3", image: "/images/1758686243635-train3.png", index: "i", category: "транспорт" },
  { id: 14, name: "Гълъб", image: "/images/1758686331550-dove.png", index: "s", category: "птици" },
  { id: 15, name: "Пожарна кола", image: "/images/1758689691831-firetruck.png", index: "r", category: "транспорт" },
  { id: 16, name: "Балон", image: "/images/1758693122489-balloon.png", index: "s", category: "транспорт" },
  { id: 17, name: "Лъв", image: "/images/1758750796740-lion.png", index: "j", category: "джунгла" }
];

(async () => {
  try {
    console.log('Connecting to database...');
    
    // Изтриваме старите записи
    await db.delete(gameItems);
    console.log('Old items deleted');

    // Вмъкваме новите обекти
    for (const item of items) {
      await db.insert(gameItems).values({
        id: item.id,
        name: item.name,
        image: item.image,
        index: item.index,
        category: item.category,
        audioFile: `/audio/${item.name.toLowerCase()}.mp3` // примерно аудио
      });
      console.log(`✓ Added: ${item.name} (${item.category})`);
    }

    console.log(`\n🎉 Successfully loaded ${items.length} game items!`);
    
    // Проверка
    const count = await db.select().from(gameItems);
    console.log(`Database now contains ${count.length} items`);

  } catch (error) {
    console.error('❌ Error loading items:', error.message);
  } finally {
    process.exit(0);
  }
})();