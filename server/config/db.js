import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Errore di connessione al database SQLite:', err.message);
  } else {
    console.log('Connesso con successo al database SQLite:', dbPath);
  }
});

// Seed iniziale
const initialMembers = [
  { id: 'm1', name: 'Enzo Rossi', email: 'enzo.rossi@team.it', role: 'Project Lead', color: '#6366f1' },
  { id: 'm2', name: 'Giovanna Bianchi', email: 'giovanna.bianchi@team.it', role: 'Product Designer', color: '#8b5cf6' },
  { id: 'm3', name: 'Christian Verdi', email: 'christian.verdi@team.it', role: 'Frontend Engineer', color: '#ec4899' },
  { id: 'm4', name: 'Alessia Neri', email: 'alessia.neri@team.it', role: 'Operations Manager', color: '#14b8a6' },
];

const initialFolders = [
  { id: 'f1', name: 'Sviluppo Frontend', color: '#6366f1' },
  { id: 'f2', name: 'Sviluppo Backend', color: '#8b5cf6' },
  { id: 'f3', name: 'Pianificazione', color: '#14b8a6' },
];

const initialCategories = [
  { id: 'c1', name: 'Lavoro', color: '#6366f1' },
  { id: 'c2', name: 'Università', color: '#0ea5e9' },
  { id: 'c3', name: 'Personale', color: '#f59e0b' },
  { id: 'c4', name: 'Casa', color: '#10b981' },
];

