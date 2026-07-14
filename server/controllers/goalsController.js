import db from '../config/db.js';

export const getGoals = (req, res) => {
  db.all('SELECT * FROM goals ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

export const createGoal = (req, res) => {
  const { id, userId, type, target, createdAt } = req.body;

  if (!id || !type || typeof target !== 'number' || target <= 0) {
    return res.status(400).json({ error: 'Dati obiettivo non validi' });
  }

  if (type !== 'daily' && type !== 'weekly') {
    return res.status(400).json({ error: 'Tipo obiettivo non valido' });
  }

  const goalId = id;
  const goalUserId = userId || 'default-user';
  const goalCreatedAt = createdAt || new Date().toISOString();

  db.run(
    'INSERT INTO goals (id, userId, type, target, createdAt) VALUES (?, ?, ?, ?, ?)',
    [goalId, goalUserId, type, target, goalCreatedAt],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: goalId, userId: goalUserId, type, target, createdAt: goalCreatedAt });
    },
  );
};
