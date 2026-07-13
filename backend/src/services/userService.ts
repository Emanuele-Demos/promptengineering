import { connectDatabase } from "../config/database";

export async function getAllUsers() {
    const db = await connectDatabase();

    return await db.all(`
        SELECT *
        FROM users
        ORDER BY username;
    `);
}

export async function getUserById(id: string) {
    const db = await connectDatabase();

    return await db.get(
        `
        SELECT *
        FROM users
        WHERE id = ?;
        `,
        [id]
    );
}

export async function createUser(user: any) {
    const db = await connectDatabase();

    await db.run(
        `
        INSERT INTO users
        (
            id,
            username,
            email,
            password,
            role,
            createdAt
        )
        VALUES (?, ?, ?, ?, ?, ?);
        `,
        [
            user.id,
            user.username,
            user.email,
            user.password,
            user.role,
            user.createdAt
        ]
    );

    return user;
}

export async function updateUser(id: string, user: any) {

    const db = await connectDatabase();

    await db.run(
        `
        UPDATE users
        SET
            username = ?,
            email = ?,
            password = ?,
            role = ?
        WHERE id = ?;
        `,
        [
            user.username,
            user.email,
            user.password,
            user.role,
            id
        ]
    );
}

export async function deleteUser(id: string) {

    const db = await connectDatabase();

    await db.run(
        `
        DELETE FROM users
        WHERE id = ?;
        `,
        [id]
    );
}
