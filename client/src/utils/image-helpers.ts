// Tвоето Cloud Name
const CLOUDINARY_CLOUD_NAME = 'db8o7so6j';

export function getImageUrl(publicId: string | null | undefined): string {
  // 1. Ако няма ID, връщаме placeholder
  if (!publicId) {
    return '/images/placeholder-1.png'; 
  }

  // 2. Превръщаме в стринг за сигурност
  let path = String(publicId);

  // 3. КЛЮЧОВАТА ПОПРАВКА:
  // Проверяваме дали започва с "http", БЕЗ да гледаме наклонените черти.
  if (path.startsWith('http')) {
    
    // Ако адресът е счупен (има само една черта), го поправяме
    if (path.startsWith('https:/') && !path.startsWith('https://')) {
       return path.replace('https:/', 'https://');
    }
    if (path.startsWith('http:/') && !path.startsWith('http://')) {
       return path.replace('http:/', 'http://');
    }

    // Ако е здрав, го връщаме както е
    return path;
  }

  // 4. Ако е локален път (започва с /images или /assets), не го пипаме
  if (path.startsWith('/') || path.startsWith('assets')) {
      return path;
  }

  // 5. Ако е само име на файл, генерираме Cloudinary линк
  const transformations = 'f_auto,q_auto,w_600,c_fit';
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformations}/${path}`;
}
