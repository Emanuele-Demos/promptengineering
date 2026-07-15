PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    firstName TEXT,
    lastName TEXT,
    username TEXT UNIQUE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'User',
    color TEXT NOT NULL,
    password TEXT,
    isActive INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    color TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    ownerId INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (ownerId) REFERENCES members(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL,
    priority TEXT NOT NULL,
    assigneeId INTEGER,
    categoryId TEXT,
    projectId TEXT,
    dueDate TEXT,
    reminderDate TEXT,
    reminderType TEXT,
    reminderSentAt TEXT,
    isRecurring INTEGER NOT NULL DEFAULT 0,
    repeatType TEXT,
    repeatEvery INTEGER DEFAULT 1,
    repeatCustomUnit TEXT,
    repeatEndType TEXT DEFAULT 'never',
    repeatEnd TEXT,
    repeatOccurrences INTEGER,
    occurrencesGenerated INTEGER DEFAULT 0,
    lastGeneratedAt TEXT,
    nextOccurrence TEXT,
    parentTaskId TEXT,
    repeatDays TEXT DEFAULT '[]',
    maxOccurrences INTEGER,
    currentOccurrences INTEGER DEFAULT 0,
    isRecurringActive INTEGER NOT NULL DEFAULT 1,
    favorite INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0,
    archivedAt TEXT,
    estimatedTime INTEGER,
    actualTime INTEGER,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (assigneeId) REFERENCES members(id) ON DELETE SET NULL,
    FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    taskId TEXT NOT NULL,
    fileName TEXT NOT NULL,
    originalName TEXT NOT NULL,
    mimeType TEXT NOT NULL,
    size INTEGER NOT NULL,
    path TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_notes (
    id TEXT PRIMARY KEY,
    taskId TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_tags (
    taskId TEXT NOT NULL,
    tag TEXT NOT NULL,
    PRIMARY KEY (taskId, tag),
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_links (
    taskId TEXT NOT NULL,
    link TEXT NOT NULL,
    PRIMARY KEY (taskId, link),
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stato (
    slug TEXT PRIMARY KEY,
    valore_stato TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId INTEGER NOT NULL,
    taskId TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    isRead INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    readAt TEXT,
    FOREIGN KEY (userId) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    userId INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('daily', 'weekly')),
    target INTEGER NOT NULL,
    periodStart TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES members(id) ON DELETE CASCADE,
    UNIQUE(userId, type)
);

CREATE TABLE IF NOT EXISTS goal_history (
    id TEXT PRIMARY KEY,
    goalId TEXT NOT NULL,
    userId INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('daily', 'weekly')),
    target INTEGER NOT NULL,
    completedTasks INTEGER NOT NULL,
    completionPercentage INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('reached', 'not_reached')),
    periodStart TEXT NOT NULL,
    periodEnd TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES members(id) ON DELETE CASCADE
);
