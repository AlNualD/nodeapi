import express from "express";
import * as dotenv from "dotenv";
import { connectToDatabase } from "./connectToDB"
import { gamesRouter } from "./controller/game-controller";
import { usersRouter } from "./controller/user-controller";

const app = express();

connectToDatabase()
    .then(() => {

        dotenv.config();

        const port = process.env.PORT;

        app.use("/users", usersRouter);
        app.use("/games", gamesRouter);

        app.listen(port, () => {
            console.log("Express started");
        });
    })
    .catch((error: Error) => {
        console.log("Database connection failed", error);
    });