// Взех това име от твоите логове за грешки (db8o7so6j)
const CLOUDINARY_CLOUD_NAME = 'db8o7so6j'; 

/**
 * Генерира пълен Cloudinary URL или връща поправен линк.
 */
export function getImageUrl(publicId: string | null | undefined): string {
  // 1. Ако няма ID, връщаме placeholder
  if (!publicId) {
    return '/images/placeholder-1.png'; 
  }

  // 2. Ако вече е пълен URL (започва с http/https)
  if (publicId.startsWith('http')) {
    let cleanUrl = publicId;

    // ФИКС: Оправяне на "https:/res..." (една наклонена черта), което видяхме в лога
    if (cleanUrl.includes('https:/') && !cleanUrl.includes('https://')) {
        cleanUrl = cleanUrl.replace('https:/', 'https://');
    }
    if (cleanUrl.includes('http:/') && !cleanUrl.includes('http://')) {
        cleanUrl = cleanUrl.replace('http:/', 'http://');
    }

    return cleanUrl;
  }

  // 3. Ако е локален път (започва с /images или /assets), връщаме го както е
  // Това предпазва от грешката, ако някой файл си е локален.
  if (publicId.startsWith('/') || publicId.startsWith('assets')) {
      return publicId;
  }

  // 4. Генериране на нов Cloudinary URL (ако е само име на файл)
  const transformations = 'f_auto,q_auto,w_600,c_fit';

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformations}/${publicId}`;
}
