import sqlite3 from "sqlite3";
import { open } from "sqlite";

sqlite3.verbose();

export async function connectDatabase() {
    return open({
        filename: "./database.db",
        driver: sqlite3.Database,
    });
}