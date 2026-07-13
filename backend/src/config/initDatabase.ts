import { connectDatabase } from "./database";

export async function initializeDatabase() {

    const db = await connectDatabase();

    await db.exec(`
        PRAGMA foreign_keys = ON;
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS members(
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            role TEXT NOT NULL,
            color TEXT NOT NULL
        );
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS tasks(
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            notes TEXT,
            status TEXT NOT NULL,
            priority TEXT NOT NULL,
            assigneeId TEXT,
            dueDate TEXT,
            createdAt TEXT,
            updatedAt TEXT,

            FOREIGN KEY(assigneeId)
            REFERENCES members(id)
            ON DELETE SET NULL
        );
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS attachments(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            taskId TEXT NOT NULL,
            fileName TEXT NOT NULL,
            path TEXT NOT NULL,
            type TEXT NOT NULL,
            size INTEGER NOT NULL,

            FOREIGN KEY(taskId)
            REFERENCES tasks(id)
            ON DELETE CASCADE
        );
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS task_tags(
            taskId TEXT,
            tag TEXT,

            PRIMARY KEY(taskId,tag),

            FOREIGN KEY(taskId)
            REFERENCES tasks(id)
            ON DELETE CASCADE
        );
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS task_links(
            taskId TEXT,
            link TEXT,

            PRIMARY KEY(taskId,link),

            FOREIGN KEY(taskId)
            REFERENCES tasks(id)
            ON DELETE CASCADE
        );
    `);

    console.log("✅ Database inizializzato");

    await db.close();
}