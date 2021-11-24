import * as mongoDB from "mongodb";
import * as dotenv from "dotenv";

export const collections: { games?: mongoDB.Collection, users?: mongoDB.Collection, backup?: mongoDB.Collection } = {}

export async function connectToDatabase () {
    dotenv.config();
    const client: mongoDB.MongoClient = new mongoDB.MongoClient(process.env.URL);
    await client.connect();
    const db: mongoDB.Db = client.db(process.env.DBNAME);
    const gamesCollection: mongoDB.Collection = db.collection("games");
    collections.games = gamesCollection;
    const usersCollection: mongoDB.Collection = db.collection("users");
    collections.users = usersCollection;
    const backupCollection: mongoDB.Collection = db.collection("backup");
    collections.backup = backupCollection;
    console.log(`Successfully connected to database: ${db.databaseName}`);
}