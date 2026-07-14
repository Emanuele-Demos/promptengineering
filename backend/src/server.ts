import app from "./app";
import { initializeDatabase } from "./config/initDatabase";
import { startReminderScheduler } from "./services/reminderScheduler";

const PORT = 3001;

async function startServer() {
    try {
        await initializeDatabase();
        startReminderScheduler();

        app.listen(PORT, () => {
            console.log(`🚀 Server avviato sulla porta ${PORT}`);
        });
    } catch (err) {
        console.error(err);
    }
}

startServer();