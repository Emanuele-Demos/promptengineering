import { Request, Response } from "express";

import * as userService from "../services/userService";

export async function getUsers(req: Request, res: Response) {

    const users = await userService.getAllUsers();

    res.json(users);

}

export async function getUser(req: Request, res: Response) {

    const user = await userService.getUserById(req.params.id as string);

    if (!user) {

        return res.status(404).json({
            message: "Utente non trovato"
        });

    }

    res.json(user);

}

export async function createUser(req: Request, res: Response) {

    const user = await userService.createUser(req.body);

    res.status(201).json(user);

}

export async function updateUser(req: Request, res: Response) {

    await userService.updateUser(req.params.id as string, req.body);

    res.json({
        message: "Utente aggiornato"
    });

}

export async function deleteUser(req: Request, res: Response) {

    await userService.deleteUser(req.params.id as string);

    res.json({
        message: "Utente eliminato"
    });

}