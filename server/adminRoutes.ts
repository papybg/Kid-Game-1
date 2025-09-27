import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { db } from './db';
import { gameItems, insertGameItemSchema, categoriesIndices, insertCategoriesIndicesSchema } from '../shared/schema';
import { eq, or, sql } from 'drizzle-orm';

const router = Router();

// Настройка на multer за uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'image') {
      cb(null, 'client/public/images/');
    } else if (file.fieldname === 'audio') {
      cb(null, 'client/public/audio/');
    } else {
      cb(null, 'client/public/');
    }
  },
  filename: (req, file, cb) => {
    // Генерирай уникално име: timestamp + оригинално име
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Позволи картинки и аудио файлове
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Само картинки и аудио файлове са позволени!'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB лимит
  }
});

// GET /api/admin/items - вземи всички предмети
router.get('/items', async (req, res) => {
  console.log('GET /api/admin/items called');
  try {
    const items = await db.select().from(gameItems).orderBy(gameItems.id);
    console.log('Found items:', items.length);
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// GET /api/admin/categories - вземи всички категории и индекси
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.select().from(categoriesIndices).orderBy(categoriesIndices.id);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/admin/categories - създай нова категория индекс
router.post('/categories', async (req, res) => {
  try {
    const { categoryName, indexValue, description } = req.body;

    // Валидирай
    const validatedData = insertCategoriesIndicesSchema.parse({
      categoryName,
      indexValue,
      description
    });

    // Генерирай следващо ID
    const existingCategories = await db.select().from(categoriesIndices);
    const nextId = existingCategories.length > 0 ? Math.max(...existingCategories.map(c => c.id)) + 1 : 1;

    // Запиши в базата с ръчно ID
    const newCategory = await db.insert(categoriesIndices).values({
      id: nextId,
      categoryName: validatedData.categoryName,
      indexValue: validatedData.indexValue,
      description: validatedData.description
    }).returning();

    res.status(201).json(newCategory[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
});

// POST /api/admin/items - създай нов предмет
router.post('/items', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]), async (req, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    const { name, index, category } = req.body;

    console.log('Received req.body:', req.body);
    console.log('Received files:', files);

    // Валидирай данните
    const validatedData = insertGameItemSchema.parse({
      name,
      index,
      category,
      image: files?.image?.[0] ? `/images/${files.image[0].filename}` : null,
      audio: files?.audio?.[0] ? `/audio/${files.audio[0].filename}` : null
    });

    // Запиши в базата
    const newItem = await db.insert(gameItems).values(validatedData).returning();

    res.status(201).json(newItem[0]);
  } catch (error) {
    console.error('Error creating item:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);

    // Изтрий качените файлове ако има грешка
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files?.image?.[0]) {
      const fs = await import('fs');
      fs.unlinkSync(files.image[0].path);
    }
    if (files?.audio?.[0]) {
      const fs = await import('fs');
      fs.unlinkSync(files.audio[0].path);
    }

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create item' });
    }
  }
});

// PUT /api/admin/items/:id - редактирай предмет
router.put('/items/:id', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, index, category } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Провери дали предметът съществува
    const existingItem = await db.select().from(gameItems).where(eq(gameItems.id, id)).limit(1);
    if (existingItem.length === 0) {
      return res.status(404).json({ error: 'Предметът не е намерен' });
    }

    // Подготви данните за обновяване
    const updateData: any = { name, index, category };

    // Ако има нови файлове, обнови paths
    if (files?.image?.[0]) {
      updateData.image = `/images/${files.image[0].filename}`;

      // Изтрий стария файл
      const fs = await import('fs');
      if (existingItem[0].image) {
        const oldImagePath = 'client/public' + existingItem[0].image;
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    if (files?.audio?.[0]) {
      updateData.audio = `/audio/${files.audio[0].filename}`;

      // Изтрий стария аудио файл
      const fs = await import('fs');
      if (existingItem[0].audio) {
        const oldAudioPath = 'client/public' + existingItem[0].audio;
        if (fs.existsSync(oldAudioPath)) {
          fs.unlinkSync(oldAudioPath);
        }
      }
    }

    // Обнови в базата
    const updatedItem = await db
      .update(gameItems)
      .set(updateData)
      .where(eq(gameItems.id, id))
      .returning();

    res.json(updatedItem[0]);
  } catch (error) {
    console.error('Error updating item:', error);

    // Изтрий новите файлове ако има грешка
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files?.image?.[0]) {
      const fs = await import('fs');
      fs.unlinkSync(files.image[0].path);
    }
    if (files?.audio?.[0]) {
      const fs = await import('fs');
      fs.unlinkSync(files.audio[0].path);
    }

    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/admin/items/:id - изтрий предмет
router.delete('/items/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Намери предмета
    const item = await db.select().from(gameItems).where(eq(gameItems.id, id)).limit(1);
    if (item.length === 0) {
      return res.status(404).json({ error: 'Предметът не е намерен' });
    }

    // Изтрий файловете от диска
    const fs = await import('fs');
    if (item[0].image) {
      const imagePath = 'client/public' + item[0].image;
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    if (item[0].audio) {
      const audioPath = 'client/public' + item[0].audio;
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }

    // Изтрий от базата
    await db.delete(gameItems).where(eq(gameItems.id, id));

    res.json({ message: 'Предметът е изтрит успешно' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// DELETE /api/admin/categories/cleanup - delete category indices with empty or null description
router.delete('/categories/cleanup', async (req, res) => {
  try {
    // Guard: require explicit confirm=true query param to run
    const confirm = req.query.confirm === 'true';
    if (!confirm) {
      return res.status(400).json({ error: 'Confirm deletion by adding ?confirm=true to the request' });
    }

    // Prevent running in production accidentally
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Cleanup endpoint is disabled in production' });
    }

    // Use raw SQL to check for NULL or empty description (avoids TypeScript overload issues)
    const preview = await db.select().from(categoriesIndices).where(sql`(${categoriesIndices.description} IS NULL OR ${categoriesIndices.description} = '')`);

    // If nothing to delete, return early
    if (!preview || preview.length === 0) {
      return res.json({ deletedCount: 0, rows: [] });
    }

    // Perform delete using raw SQL
    await db.execute(sql`DELETE FROM categories_indices WHERE description IS NULL OR description = ''`);

    return res.json({ deletedCount: preview.length, rows: preview });
  } catch (error) {
    console.error('Error cleaning categories:', error);
    res.status(500).json({ error: 'Failed to clean categories' });
  }
});

export default router;