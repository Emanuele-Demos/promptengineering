import db from '../config/db.js';

export const getNotifications = (_req, res) => {
  db.all('SELECT * FROM notifications ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map((row) => ({ ...row, read: Boolean(row.read) })));
  });
};

export const markNotificationRead = (req, res) => {
  const { id } = req.params;
  db.run('UPDATE notifications SET read = 1 WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, read: true });
  });
};

export const deleteNotification = (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM notifications WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Notifica eliminata con successo' });
  });
};
