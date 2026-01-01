import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";

export const usersRouter = Router();

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
});

/** POST /users (upsert by email) */
usersRouter.post("/", async (req, res, next) => {
  try {
    const data = CreateUserSchema.parse(req.body);

    const user = await prisma.user.upsert({
      where: { email: data.email },
      create: { email: data.email, name: data.name },
      update: { name: data.name ?? undefined },
    });

    // nếu tạo mới thì 201, còn update thì 200
    res.status(200).json(user);
  } catch (e) {
    next(e);
  }
});

/** GET /users */
usersRouter.get("/", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    res.json(users);
  } catch (e) {
    next(e);
  }
});