const initialTasks = [
  { id: 't1', title: 'Preparare la presentazione per il cliente', description: 'Riunire dati, grafici e outline per la demo finale.', status: 'in_progress', priority: 'high', assigneeId: 'm1', folderId: 'f3', categoryId: 'c1', dueDate: '2026-07-18', tags: '[]', createdAt: '2026-07-01T09:00:00Z', updatedAt: '2026-07-05T14:30:00Z' },
  { id: 't2', title: 'Aggiornare il backlog dello sprint', description: 'Riorganizzare priorità e pulire task obsoleti.', status: 'todo', priority: 'medium', assigneeId: 'm4', folderId: 'f3', categoryId: 'c1', dueDate: '2026-07-16', tags: '[]', createdAt: '2026-07-02T10:00:00Z', updatedAt: '2026-07-02T10:00:00Z' },
  { id: 't3', title: 'Rivedere il mockup della landing page', description: 'Controllare coerenza dei componenti e spacing.', status: 'review', priority: 'medium', assigneeId: 'm2', folderId: 'f1', categoryId: 'c1', dueDate: '2026-07-20', tags: '[]', createdAt: '2026-06-28T11:00:00Z', updatedAt: '2026-07-04T16:00:00Z' },
  { id: 't4', title: 'Controllare il report mensile', description: 'Verificare numeri, grafici e eventuali errori di calcolo.', status: 'todo', priority: 'low', assigneeId: 'm3', folderId: 'f2', categoryId: 'c1', dueDate: '2026-07-21', tags: '[]', createdAt: '2026-07-03T08:00:00Z', updatedAt: '2026-07-03T08:00:00Z' },
  { id: 't5', title: 'Preparare appunti per esame di matematica', description: 'Organizzare esercizi e formule per il ripasso.', status: 'in_progress', priority: 'high', assigneeId: 'm4', folderId: 'f2', categoryId: 'c2', dueDate: '2026-07-17', tags: '[]', createdAt: '2026-06-20T09:00:00Z', updatedAt: '2026-06-30T17:00:00Z' },
  { id: 't6', title: 'Compilare il modulo universitario', description: 'Controllare dati richiesti e allegare documentazione.', status: 'todo', priority: 'medium', assigneeId: 'm4', folderId: 'f3', categoryId: 'c2', dueDate: '2026-07-19', tags: '[]', createdAt: '2026-07-04T12:00:00Z', updatedAt: '2026-07-05T09:00:00Z' },
  { id: 't7', title: 'Organizzare la cena di sabato', description: 'Scegliere menu e verificare disponibilità.', status: 'done', priority: 'low', assigneeId: 'm2', folderId: 'f1', categoryId: 'c3', dueDate: '2026-07-11', tags: '[]', createdAt: '2026-06-25T18:00:00Z', updatedAt: '2026-06-27T20:00:00Z' },
  { id: 't8', title: 'Fare la spesa per la settimana', description: 'Aggiornare lista e controllare scorte a casa.', status: 'todo', priority: 'medium', assigneeId: 'm1', folderId: 'f2', categoryId: 'c4', dueDate: '2026-07-12', tags: '[]', createdAt: '2026-07-06T07:30:00Z', updatedAt: '2026-07-06T07:30:00Z' },
  { id: 't9', title: 'Sistemare documenti fiscali', description: 'Raccogliere ricevute e verificare scadenze.', status: 'review', priority: 'high', assigneeId: 'm3', folderId: 'f3', categoryId: 'c3', dueDate: '2026-07-22', tags: '[]', createdAt: '2026-07-07T09:15:00Z', updatedAt: '2026-07-08T11:00:00Z' },
  { id: 't10', title: 'Pulire il salotto e cambiare lampada', description: 'Sostituire la lampadina del tavolo e riordinare gli scaffali.', status: 'todo', priority: 'low', assigneeId: 'm1', folderId: 'f1', categoryId: 'c4', dueDate: '2026-07-14', tags: '[]', createdAt: '2026-07-08T16:20:00Z', updatedAt: '2026-07-08T16:20:00Z' },
  { id: 't11', title: 'Rivedere il contratto freelance', description: 'Controllare termini e scadenze di pagamento.', status: 'in_progress', priority: 'urgent', assigneeId: 'm3', folderId: 'f2', categoryId: 'c1', dueDate: '2026-07-15', tags: '[]', createdAt: '2026-07-09T13:40:00Z', updatedAt: '2026-07-10T10:10:00Z' },
  { id: 't12', title: 'Prenotare il weekend a Venezia', description: 'Confrontare hotel e orari di treno.', status: 'todo', priority: 'medium', assigneeId: 'm2', folderId: 'f3', categoryId: 'c3', dueDate: '2026-07-24', tags: '[]', createdAt: '2026-07-10T08:00:00Z', updatedAt: '2026-07-10T08:00:00Z' },
  { id: 't13', title: 'Controllare accessibilità del portale', description: 'Verificare contrasto, navigazione e semantica delle pagine.', status: 'review', priority: 'high', assigneeId: 'm3', folderId: 'f1', categoryId: 'c1', dueDate: '2026-07-23', tags: '[]', createdAt: '2026-07-11T11:45:00Z', updatedAt: '2026-07-11T11:45:00Z' },
  { id: 't14', title: 'Rivedere il design system', description: 'Allineare componenti e regole visive per il nuovo sprint.', status: 'review', priority: 'high', assigneeId: 'm2', folderId: 'f1', categoryId: 'c1', dueDate: '2026-07-15', tags: '[]', createdAt: '2026-07-12T09:00:00Z', updatedAt: '2026-07-12T09:00:00Z' },
  { id: 't15', title: 'Scrivere note per la retrospettiva', description: 'Riassumere punti chiave, blocchi e suggerimenti.', status: 'todo', priority: 'medium', assigneeId: 'm4', folderId: 'f3', categoryId: 'c1', dueDate: '2026-07-16', tags: '[]', createdAt: '2026-07-12T11:30:00Z', updatedAt: '2026-07-12T11:30:00Z' },
  { id: 't16', title: 'Rispondere alle email dei clienti', description: 'Controllare richieste urgenti e preparare risposte.', status: 'in_progress', priority: 'high', assigneeId: 'm1', folderId: 'f2', categoryId: 'c1', dueDate: '2026-07-17', tags: '[]', createdAt: '2026-07-13T08:15:00Z', updatedAt: '2026-07-13T08:15:00Z' },
  { id: 't17', title: 'Portare il cane dal veterinario', description: 'Verificare prenotazione e preparare il kit necessario.', status: 'done', priority: 'low', assigneeId: 'm2', folderId: 'f1', categoryId: 'c3', dueDate: '2026-07-14', tags: '[]', createdAt: '2026-07-13T10:00:00Z', updatedAt: '2026-07-13T10:30:00Z' },
  { id: 't18', title: 'Aggiornare il README del progetto', description: 'Aggiungere istruzioni e screenshot della nuova release.', status: 'todo', priority: 'medium', assigneeId: 'm3', folderId: 'f2', categoryId: 'c1', dueDate: '2026-07-18', tags: '[]', createdAt: '2026-07-13T14:00:00Z', updatedAt: '2026-07-13T14:00:00Z' },
  { id: 't19', title: 'Preparare checklist per la demo', description: 'Organizzare gli step e i contenuti da mostrare.', status: 'review', priority: 'medium', assigneeId: 'm1', folderId: 'f3', categoryId: 'c1', dueDate: '2026-07-19', tags: '[]', createdAt: '2026-07-14T07:45:00Z', updatedAt: '2026-07-14T07:45:00Z' },
  { id: 't20', title: 'Pulire la mailbox di lavoro', description: 'Archiviare messaggi vecchi e rispondere agli urgenti.', status: 'in_progress', priority: 'low', assigneeId: 'm4', folderId: 'f2', categoryId: 'c1', dueDate: '2026-07-20', tags: '[]', createdAt: '2026-07-14T09:15:00Z', updatedAt: '2026-07-14T09:15:00Z' },
];

