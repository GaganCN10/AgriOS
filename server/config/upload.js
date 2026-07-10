const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const IMAGE_SIGNATURES = [
  { ext: 'png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { ext: 'jpeg', bytes: [0xff, 0xd8, 0xff] },
  { ext: 'gif', bytes: [0x47, 0x49, 0x46] },
];

const isAllowedImage = (filePath) => {
  const buffer = Buffer.alloc(4);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, 4, 0);
  fs.closeSync(fd);
  return IMAGE_SIGNATURES.some((sig) =>
    sig.bytes.every((byte, index) => buffer[index] === byte)
  );
};

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPEG, JPG, and GIF image files are allowed'), false);
    }
  },
});

module.exports = { upload, uploadsDir, isAllowedImage };
