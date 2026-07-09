import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');

// Assicuriamoci che la cartella data esista
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Dati iniziali di seed
const seedData = {
  members: [
    { id: 'm1', name: 'Marco Rossi', email: 'marco.rossi@team.it', role: 'Project Manager', color: '#6366f1' },
    { id: 'm2', name: 'Laura Bianchi', email: 'laura.bianchi@team.it', role: 'Developer', color: '#8b5cf6' },
    { id: 'm3', name: 'Giuseppe Verdi', email: 'giuseppe.verdi@team.it', role: 'Designer', color: '#ec4899' },
    { id: 'm4', name: 'Anna Neri', email: 'anna.neri@team.it', role: 'QA Engineer', color: '#14b8a6' }
  ],
  tasks: [
    { id: 't1', title: 'Definire roadmap Q3', description: 'Allineare obiettivi del team e priorità per il prossimo trimestre.', status: 'in_progress', priority: 'high', assigneeId: 'm1', dueDate: '2026-07-15T09:00', tags: ['planning'], createdAt: '2026-07-01T09:00:00Z', updatedAt: '2026-07-05T14:30:00Z' },
    { id: 't2', title: 'Implementare autenticazione', description: 'Login con email e OAuth, sessioni JWT e refresh token.', status: 'todo', priority: 'urgent', assigneeId: 'm2', dueDate: '2026-07-12T18:00', tags: ['backend', 'security'], createdAt: '2026-07-02T10:00:00Z', updatedAt: '2026-07-02T10:00:00Z' },
    { id: 't3', title: 'Redesign dashboard', description: 'Nuova UI con metriche, grafici e widget personalizzabili.', status: 'review', priority: 'medium', assigneeId: 'm3', dueDate: '2026-07-20T12:00', tags: ['design', 'ui'], createdAt: '2026-06-28T11:00:00Z', updatedAt: '2026-07-04T16:00:00Z' },
    { id: 't4', title: 'Test suite E2E', description: 'Coprire i flussi critici con Playwright.', status: 'todo', priority: 'medium', assigneeId: 'm4', dueDate: '2026-07-25T15:00', tags: ['testing'], createdAt: '2026-07-03T08:00:00Z', updatedAt: '2026-07-03T08:00:00Z' },
    { id: 't5', title: 'Documentazione API', description: 'OpenAPI spec e esempi per tutti gli endpoint pubblici.', status: 'done', priority: 'low', assigneeId: 'm2', dueDate: '2026-07-01T17:00', tags: ['docs'], createdAt: '2026-06-20T09:00:00Z', updatedAt: '2026-06-30T17:00:00Z' },
    { id: 't6', title: 'Setup CI/CD pipeline', description: 'GitHub Actions per build, test e deploy automatico.', status: 'in_progress', priority: 'high', assigneeId: 'm2', dueDate: '2026-07-10T10:00', tags: ['devops'], createdAt: '2026-07-04T12:00:00Z', updatedAt: '2026-07-05T09:00:00Z' }
  ]
};

// Inizializza db.json se non esiste
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2));
}

// Inizializza notifications.json se non esiste
if (!fs.existsSync(NOTIFICATIONS_FILE)) {
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify([], null, 2));
}

// Helper per leggere e scrivere i file JSON
function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function readNotifications() {
  return JSON.parse(fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8'));
}

function writeNotifications(data) {
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(data, null, 2));
}

const app = express();
app.use(cors());
app.use(express.json());

// Lista dei client SSE connessi
let sseClients = [];

// REST API per i Task
app.get('/api/tasks', (req, res) => {
  try {
    const data = readDB();
    res.json(data.tasks);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero dei task' });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const data = readDB();
    const now = new Date().toISOString();
    const newTask = {
      ...req.body,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      reminderSent: false
    };
    data.tasks.push(newTask);
    writeDB(data);
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: 'Errore nella creazione del task' });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const data = readDB();
    const index = data.tasks.findIndex(t => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Task non trovato' });
    }
    
    const oldTask = data.tasks[index];
    const updatedTask = {
      ...oldTask,
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    // Se la data del promemoria è cambiata, reimpostiamo il flag dell'invio a false
    if (req.body.reminderDate !== oldTask.reminderDate) {
      updatedTask.reminderSent = false;
    }
    
    data.tasks[index] = updatedTask;
    writeDB(data);
    
    // Rilevamento transizione: se il task è passato a 'done', generiamo una notifica di completamento
    if (oldTask.status !== 'done' && updatedTask.status === 'done') {
      const completionNotification = {
        id: crypto.randomUUID(),
        taskId: updatedTask.id,
        taskTitle: updatedTask.title,
        message: '✅ Task completato con successo!',
        type: 'completion',
        createdAt: new Date().toISOString(),
        read: false
      };
      const notifications = readNotifications();
      const updatedNotifications = [completionNotification, ...notifications].slice(0, 100);
      writeNotifications(updatedNotifications);
      broadcastNotification(completionNotification);
    }

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento del task' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const data = readDB();
    data.tasks = data.tasks.filter(t => t.id !== req.params.id);
    writeDB(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore nell\'eliminazione del task' });
  }
});

