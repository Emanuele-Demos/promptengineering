export const uploadConfig = {
  storage: (process.env.UPLOAD_STORAGE || 'local') as 'local' | 'cloudinary',
  maxFileSizeMb: Number(process.env.UPLOAD_MAX_MB || 10),
  maxFileSize: Number(process.env.UPLOAD_MAX_MB || 10) * 1024 * 1024,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
}

export function isCloudinaryEnabled(): boolean {
  const { cloudName, apiKey, apiSecret } = uploadConfig.cloudinary
  return uploadConfig.storage === 'cloudinary' && Boolean(cloudName && apiKey && apiSecret)
}
