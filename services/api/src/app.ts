import { Hono } from "hono";

import { chatRoute } from "./routes/chat";
import { healthRoute } from "./routes/health";
import { retrieveRoute } from "./routes/retrieve";
import { statsRoute } from "./routes/stats";

export const app = new Hono();

app.route("/chat", chatRoute);
app.route("/healthz", healthRoute);
app.route("/retrieve", retrieveRoute);
app.route("/stats", statsRoute);

app.notFound((c) => c.json({ error: "not found" }, 404));
