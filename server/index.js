import express from 'express';
import cors from 'cors';
import { initDb, resetDb } from './config/db.js';
import { getMembers, createMember, updateMember, deleteMember } from './controllers/membersController.js';
import { getFolders, createFolder, updateFolder, deleteFolder } from './controllers/foldersController.js';
import { getTasks, createTask, updateTask, deleteTask } from './controllers/tasksController.js';

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

app.listen(PORT, () => {
  console.log(`Server Express (strutturato) in esecuzione sulla porta ${PORT}`);
});
