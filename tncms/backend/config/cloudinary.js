const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes('<');

const createStorage = (folder) => {
  if (isCloudinaryConfigured) {
    return new CloudinaryStorage({
      cloudinary,
      params: {
        folder: `tncms/${folder}`,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1024, crop: 'limit', quality: 'auto' }],
      },
    });
  }
  // Local disk storage — only works in development
  const path = require('path');
  const fs = require('fs');
  const dir = path.join(__dirname, '../uploads', folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });
};

const resolveFilePath = (folder, file) => {
  if (isCloudinaryConfigured) return file.path;
  return `/uploads/${folder}/${file.filename}`;
};

const wrapMulter = (upload, folder) => (req, res, next) => {
  upload(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (req.files?.length) req.files.forEach(f => { f.resolvedPath = resolveFilePath(folder, f); });
    if (req.file) req.file.resolvedPath = resolveFilePath(folder, req.file);
    next();
  });
};

const uploadComplaintImages = wrapMulter(
  multer({ storage: createStorage('complaints'), limits: { fileSize: 5 * 1024 * 1024 } }).array('images', 5),
  'complaints'
);

const uploadCompletionPhotos = wrapMulter(
  multer({ storage: createStorage('completions'), limits: { fileSize: 5 * 1024 * 1024 } }).array('completionPhotos', 5),
  'completions'
);

const uploadProfilePhoto = wrapMulter(
  multer({ storage: createStorage('profiles'), limits: { fileSize: 2 * 1024 * 1024 } }).single('photo'),
  'profiles'
);

module.exports = { cloudinary, uploadComplaintImages, uploadCompletionPhotos, uploadProfilePhoto };
