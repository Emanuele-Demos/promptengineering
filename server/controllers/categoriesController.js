import { v4 as uuid } from 'uuid';
import db from '../config/db.js';

const HEX_COLOR_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function validateCategoryPayload(payload) {
  const errors = [];

  if (!payload?.name || !String(payload.name).trim()) {
    errors.push('Il nome è obbligatorio');
  }

  if (!payload?.color || !HEX_COLOR_REGEX.test(String(payload.color))) {
    errors.push('Il colore deve essere un valore HEX valido');
  }

  return errors;
}

function normalizeCategory(row) {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.createdAt,
  };
}

export const getCategories = (req, res) => {
  db.all('SELECT * FROM categories ORDER BY createdAt ASC, name ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(normalizeCategory));
  });
};

export const createCategory = (req, res) => {
  const errors = validateCategoryPayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0] });
  }

  const name = String(req.body.name).trim();
  const color = String(req.body.color).trim();
  const id = req.body.id || uuid();
  const createdAt = new Date().toISOString();

  db.get('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)', [name], (err, existing) => {
    if (err) return res.status(500).json({ error: err.message });
    if (existing) return res.status(409).json({ error: 'Esiste già una categoria con questo nome' });

    db.run(
      'INSERT INTO categories (id, name, color, createdAt) VALUES (?, ?, ?, ?)',
      [id, name, color, createdAt],
      function (insertErr) {
        if (insertErr) return res.status(500).json({ error: insertErr.message });
        res.status(201).json({ id, name, color, createdAt });
      },
    );
  });
};

export const updateCategory = (req, res) => {
  const { id } = req.params;
  const errors = validateCategoryPayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0] });
  }

  const name = String(req.body.name).trim();
  const color = String(req.body.color).trim();

  db.get('SELECT id FROM categories WHERE id = ?', [id], (err, category) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!category) return res.status(404).json({ error: 'Categoria non trovata' });

    db.get('SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?', [name, id], (dupErr, duplicate) => {
      if (dupErr) return res.status(500).json({ error: dupErr.message });
      if (duplicate) return res.status(409).json({ error: 'Esiste già una categoria con questo nome' });

      db.run('UPDATE categories SET name = ?, color = ? WHERE id = ?', [name, color, id], function (updateErr) {
        if (updateErr) return res.status(500).json({ error: updateErr.message });
        res.json({ id, name, color, createdAt: category.createdAt || new Date().toISOString() });
      });
    });
  });
};

export const deleteCategory = (req, res) => {
  const { id } = req.params;

  db.serialize(() => {
    db.run('UPDATE tasks SET categoryId = NULL WHERE categoryId = ?', [id]);
    db.run('DELETE FROM categories WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Categoria non trovata' });
      res.json({ message: 'Categoria eliminata con successo' });
    });
  });
};
