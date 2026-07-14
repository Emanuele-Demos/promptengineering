import express from 'express';
import cors from 'cors';
import { initDb, resetDb } from './config/db.js';
import { getMembers, createMember, updateMember, deleteMember } from './controllers/membersController.js';
import { getFolders, createFolder, updateFolder, deleteFolder } from './controllers/foldersController.js';
import { getTasks, createTask, updateTask, deleteTask } from './controllers/tasksController.js';
import { getCategories, createCategory, updateCategory, deleteCategory } from './controllers/categoriesController.js';
import { getNotifications, markAllNotificationsAsRead, deleteNotification, markNotificationAsRead } from './controllers/notificationsController.js';
import { createGoalHandler, deleteGoalHandler, getCurrentGoals, getGoalHistory, getGoals, updateGoalHandler } from './controllers/goalsController.js';
import { getStatistics } from './controllers/statisticsController.js';
import { processPendingReminders } from './services/notificationsService.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Inizializza il DB
initDb();

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

// Task
app.get('/api/tasks', getTasks);
app.post('/api/tasks', createTask);
app.put('/api/tasks/:id', updateTask);
app.delete('/api/tasks/:id', deleteTask);

// Categories
app.get('/api/categories', getCategories);
app.post('/api/categories', createCategory);
app.put('/api/categories/:id', updateCategory);
app.delete('/api/categories/:id', deleteCategory);

// Notifiche
app.get('/api/notifications', getNotifications);
app.put('/api/notifications/read-all', markAllNotificationsAsRead);
app.put('/api/notifications/:id/read', markNotificationAsRead);
app.delete('/api/notifications/:id', deleteNotification);

// Obiettivi
app.get('/api/goals', getGoals);
app.get('/api/goals/current', getCurrentGoals);
app.post('/api/goals', createGoalHandler);
app.put('/api/goals/:id', updateGoalHandler);
app.delete('/api/goals/:id', deleteGoalHandler);
app.get('/api/goals/history', getGoalHistory);

// Statistiche
app.get('/api/statistics', getStatistics);

setInterval(() => {
  processPendingReminders().catch((err) => {
    console.error('Errore nel scheduler delle notifiche:', err.message);
  });
}, 60000);

app.listen(PORT, () => {
  console.log(`Server Express (strutturato) in esecuzione sulla porta ${PORT}`);
});
