// path: apps/api/src/routes/index.ts
import { Router } from "express";
import { analyticsRouter } from "./analytics";
import { chatRouter } from "./chat";
import { dataRouter } from "./data";
import { examsRouter } from "./exams";
import { healthRouter } from "./health";
import { importRouter } from "./import";
import { importExamsRouter } from "./importExams";
import syncRouter from "./sync";
import { transcriptRouter } from "./transcript";
import { transcriptDetailRouter } from "./transcriptDetail";
import { syncTranscriptDetailRouter } from "./syncTranscriptDetail";
import { usersRouter } from "./users";
import { recommendationRouter } from "./recommendation";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/import", importRouter);
apiRouter.use("/import/exams", importExamsRouter);
apiRouter.use("/exams", examsRouter);
apiRouter.use("/data", dataRouter);
apiRouter.use("/analytics", analyticsRouter);
apiRouter.use("/chat", chatRouter);
apiRouter.use("/recommendation", recommendationRouter);

apiRouter.use("/sync", syncRouter);
apiRouter.use("/sync/transcript-detail", syncTranscriptDetailRouter);

apiRouter.use("/transcript", transcriptRouter);
apiRouter.use("/transcript/detail", transcriptDetailRouter);