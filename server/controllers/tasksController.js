import db from '../config/db.js';

export const getTasks = (req, res) => {
  db.all('SELECT * FROM tasks', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = rows.map((r) => ({
      ...r,
      tags: JSON.parse(r.tags || '[]'),
    }));
    res.json(formatted);
  });
};

export const createTask = (req, res) => {
  const { id, title, description, status, priority, assigneeId, folderId, dueDate, tags, createdAt, updatedAt } = req.body;
  const tagsStr = JSON.stringify(tags || []);
  db.run(
    'INSERT INTO tasks (id, title, description, status, priority, assigneeId, folderId, dueDate, tags, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, title, description, status, priority, assigneeId, folderId, dueDate, tagsStr, createdAt, updatedAt],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, title, description, status, priority, assigneeId, folderId, dueDate, tags, createdAt, updatedAt });
    }
  );
};

export const updateTask = (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  
  if (updates.tags) {
    updates.tags = JSON.stringify(updates.tags);
  }

  const fields = Object.keys(updates);
  if (fields.length === 0) return res.status(400).json({ error: 'Nessun campo specificato per l\'aggiornamento' });

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = [...Object.values(updates), id];

  db.run(`UPDATE tasks SET ${setClause} WHERE id = ?`, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    
    const responseData = { ...req.body };
    if (responseData.tags && typeof responseData.tags === 'string') {
      responseData.tags = JSON.parse(responseData.tags);
    }
    res.json({ id, ...responseData });
  });
};

export const deleteTask = (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM tasks WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Task eliminato con successo' });
  });
};
