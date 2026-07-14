import db from '../config/db.js';

export const getCategories = (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

export const createCategory = (req, res) => {
  const { id, name, color } = req.body;
  db.run(
    'INSERT INTO categories (id, name, color) VALUES (?, ?, ?)',
    [id, name, color],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, name, color });
    }
  );
};

export const updateCategory = (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = Object.keys(updates);
  if (fields.length === 0) return res.status(400).json({ error: 'Nessun campo specificato per l\'aggiornamento' });

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = [...Object.values(updates), id];

  db.run(`UPDATE categories SET ${setClause} WHERE id = ?`, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, ...updates });
  });
};

export const deleteCategory = (req, res) => {
  const { id } = req.params;
  db.serialize(() => {
    db.run('UPDATE tasks SET categoryId = NULL WHERE categoryId = ?', [id]);
    db.run('DELETE FROM categories WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Categoria rimossa con successo' });
    });
  });
};
