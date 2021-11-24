import express, { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../connectToDB";
import Game from "../model/game";

export const gamesRouter = express.Router();

gamesRouter.use(express.json());

gamesRouter.get("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;
    try {
        const query = { _id: new ObjectId(id) };
        const curGame = (await collections.games?.findOne(query)) as unknown as Game;
        if (curGame) {
            res.status(200).send(curGame);
        }
    } catch (error) {
        res.status(404).send(`Can not find id: ${req.params.id}`);
    }
});


gamesRouter.get("/", async (req: Request, res: Response) => {
    try {
        const gamesList = (await collections.games?.find({}).toArray()) as unknown as Game[];
        if(gamesList == []) {
            res.status(404).send("Its empty here");
        } else {
            res.status(200).send(gamesList);
        }
    } catch (error: unknown) {
        res.status(500).send((error as Error).message);
    }
});



gamesRouter.post("/", async (req: Request, res: Response) => {
    try {
        const newGame = req.body as Game;
        const result = await collections.games?.insertOne(newGame);
        if(result) {
            res.status(201).send({"Created id": result.insertedId})
        } else {
            res.status(500).send("Something goes wrong");
        }
    } catch (error) {
        console.error(error);
        res.status(400).send((error as Error).message);
    }
});

gamesRouter.put("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;

    try {
        const curGame: Game = req.body as Game;
        const query = { _id: new ObjectId(id) };

        const result = await collections.games?.updateOne(query, { $set: curGame });

        if(result) {
            res.status(200).send(`Update id ${id}`);
        } else {
            res.status(304).send(`Something goes wrong`);
        }
    } catch (error: unknown) {
        res.status(400).send((error as Error).message);
    }
});

gamesRouter.delete("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;

    try {
        const query = { _id: new ObjectId(id) };
        const result = await collections.games?.deleteOne(query);

        if (result && result.deletedCount) {
            res.status(202).send(` ${id}  was deleted`);
        } else {
                res.status(400).send(`Something goes wrong`);
        }
    } catch (error: unknown) {
        res.status(400).send((error as Error).message);
    }
});