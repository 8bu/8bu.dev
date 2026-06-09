import { Hono } from "hono";

import { chatRoute } from "./routes/chat";
import { healthRoute } from "./routes/health";

export const app = new Hono();

app.route("/chat", chatRoute);
app.route("/healthz", healthRoute);

app.notFound((c) => c.json({ error: "not found" }, 404));
