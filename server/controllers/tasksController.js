import db from '../config/db.js';

function parseJson(value, fallback) {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function calculateNextDate(dueDate, repeatType, repeatEvery = 1, repeatDays = []) {
  if (!dueDate || !repeatType || repeatType === 'none') return null;
  const base = new Date(`${dueDate}T00:00:00`);
  const every = Math.max(1, Number(repeatEvery) || 1);

  if (repeatType === 'daily') return formatDate(addDays(base, every));
  if (repeatType === 'weekly') {
    const days = Array.isArray(repeatDays) ? repeatDays.map(Number).sort((a, b) => a - b) : [];
    if (days.length > 0) {
      for (let offset = 1; offset <= 7 * every; offset += 1) {
        const candidate = addDays(base, offset);
        if (days.includes(candidate.getDay())) return formatDate(candidate);
      }
    }
    return formatDate(addDays(base, 7 * every));
  }
  if (repeatType === 'monthly') {
    const next = new Date(base);
    next.setMonth(next.getMonth() + every);
    return formatDate(next);
  }
  if (repeatType === 'yearly') {
    const next = new Date(base);
    next.setFullYear(next.getFullYear() + every);
    return formatDate(next);
  }
  if (repeatType === 'custom') return formatDate(addDays(base, every));

  return null;
}

export const getTasks = (req, res) => {
  const includeArchived = req.query.archived === 'true';
  const sql = includeArchived ? 'SELECT * FROM tasks WHERE archived = 1' : 'SELECT * FROM tasks WHERE archived = 0 OR archived IS NULL';

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    db.all('SELECT * FROM attachments', [], (attachmentsErr, attachments) => {
      if (attachmentsErr) return res.status(500).json({ error: attachmentsErr.message });

      const formatted = rows.map((r) => ({
        ...r,
        notes: r.notes || '',
        links: parseJson(r.links, []),
        tags: parseJson(r.tags, []),
        repeatDays: parseJson(r.repeatDays, []),
        repeatStopped: Boolean(r.repeatStopped),
        archived: Boolean(r.archived),
        attachments: attachments
          .filter((attachment) => attachment.taskId === r.id)
          .map((attachment) => ({
            ...attachment,
            path: attachment.path.startsWith('http')
              ? attachment.path
              : `http://localhost:3001${attachment.path}`,
          })),
      }));
      res.json(formatted);
    });
  });
};

