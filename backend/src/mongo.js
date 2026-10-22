import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/humedales";

let client;
let db;

export async function connectMongo() {
  if (db) return db;
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db();

  // Índices para el feed comunitario, posts, pines, likes (1 por usuario), comentarios y alertas
  await Promise.all([
    db.collection("feed_posts").createIndex({ status: 1, createdAt: -1 }),
    db.collection("feed_posts").createIndex({ type: 1, status: 1, createdAt: -1 }),
    db.collection("feed_posts").createIndex({ authorId: 1 }),
    db.collection("likes").createIndex(
      { userId: 1, targetType: 1, targetId: 1 },
      { unique: true }
    ),
    db.collection("likes").createIndex({ targetType: 1, targetId: 1 }),
    db.collection("comments").createIndex({ targetType: 1, targetId: 1, createdAt: 1 }),
    db.collection("saved_items").createIndex(
      { userId: 1, targetType: 1, targetId: 1 },
      { unique: true }
    ),
    db.collection("route_alerts").createIndex({ createdAt: -1 }),
  ]);

  console.log("MongoDB conectado e índices verificados");
  return db;
}

export function getMongoDb() {
  if (!db) {
    throw new Error("MongoDB aún no ha sido inicializado con connectMongo()");
  }
  return db;
}

export const feedPostsCol = () => getMongoDb().collection("feed_posts");
export const likesCol = () => getMongoDb().collection("likes");
export const commentsCol = () => getMongoDb().collection("comments");
export const savedItemsCol = () => getMongoDb().collection("saved_items");
export const routeAlertsCol = () => getMongoDb().collection("route_alerts");
