import db from '../config/db.js';

export const getProjects = (_req, res) => {
  db.all('SELECT * FROM projects ORDER BY name ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

export const createProject = (req, res) => {
  const { id, name, description, owner } = req.body;

  db.run(
    'INSERT INTO projects (id, name, description, owner) VALUES (?, ?, ?, ?)',
    [id, name, description || '', owner || ''],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, name, description: description || '', owner: owner || '' });
    },
  );
};

export const updateProject = (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = Object.keys(updates);

  if (fields.length === 0) {
    return res.status(400).json({ error: 'Nessun campo specificato per l\'aggiornamento' });
  }

  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  const values = [...Object.values(updates), id];

  db.run(`UPDATE projects SET ${setClause} WHERE id = ?`, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, ...updates });
  });
};

export const deleteProject = (req, res) => {
  const { id } = req.params;

  db.serialize(() => {
    db.run('UPDATE tasks SET projectId = NULL WHERE projectId = ?', [id]);
    db.run('DELETE FROM projects WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Progetto eliminato con successo' });
    });
  });
};
