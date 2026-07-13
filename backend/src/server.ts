import app from "./app";
import { initializeDatabase } from "./config/initDatabase";

const PORT = 3001;

async function startServer() {
    try {
        await initializeDatabase();

        app.listen(PORT, () => {
            console.log(`🚀 Server avviato sulla porta ${PORT}`);
        });
    } catch (err) {
        console.error(err);
    }
}

startServer();