import app from "./app";
import { initializeDatabase } from "./config/initDatabase";
import { startReminderScheduler } from "./services/reminderScheduler";
import { startGoalScheduler } from "./services/goalScheduler";

const PORT = 3001;

async function startServer() {
    try {
        await initializeDatabase();
        startReminderScheduler();
        startGoalScheduler();

        app.listen(PORT, () => {
            console.log(`🚀 Server avviato sulla porta ${PORT}`);
        });
    } catch (err) {
        console.error(err);
    }
}

startServer();