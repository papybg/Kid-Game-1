import { db } from './server/db.ts';
import { gameLayouts } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

(async () => {
  try {
    console.log('=== ПОПРАВЯНЕ НА КЛЕТКИ С МНОЖЕСТВЕНИ ИНДЕКСИ ===');
    
    // Намери проблемната клетка и я поправи
    const layouts = await db.select().from(gameLayouts);
    
    for (const layout of layouts) {
      let needsUpdate = false;
      
      // Поправи desktop slots
      const fixedDesktopSlots = layout.slots_desktop.map(slot => {
        if (slot.index.includes('p') && slot.index.includes('h')) {
          console.log(`🔧 Поправям клетка с индекси [${slot.index.join(', ')}] -> само [h]`);
          needsUpdate = true;
          return { ...slot, index: ['h'] }; // Оставяме само 'h'
        }
        return slot;
      });
      
      // Поправи mobile slots
      const fixedMobileSlots = layout.slots_mobile?.map(slot => {
        if (slot.index.includes('p') && slot.index.includes('h')) {
          console.log(`🔧 Поправям mobile клетка с индекси [${slot.index.join(', ')}] -> само [h]`);
          needsUpdate = true;
          return { ...slot, index: ['h'] }; // Оставяме само 'h'
        }
        return slot;
      });
      
      if (needsUpdate) {
        await db.update(gameLayouts)
          .set({
            slots_desktop: fixedDesktopSlots,
            slots_mobile: fixedMobileSlots || layout.slots_mobile
          })
          .where(eq(gameLayouts.id, layout.id));
        
        console.log(`✅ Обновен layout: ${layout.name}`);
      }
    }
    
    console.log('🎉 Готово!');
    
  } catch (error) {
    console.error('❌ Грешка:', error.message);
  } finally {
    process.exit(0);
  }
})();