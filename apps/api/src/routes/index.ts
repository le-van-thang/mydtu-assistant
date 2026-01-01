import { Router } from "express";
import { analyticsRouter } from "./analytics";
import { dataRouter } from "./data";
import { healthRouter } from "./health";
import { importRouter } from "./import";
import { usersRouter } from "./users";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/import", importRouter);
apiRouter.use("/data", dataRouter);
apiRouter.use("/analytics", analyticsRouter);
