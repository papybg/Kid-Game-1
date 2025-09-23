import { Router } from 'express';
import multer from 'multer';
import path from 'path';

const router = Router();

// Multer configuration за файл upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'image') {
      cb(null, 'client/public/uploads/images/');
    } else if (file.fieldname === 'audio') {
      cb(null, 'client/public/uploads/audio/');
    } else {
      cb(null, 'client/public/uploads/');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'image') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    } else if (file.fieldname === 'audio') {
      if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    } else {
      cb(null, true);
    }
  }
});

// Mock data за тестване
const mockItems: Array<{
  id: number;
  name: string;
  image: string | null;
  audio: string | null;
  index: string;
  category: string;
}> = [
  { id: 1, name: 'Test Item 1', image: null, audio: null, index: 'a', category: 'test' },
  { id: 2, name: 'Test Item 2', image: null, audio: null, index: 'b', category: 'test' }
];

// Mock categories data - базирано на реалните данни от schema
const mockCategories = [
  { id: 1, categoryName: "домашни", indexValue: "h", description: "Домашни животни" },
  { id: 2, categoryName: "селскостопански", indexValue: "p", description: "Селскостопански животни" },
  { id: 3, categoryName: "транспорт", indexValue: "i", description: "Транспорт - влак" },
  { id: 4, categoryName: "транспорт", indexValue: "r", description: "Транспорт - автобус" },
  { id: 5, categoryName: "транспорт", indexValue: "s", description: "Транспорт - самолет" },
  { id: 6, categoryName: "птици", indexValue: "s", description: "Птици" },
  { id: 7, categoryName: "test", indexValue: "t", description: "Тест категория" }
];

// GET /api/admin/items - вземи всички предмети
router.get('/items', async (req, res) => {
  console.log('Admin GET /items called');
  res.json(mockItems);
});

// GET /api/admin/categories - вземи всички категории и индекси
router.get('/categories', async (req, res) => {
  console.log('Admin GET /categories called');
  res.json(mockCategories);
});

// POST /api/admin/items - създай нов предмет с поддръжка за файлове
router.post('/items', upload.fields([
  { name: 'image', maxCount: 1 }, 
  { name: 'audio', maxCount: 1 }
]), async (req, res) => {
  console.log('Admin POST /items called');
  console.log('Body:', req.body);
  console.log('Files:', req.files);
  
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  
  const newItem = {
    id: Date.now(),
    name: req.body.name || 'New Item',
    image: files?.image?.[0] ? `/uploads/images/${files.image[0].filename}` : null,
    audio: files?.audio?.[0] ? `/uploads/audio/${files.audio[0].filename}` : null,
    index: req.body.index || 'x',
    category: req.body.category || 'mock'
  };
  
  // Добави към mock данните (в реалния случай ще бъде в база данни)
  mockItems.push(newItem);
  
  res.status(201).json(newItem);
});

export default router;