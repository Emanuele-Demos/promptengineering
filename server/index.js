import express from 'express';
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { initDb, resetDb } from './config/db.js';
import { getMembers, createMember, updateMember, deleteMember } from './controllers/membersController.js';
import { getFolders, createFolder, updateFolder, deleteFolder } from './controllers/foldersController.js';
import { getCategories, createCategory, updateCategory, deleteCategory } from './controllers/categoriesController.js';
import { getTasks, createTask, updateTask, deleteTask } from './controllers/tasksController.js';
import { getNotifications, markNotificationRead, deleteNotification } from './controllers/notificationsController.js';
import { getStatistics } from './controllers/statisticsController.js';
import { deleteAttachment, getTaskAttachments, uploadAttachmentsMiddleware, uploadTaskAttachments } from './controllers/attachmentsController.js';
import { startReminderScheduler } from './scheduler/reminderScheduler.js';
import { startRecurringTaskScheduler } from './scheduler/recurringTaskScheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Inizializza il DB
initDb();
startReminderScheduler();
startRecurringTaskScheduler();

// Endpoint di Reset
app.post('/api/reset', (req, res) => {
  resetDb(() => {
    res.json({ message: 'Database ripristinato con successo' });
  });
});

// Membri
app.get('/api/members', getMembers);
app.post('/api/members', createMember);
app.put('/api/members/:id', updateMember);
app.delete('/api/members/:id', deleteMember);

// Cartelle
app.get('/api/folders', getFolders);
app.post('/api/folders', createFolder);
app.put('/api/folders/:id', updateFolder);
app.delete('/api/folders/:id', deleteFolder);

// Categorie
app.get('/api/categories', getCategories);
app.post('/api/categories', createCategory);
app.put('/api/categories/:id', updateCategory);
app.delete('/api/categories/:id', deleteCategory);
app.get('/categories', getCategories);
app.post('/categories', createCategory);
app.put('/categories/:id', updateCategory);
app.delete('/categories/:id', deleteCategory);

// Task
app.get('/api/tasks', getTasks);
app.post('/api/tasks', createTask);
app.put('/api/tasks/:id', updateTask);
app.delete('/api/tasks/:id', deleteTask);

// Allegati
app.get('/api/tasks/:taskId/attachments', getTaskAttachments);
app.post('/api/tasks/:taskId/attachments', (req, res) => {
  uploadAttachmentsMiddleware(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    uploadTaskAttachments(req, res);
  });
});
app.delete('/api/attachments/:id', deleteAttachment);
app.get('/tasks/:taskId/attachments', getTaskAttachments);
app.post('/tasks/:taskId/attachments', (req, res) => {
  uploadAttachmentsMiddleware(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    uploadTaskAttachments(req, res);
  });
});
app.delete('/attachments/:id', deleteAttachment);

// Notifiche
app.get('/api/notifications', getNotifications);
app.put('/api/notifications/:id/read', markNotificationRead);
app.delete('/api/notifications/:id', deleteNotification);
app.get('/notifications', getNotifications);
app.put('/notifications/:id/read', markNotificationRead);
app.delete('/notifications/:id', deleteNotification);

// Statistiche
app.get('/api/statistics', getStatistics);
app.get('/statistics', getStatistics);

app.listen(PORT, () => {
  console.log(`Server Express (strutturato) in esecuzione sulla porta ${PORT}`);
});
