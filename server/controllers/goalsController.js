import { createGoal, deleteGoal, getCurrentGoalsForUser, getGoalHistoryForUser, getGoalsForUser, updateGoal } from '../services/goalsService.js';

const DEFAULT_USER_ID = 'demo-user';

function validateGoalPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { error: 'Payload non valido', status: 400 };
  }

  if (payload.target === undefined || Number(payload.target) <= 0) {
    return { error: 'Il target deve essere maggiore di 0', status: 400 };
  }

  if (payload.type !== 'daily' && payload.type !== 'weekly') {
    return { error: 'Tipo non valido', status: 400 };
  }

  return null;
}

export async function getGoals(req, res) {
  try {
    const goals = await getGoalsForUser(DEFAULT_USER_ID);
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getCurrentGoals(req, res) {
  try {
    const current = await getCurrentGoalsForUser(DEFAULT_USER_ID);
    res.json(current);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createGoalHandler(req, res) {
  const validation = validateGoalPayload(req.body);
  if (validation) return res.status(validation.status).json({ error: validation.error });

  try {
    const existingGoals = await getGoalsForUser(DEFAULT_USER_ID);
    const duplicate = existingGoals.some((goal) => goal.type === req.body.type);
    if (duplicate) {
      return res.status(409).json({ error: `Esiste già un obiettivo ${req.body.type === 'daily' ? 'giornaliero' : 'settimanale'} attivo` });
    }

    const created = await createGoal(DEFAULT_USER_ID, req.body);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateGoalHandler(req, res) {
  const validation = validateGoalPayload(req.body);
  if (validation) return res.status(validation.status).json({ error: validation.error });

  try {
    const updated = await updateGoal(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteGoalHandler(req, res) {
  try {
    const deleted = await deleteGoal(req.params.id);
    res.json(deleted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getGoalHistory(req, res) {
  try {
    const history = await getGoalHistoryForUser(DEFAULT_USER_ID);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
