// file: apps/api/src/main.ts

import "dotenv/config";
import { createApp } from "./app";

const app = createApp();

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`🚀 MYDTU API running at http://localhost:${PORT}`);
});

export { app };
