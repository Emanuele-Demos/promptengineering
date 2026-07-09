import db from '../config/db.js';

export const getFolders = (req, res) => {
  db.all('SELECT * FROM folders', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

export const createFolder = (req, res) => {
  const { id, name, color } = req.body;
  db.run(
    'INSERT INTO folders (id, name, color) VALUES (?, ?, ?)',
    [id, name, color],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, name, color });
    }
  );
};

export const updateFolder = (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = Object.keys(updates);
  if (fields.length === 0) return res.status(400).json({ error: 'Nessun campo specificato per l\'aggiornamento' });

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = [...Object.values(updates), id];

  db.run(`UPDATE folders SET ${setClause} WHERE id = ?`, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, ...updates });
  });
};

export const deleteFolder = (req, res) => {
  const { id } = req.params;
  db.serialize(() => {
    // Quando una cartella viene eliminata, i task appartenenti rimangono ma con folderId a null
    db.run('UPDATE tasks SET folderId = NULL WHERE folderId = ?', [id]);
    db.run('DELETE FROM folders WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Cartella rimossa con successo' });
    });
  });
};
