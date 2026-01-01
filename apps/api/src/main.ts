import cors from "cors";
import express from "express";
import helmet from "helmet";
import { ZodError } from "zod";
import { apiRouter } from "./routes";

const app = express();

/** Middlewares */
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

/** Root */
app.get("/", (_req, res) => {
  res.json({ service: "MYDTU Assistant API", status: "running" });
});

/** Routes */
app.use("/", apiRouter);

/** Error handler */
app.use((err: any, _req: any, res: any, _next: any) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: err.errors });
  }

  // Prisma unique constraints
  if (err?.code === "P2002") {
    return res.status(409).json({
      error: "DUPLICATE",
      message: "Unique constraint failed",
      meta: err?.meta,
    });
  }

  console.error(err);
  res.status(500).json({ error: "INTERNAL_ERROR" });
});

/** Start */
const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`🚀 MYDTU API running at http://localhost:${PORT}`);
});
