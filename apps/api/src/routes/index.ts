// path: apps/api/src/routes/index.ts

import { Router } from "express";
import { analyticsRouter } from "./analytics";
import { dataRouter } from "./data";
import { examsRouter } from "./exams";
import { healthRouter } from "./health";
import { importRouter } from "./import";
import { importExamsRouter } from "./importExams";
import syncRouter from "./sync";
import { usersRouter } from "./users";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/import", importRouter);
apiRouter.use("/import/exams", importExamsRouter);
apiRouter.use("/exams", examsRouter);
apiRouter.use("/data", dataRouter);
apiRouter.use("/analytics", analyticsRouter);
apiRouter.use("/sync", syncRouter);