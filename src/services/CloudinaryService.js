const CLOUDINARY_CONFIG = {
  cloudName: 'dsoeygvmy',
  apiKey: '818952942128885',
  apiSecret: 'qI-HxU1_wsYu1YKjr5_nKaIsYMw',
  folder: 'music-catalog',
};

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

export const uploadImageToCloudinary = async (imageUri) => {
  if (!imageUri) return null;

  try {
    const filename = `album_${Date.now()}.jpg`;
    const formData = new FormData();
    
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: filename,
    });
    
    formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);
    formData.append('upload_preset', 'music_catalog_unsigned');
    formData.append('folder', CLOUDINARY_CONFIG.folder);

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Cloudinary upload success:', data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return null;
  }
};

export const deleteImageFromCloudinary = async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('cloudinary')) {
    return true;
  }

  console.log('Skipping Cloudinary image deletion (requires signed API)');
  return true;
};

const sha1Hash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(40, '0').substring(0, 40);
};

const extractPublicId = (imageUrl) => {
  try {
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    let publicIdWithParams = urlParts.slice(uploadIndex + 1).join('/');
    const dotIndex = publicIdWithParams.lastIndexOf('.');
    if (dotIndex !== -1) {
      publicIdWithParams = publicIdWithParams.substring(0, dotIndex);
    }
    
    return `${CLOUDINARY_CONFIG.folder}/${publicIdWithParams}`;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

export const isCloudinaryImage = (url) => {
  return url && url.includes('cloudinary');
};

export default {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
  isCloudinaryImage,
};