function createSchema() {
  db.run('DROP TABLE IF EXISTS tasks');
  db.run('DROP TABLE IF EXISTS categories');
  db.run('DROP TABLE IF EXISTS folders');
  db.run('DROP TABLE IF EXISTS members');
  db.run('DROP TABLE IF EXISTS goals');

  db.run(`
    CREATE TABLE members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      color TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      assigneeId TEXT,
      folderId TEXT,
      categoryId TEXT,
      dueDate TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      "order" INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (assigneeId) REFERENCES members(id) ON DELETE SET NULL,
      FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE SET NULL,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE goals (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('daily', 'weekly')),
      target INTEGER NOT NULL CHECK(target > 0),
      createdAt TEXT NOT NULL
    )
  `);
}

function seedDatabase(callback) {
  const stmtM = db.prepare('INSERT INTO members (id, name, email, role, color) VALUES (?, ?, ?, ?, ?)');
  initialMembers.forEach((m) => stmtM.run(m.id, m.name, m.email, m.role, m.color));
  stmtM.finalize();

  const stmtF = db.prepare('INSERT INTO folders (id, name, color) VALUES (?, ?, ?)');
  initialFolders.forEach((f) => stmtF.run(f.id, f.name, f.color));
  stmtF.finalize();

  const stmtC = db.prepare('INSERT INTO categories (id, name, color) VALUES (?, ?, ?)');
  initialCategories.forEach((c) => stmtC.run(c.id, c.name, c.color));
  stmtC.finalize();

  const stmtT = db.prepare('INSERT INTO tasks (id, title, description, status, priority, assigneeId, folderId, categoryId, dueDate, tags, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  initialTasks.forEach((t) => {
    stmtT.run(t.id, t.title, t.description, t.status, t.priority, t.assigneeId, t.folderId, t.categoryId ?? null, t.dueDate, t.tags, t.createdAt, t.updatedAt);
  });
  stmtT.finalize();

  if (callback) callback();
}

export function initDb() {
  db.serialize(() => {
    createSchema();
    seedDatabase(() => {
      console.log('Seed database completato.');
    });
  });
}

export function resetDb(callback) {
  db.serialize(() => {
    createSchema();
    seedDatabase(callback);
  });
}

export default db;
