import express from "express";
import "dotenv/config";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";

const PORT = process.env.PORT || 8081;
const app = express();

app.all('/api/auth/{*any}', toNodeHandler(auth));
// Mount express json middleware after Better Auth handler
// or only apply it to routes that don't interact with Better Auth
app.use(express.json());


app.get("/", (_req, res) => {
    res.send("Hello, World!");
});

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})