export const createTask = (req, res) => {
  const {
    id,
    title,
    description,
    notes,
    links,
    status,
    priority,
    assigneeId,
    folderId,
    categoryId,
    projectId,
    dueDate,
    archived = false,
    estimatedTime,
    reminderDate,
    repeatType = 'none',
    repeatEvery,
    repeatEnd,
    repeatDays = [],
    repeatMaxOccurrences,
    repeatCount = 0,
    repeatNextDate,
    repeatStopped = false,
    repeatParentId,
    tags,
    createdAt,
    updatedAt,
  } = req.body;
  const tagsStr = JSON.stringify(tags || []);
  const linksStr = JSON.stringify(links || []);
  const repeatDaysStr = JSON.stringify(repeatDays || []);
  const nextDate = repeatNextDate ?? calculateNextDate(dueDate, repeatType, repeatEvery, repeatDays);
  db.run(
    `INSERT INTO tasks
      (id, title, description, notes, links, status, priority, assigneeId, folderId, categoryId, projectId, dueDate, archived, estimatedTime, reminderDate, repeatType, repeatEvery, repeatEnd, repeatDays, repeatMaxOccurrences, repeatCount, repeatNextDate, repeatStopped, repeatParentId, tags, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      title,
      description,
      notes || '',
      linksStr,
      status,
      priority,
      assigneeId,
      folderId,
      categoryId ?? null,
      projectId ?? null,
      dueDate,
      archived ? 1 : 0,
      estimatedTime ?? null,
      reminderDate ?? null,
      repeatType,
      repeatEvery ?? null,
      repeatEnd ?? null,
      repeatDaysStr,
      repeatMaxOccurrences ?? null,
      repeatCount ?? 0,
      nextDate,
      repeatStopped ? 1 : 0,
      repeatParentId ?? null,
      tagsStr,
      createdAt,
      updatedAt,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        id,
        title,
        description,
        notes: notes || '',
        links: links || [],
        status,
        priority,
        assigneeId,
        folderId,
        categoryId: categoryId ?? null,
        projectId: projectId ?? null,
        dueDate,
        archived,
        estimatedTime: estimatedTime ?? null,
        reminderDate: reminderDate ?? null,
        repeatType,
        repeatEvery: repeatEvery ?? null,
        repeatEnd: repeatEnd ?? null,
        repeatDays,
        repeatMaxOccurrences: repeatMaxOccurrences ?? null,
        repeatCount: repeatCount ?? 0,
        repeatNextDate: nextDate,
        repeatStopped,
        repeatParentId: repeatParentId ?? null,
        tags,
        attachments: [],
        createdAt,
        updatedAt,
      });
    }
  );
};

export const updateTask = (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  
  if (updates.tags) {
    updates.tags = JSON.stringify(updates.tags);
  }
  if (updates.links) {
    updates.links = JSON.stringify(updates.links);
  }
  if (updates.repeatDays) {
    updates.repeatDays = JSON.stringify(updates.repeatDays);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'repeatStopped')) {
    updates.repeatStopped = updates.repeatStopped ? 1 : 0;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'archived')) {
    updates.archived = updates.archived ? 1 : 0;
  }
  if (
    Object.prototype.hasOwnProperty.call(req.body, 'dueDate') ||
    Object.prototype.hasOwnProperty.call(req.body, 'repeatType') ||
    Object.prototype.hasOwnProperty.call(req.body, 'repeatEvery') ||
    Object.prototype.hasOwnProperty.call(req.body, 'repeatDays')
  ) {
    const repeatType = req.body.repeatType ?? updates.repeatType;
    if (repeatType && repeatType !== 'none') {
      updates.repeatNextDate = calculateNextDate(req.body.dueDate, repeatType, req.body.repeatEvery, req.body.repeatDays);
    }
  }

  const fields = Object.keys(updates);
  if (fields.length === 0) return res.status(400).json({ error: 'Nessun campo specificato per l\'aggiornamento' });

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = [...Object.values(updates), id];

  db.run(`UPDATE tasks SET ${setClause} WHERE id = ?`, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });

    if (Object.prototype.hasOwnProperty.call(req.body, 'reminderDate')) {
      db.run('DELETE FROM notifications WHERE taskId = ? AND type = ?', [id, 'reminder']);
    }
    
    const responseData = { ...req.body };
    if (responseData.tags && typeof responseData.tags === 'string') {
      responseData.tags = JSON.parse(responseData.tags);
    }
    if (responseData.links && typeof responseData.links === 'string') {
      responseData.links = JSON.parse(responseData.links);
    }
    if (responseData.repeatDays && typeof responseData.repeatDays === 'string') {
      responseData.repeatDays = JSON.parse(responseData.repeatDays);
    }
    if (Object.prototype.hasOwnProperty.call(responseData, 'repeatStopped')) {
      responseData.repeatStopped = Boolean(responseData.repeatStopped);
    }
    if (Object.prototype.hasOwnProperty.call(responseData, 'archived')) {
      responseData.archived = Boolean(responseData.archived);
    }
    res.json({ id, ...responseData });
  });
};

export const deleteTask = (req, res) => {
  const { id } = req.params;
  db.serialize(() => {
    db.run('DELETE FROM notifications WHERE taskId = ?', [id]);
    db.run('DELETE FROM attachments WHERE taskId = ?', [id]);
    db.run('DELETE FROM tasks WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Task eliminato con successo' });
    });
  });
};
