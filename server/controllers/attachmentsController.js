import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, unlink } from 'fs';
import { dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import db from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadDir = join(__dirname, '..', 'uploads');

if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const extension = extname(file.originalname);
    callback(null, `${randomUUID()}${extension}`);
  },
});

export const uploadAttachmentsMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype.startsWith('image/') || allowedMimeTypes.has(file.mimetype)) {
      callback(null, true);
      return;
    }
    callback(new Error('Formato file non supportato'));
  },
}).array('attachments', 10);

function rowToAttachment(row) {
  return {
    ...row,
    path: row.path.startsWith('http') ? row.path : `http://localhost:3001${row.path}`,
  };
}

export const getTaskAttachments = (req, res) => {
  const { taskId } = req.params;
  db.all('SELECT * FROM attachments WHERE taskId = ? ORDER BY createdAt DESC', [taskId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(rowToAttachment));
  });
};

export const uploadTaskAttachments = (req, res) => {
  const { taskId } = req.params;
  const files = req.files || [];

  if (files.length === 0) {
    return res.status(400).json({ error: 'Nessun file caricato' });
  }

  const createdAt = new Date().toISOString();
  const attachments = files.map((file) => ({
    id: randomUUID(),
    taskId,
    fileName: file.originalname,
    path: `/uploads/${file.filename}`,
    type: file.mimetype,
    size: file.size,
    createdAt,
  }));

  const stmt = db.prepare(
    'INSERT INTO attachments (id, taskId, fileName, path, type, size, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );

  attachments.forEach((attachment) => {
    stmt.run(
      attachment.id,
      attachment.taskId,
      attachment.fileName,
      attachment.path,
      attachment.type,
      attachment.size,
      attachment.createdAt,
    );
  });

  stmt.finalize((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json(attachments.map(rowToAttachment));
  });
};

export const deleteAttachment = (req, res) => {
  const { id } = req.params;
  db.get('SELECT path FROM attachments WHERE id = ?', [id], (selectErr, row) => {
    if (selectErr) return res.status(500).json({ error: selectErr.message });

    db.run('DELETE FROM attachments WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });

      if (row?.path?.startsWith('/uploads/')) {
        unlink(join(uploadDir, row.path.replace('/uploads/', '')), () => {});
      }

      res.json({ message: 'Allegato eliminato con successo' });
    });
  });
};
