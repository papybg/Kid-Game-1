import { db } from './server/db.ts';
import { gameLayouts } from './shared/schema.ts';

(async () => {
  try {
    console.log('=== АНАЛИЗ НА КЛЕТКИ И ИНДЕКСИ ===');
    const layouts = await db.select().from(gameLayouts);
    
    layouts.forEach(layout => {
      console.log(`\n🎯 Layout: ${layout.name}`);
      console.log('Клетки (Desktop):');
      layout.slots_desktop.forEach((slot, i) => {
        console.log(`  ${i+1}. Позиция: ${slot.position.top}, ${slot.position.left} - Индекси: [${slot.index.join(', ')}]`);
      });
      
      if (layout.slots_mobile) {
        console.log('Клетки (Mobile):');
        layout.slots_mobile.forEach((slot, i) => {
          console.log(`  ${i+1}. Позиция: ${slot.position.top}, ${slot.position.left} - Индекси: [${slot.index.join(', ')}]`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Грешка:', error.message);
  } finally {
    process.exit(0);
  }
})();