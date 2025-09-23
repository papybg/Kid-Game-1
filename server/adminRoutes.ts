import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { db } from './db';
import { gameItems, insertGameItemSchema } from '../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Настройка на multer за uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'client/public/uploads/');
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
    // Позволи само картинки
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Само картинки са позволени!'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB лимит
  }
});

// GET /api/admin/items - вземи всички предмети
router.get('/items', async (req, res) => {
  try {
    const items = await db.select().from(gameItems).orderBy(gameItems.id);
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// POST /api/admin/items - създай нов предмет
router.post('/items', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Няма качен файл' });
    }

    const { name, index, category } = req.body;

    // Валидирай данните
    const validatedData = insertGameItemSchema.parse({
      name,
      index,
      category,
      image: `/uploads/${req.file.filename}` // Пътят до файла
    });

    // Запиши в базата
    const newItem = await db.insert(gameItems).values(validatedData).returning();

    res.status(201).json(newItem[0]);
  } catch (error) {
    console.error('Error creating item:', error);

    // Изтрий качения файл ако има грешка
    if (req.file) {
      const fs = await import('fs');
      fs.unlinkSync(req.file.path);
    }

    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create item' });
    }
  }
});

// PUT /api/admin/items/:id - редактирай предмет
router.put('/items/:id', upload.single('image'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, index, category } = req.body;

    // Провери дали предметът съществува
    const existingItem = await db.select().from(gameItems).where(eq(gameItems.id, id)).limit(1);
    if (existingItem.length === 0) {
      return res.status(404).json({ error: 'Предметът не е намерен' });
    }

    // Подготви данните за обновяване
    const updateData: any = { name, index, category };

    // Ако има нов файл, обнови image path
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;

      // Изтрий стария файл
      const fs = await import('fs');
      const oldImagePath = 'client/public' + existingItem[0].image;
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
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

    // Изтрий новия файл ако има грешка
    if (req.file) {
      const fs = await import('fs');
      fs.unlinkSync(req.file.path);
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

    // Изтрий файла от диска
    const fs = await import('fs');
    const imagePath = 'client/public' + item[0].image;
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Изтрий от базата
    await db.delete(gameItems).where(eq(gameItems.id, id));

    res.json({ message: 'Предметът е изтрит успешно' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;