import express, { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../connectToDB";
import Game from "../model/game";
import User from "../model/user";
import bodyParser from "body-parser";

export const usersRouter = express.Router();

usersRouter.use(express.json());

usersRouter.post("/", async (req: Request, res: Response) => {
    try {
        const newUserTmp = req.body as { username: string };
        const  newUser = new User(newUserTmp.username,[]);
        const result = await collections.users?.insertOne(newUser);
        result
            ? res.status(201).send({"inserted id": result.insertedId})
            : res.status(500).send("Failed");
    } catch (error) {
        console.error(error);
        res.status(400).send((error as Error).message);
    }
});

usersRouter.get("/", async (req: Request, res: Response) => {
    try {
        const users = (await collections.users?.find({}).toArray()) as unknown as User[];
        res.status(200).send(users);
    } catch (error: unknown) {
        res.status(500).send((error as Error).message);
    }
});

usersRouter.get("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;
    try {
        const query = { _id: new ObjectId(id) };
        const user = (await collections.users?.findOne(query)) as unknown as User;

        if (user) {
            res.status(200).send(user);
        }
    } catch (error) {
        res.status(404).send(`No such id`);
    }
});



usersRouter.put("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;

    try {
        const updatedUser: User = req.body as User;
        const query = { _id: new ObjectId(id) };

        const result = await collections.users?.updateOne(query, { $set: updatedUser });

        if(result) {
            res.status(200).send(`Updated`);
        } else {
            res.status(304).send(`Smth goes wrong`);
        }
    } catch (error: unknown) {
        res.status(400).send((error as Error).message);
    }
});

usersRouter.delete("/:id", async (req: Request, res: Response) => {
    const id = req?.params?.id;

    try {
        const query = { _id: new ObjectId(id) };
        const result = await collections.users?.deleteOne(query);

        if (result && result.deletedCount) {
            res.status(202).send(`Deleted`);
        } else {
            res.status(400).send('Smth goes wrong')
        }
    } catch (error: unknown) {
        res.status(400).send((error as Error).message);
    }
});

usersRouter.get("/:id/games", async (req: Request, res: Response) => {
    const id = req?.params?.id;
    try {
        const query = { _id: new ObjectId(id) };
        const user = (await collections.users?.findOne(query)) as unknown as User;
        const games: Game[] = [];
        const userGamesList: {game: Game, playTime: number}[] = [];
        if (user) {
            for (let i = 0; i < user.games.length; i++){
                const game = (await collections.games?.findOne({ _id: new ObjectId(user.games[i].game) })) as unknown as Game;
                games.push(game);
            }
            for (let i = 0; i < user.games.length; i++){
                userGamesList.push({game: games[i], playTime: user.games[i].playTime ?? 0});
            }
            res.status(200).send({ games: userGamesList });
        }
    } catch (error) {
        res.status(404).send(`No such id`);
    }
});

usersRouter.post("/:id/games", async (req: Request, res: Response) => {
    const userId = req?.params?.id;
    try {
        const gameId = req.body.id;
        const playtime = await recover(userId, gameId);
        const query = { _id: new ObjectId(userId) };
        const game = (await collections.games?.findOne({ _id: new ObjectId(gameId) })) as unknown as Game;


        if (game) {
            const result = await collections.users?.updateOne(query, { $push: { "games": { "game" : gameId, "playTime": playtime }}});
            if(result) {
                res.status(201).send({})
            } else {
                res.status(500).send("Smth goes wrong");
            }
        }
        else{
            res.status(500).send(`No such game`);
        }
    } catch (error) {
        console.error(error);
        res.status(400).send((error as Error).message);
    }
});

usersRouter.post("/:id/games/:gameid", async (req: Request, res: Response) => {
    const userId = req?.params?.id;
    try {
        const gameId = req?.params?.gameid;
        const playtime = req.body.playTime;
        const result = await collections.users?.updateOne({_id: new ObjectId(userId), 'games': { $elemMatch: { game: gameId}}}, {$set: { "games.$.playTime" : playtime}});
        if(result) {
            res.status(201).send({});
        } else {
            res.status(500).send("Smth goes wrong");
        }
    } catch (error) {
        console.error(error);
        res.status(400).send((error as Error).message);
    }
});

usersRouter.delete("/:id/games/:gameid", async (req: Request, res: Response) => {
    const userId = req?.params?.id;
    try {
        const gameId = req?.params?.gameid;
        const gameItem = await collections.users?.findOne({_id: new ObjectId(userId), 'games': { $elemMatch: { game: gameId}}}) as unknown as {game: string, playTime: number};
        if (gameItem){
            const res = addToRecover(userId, gameId, gameItem.playTime);
            if(!res) {
                console.log("smth wrong with recover db")
            }
        }
        const result = await collections.users?.updateOne({_id: new ObjectId(userId)} , { $pull : {'games': { game: gameId}}});
        if(result) {
            res.status(201).send("deleted");
        } else {
            res.status(500).send("smth goes wrong");
        }
    } catch (error) {
        console.error(error);
        res.status(400).send((error as Error).message);
    }
});

const addToRecover = (async (userId: string, gameId: string, playtime: number) => {
    const result = await collections.backup?.insertOne({userId: userId, gameId: gameId, playTime: playtime});
    return result;
})

const recover = (async (userId: string, gameId: string) => {
    let result = 0;
    const backupRecord = await collections.backup?.findOne({userId: userId, gameId: gameId}) as unknown as {userId: string, gameId: string, playtime: number};
    if (backupRecord){
        result = backupRecord.playtime;
    }
    return result;
})