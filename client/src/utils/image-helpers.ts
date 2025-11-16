// Вземи това име от твоя Cloudinary Dashboard
const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUD_NAME_HERE';

/**
 * Генерира пълен Cloudinary URL от public ID (file_name).
 * Добавя автоматични оптимизации (формат, качество, ширина).
 */
export function getImageUrl(publicId: string): string {
  // Ако по някаква причина ID-то е празно, върни placeholder
  if (!publicId) {
    // Промени това, ако твоят placeholder е на друго място
    return '/placeholder-1.png'; 
  }

  // Ако някъде е останал стар, пълен URL, просто го върни
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    return publicId;
  }

  // Това са стандартни оптимизации на Cloudinary:
  // f_auto = автоматичен формат (webp, avif)
  // q_auto = автоматично качество
  // w_600 = ширина 600px (промени, ако искаш)
  // c_fit = запази пропорциите
  const transformations = 'f_auto,q_auto,w_600,c_fit';

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformations}/${publicId}`;
}
