import { serve } from "@hono/node-server";
import { loadEnv } from "@8budev/core";

import { app } from "./app";
import { log } from "./lib/logger";

const env = loadEnv();
serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  log.info({ port: info.port }, "portf-api listening");
});
