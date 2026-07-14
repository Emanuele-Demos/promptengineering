import db from '../config/db.js';

export const getNotifications = (req, res) => {
  db.all('SELECT * FROM notifications ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map((row) => ({ ...row, read: Boolean(row.read) })));
  });
};

export const markAllNotificationsAsRead = (req, res) => {
  db.run('UPDATE notifications SET read = 1', [], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Notifiche lette', updated: this.changes });
  });
};

export const deleteNotification = (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM notifications WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Notifica eliminata' });
  });
};

export const markNotificationAsRead = (req, res) => {
  const { id } = req.params;
  db.run('UPDATE notifications SET read = 1 WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Notifica letta' });
  });
};
