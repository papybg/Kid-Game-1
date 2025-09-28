async function testGameSession() {
  try {
    const response = await fetch('http://localhost:3005/api/game-session/d2?device=desktop&mode=simple');
    const session = await response.json();

    console.log('🎮 Game Session за d2:');
    console.log(`Клетки: ${session.cells.length}`);
    console.log(`Предмети: ${session.items.length}`);

    // Провери за дублиращи се ID-та в предметите
    const itemIds = session.items.map((item: any) => item.id);
    const uniqueIds = new Set(itemIds);

    if (itemIds.length !== uniqueIds.size) {
      console.log('❌ НАМЕРЕНИ ДУБЛИРАЩИ СЕ ID-ТА В ПРЕДМЕТИТЕ!');

      const duplicates = itemIds.filter((id: number, index: number) => itemIds.indexOf(id) !== index);
      const uniqueDuplicates = [...new Set(duplicates)];

      uniqueDuplicates.forEach((id: any) => {
        const count = itemIds.filter((itemId: number) => itemId === id).length;
        const item = session.items.find((i: any) => i.id === id);
        console.log(`  ID ${id} (${item.name}): ${count} пъти`);
      });
    } else {
      console.log('✅ Няма дублиращи се ID-та в предметите');
    }

    // Покажи първите 10 предмета
    console.log('');
    console.log('Първите 10 предмета:');
    session.items.slice(0, 10).forEach((item: any, index: number) => {
      console.log(`${index + 1}. ID: ${item.id}, Name: ${item.name}`);
    });

  } catch (error) {
    console.error('Грешка при тестване:', error);
  }
}
testGameSession();