// REST API per i Membri del Team
app.get('/api/members', (req, res) => {
  try {
    const data = readDB();
    res.json(data.members);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero dei membri' });
  }
});

app.post('/api/members', (req, res) => {
  try {
    const data = readDB();
    const newMember = {
      ...req.body,
      id: crypto.randomUUID()
    };
    data.members.push(newMember);
    writeDB(data);
    res.status(201).json(newMember);
  } catch (err) {
    res.status(500).json({ error: 'Errore nella creazione del membro' });
  }
});

app.put('/api/members/:id', (req, res) => {
  try {
    const data = readDB();
    const index = data.members.findIndex(m => m.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Membro non trovato' });
    data.members[index] = { ...data.members[index], ...req.body };
    writeDB(data);
    res.json(data.members[index]);
  } catch (err) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento del membro' });
  }
});

app.delete('/api/members/:id', (req, res) => {
  try {
    const data = readDB();
    data.members = data.members.filter(m => m.id !== req.params.id);
    data.tasks = data.tasks.map(t => t.assigneeId === req.params.id ? { ...t, assigneeId: null } : t);
    writeDB(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore nell\'eliminazione del membro' });
  }
});

// REST API per le Notifiche
app.get('/api/notifications', (req, res) => {
  try {
    const notifications = readNotifications();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero delle notifiche' });
  }
});

app.post('/api/notifications/:id/read', (req, res) => {
  try {
    const notifications = readNotifications();
    const index = notifications.findIndex(n => n.id === req.params.id);
    if (index !== -1) {
      notifications[index].read = true;
      writeNotifications(notifications);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento dello stato lettura' });
  }
});

app.post('/api/notifications/read-all', (req, res) => {
  try {
    const notifications = readNotifications();
    notifications.forEach(n => n.read = true);
    writeNotifications(notifications);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento di tutte le notifiche' });
  }
});

app.post('/api/notifications/clear', (req, res) => {
  try {
    writeNotifications([]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore nello svuotamento delle notifiche' });
  }
});

// Server-Sent Events (SSE) Endpoint per lo streaming in tempo reale
app.get('/api/notifications/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  // Invia un heartbeat periodico per non far chiudere la connessione
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

function broadcastNotification(notification) {
  sseClients.forEach(c => {
    try {
      c.res.write(`data: ${JSON.stringify(notification)}\n\n`);
    } catch (err) {
      console.error('Errore invio SSE al client:', c.id);
    }
  });
}

// Funzione di controllo delle notifiche e dei promemoria
function checkReminders() {
  try {
    const data = readDB();
    const now = new Date();
    let tasksChanged = false;
    const newNotifications = [];

    data.tasks.forEach(task => {
      if (task.status !== 'done' && task.reminderDate && !task.reminderSent) {
        const reminderTime = new Date(task.reminderDate);
        if (now >= reminderTime) {
          let message = 'Promemoria task in scadenza!';
          if (task.dueDate) {
            const due = new Date(task.dueDate);
            const diffMs = due.getTime() - reminderTime.getTime();
            const diffMin = Math.round(diffMs / (60 * 1000));
            
            if (diffMin === 5) {
              message = `Scade tra 5 minuti!`;
            } else if (diffMin === 30) {
              message = `Scade tra 30 minuti!`;
            } else if (diffMin === 60) {
              message = `Scade tra 1 ora!`;
            } else if (diffMin === 24 * 60) {
              message = `Scade tra 1 giorno!`;
            } else {
              message = `Scadenza prevista per il ${new Date(task.dueDate).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`;
            }
          }

          // Prefisso urgente per task con priorità 'urgent'
          const isUrgent = task.priority === 'urgent';
          if (isUrgent) {
            message = `⚠️ TASK URGENTE IN SCADENZA — ${message}`;
          }

          const notification = {
            id: crypto.randomUUID(),
            taskId: task.id,
            taskTitle: task.title,
            message: message,
            type: isUrgent ? 'urgent' : 'reminder',
            createdAt: now.toISOString(),
            read: false
          };

          newNotifications.push(notification);
          task.reminderSent = true;
          tasksChanged = true;
        }
      }
    });

    if (tasksChanged) {
      writeDB(data);
      const notifications = readNotifications();
      const updatedNotifications = [...newNotifications, ...notifications].slice(0, 100);
      writeNotifications(updatedNotifications);
      
      // Trasmetti in tempo reale
      newNotifications.forEach(notif => {
        broadcastNotification(notif);
      });
    }
  } catch (error) {
    console.error('Errore nel controllo dei promemoria:', error);
  }
}

// Pianifica il controllo ogni 10 secondi per consentire test rapidi
cron.schedule('*/10 * * * * *', () => {
  checkReminders();
});

app.listen(PORT, () => {
  console.log(`Server Express avviato su http://localhost:${PORT}`);
  console.log(`Scheduler node-cron attivo ogni 10 secondi.`);
});
