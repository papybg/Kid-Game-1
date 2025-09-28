import { getStorage } from './server/storage.js';

async function checkPortals() {
  try {
    const storage = await getStorage();
    const portals = await storage.getPortals();
    console.log('Portals:', JSON.stringify(portals, null, 2));

    const variants = await storage.getGameVariants();
    console.log('Variants:', JSON.stringify(variants, null, 2));

    const categories = await storage.getCategoriesIndices();
    console.log('Categories:', JSON.stringify(categories, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPortals();