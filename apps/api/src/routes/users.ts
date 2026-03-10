// path: apps/api/src/routes/users.ts
import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";

export const usersRouter = Router();

const CreateOrUpsertUserSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).optional(),
  password: z.string().min(6),
  birthDate: z.coerce.date(),
  schoolType: z.enum(["university", "college", "highschool", "other"]).optional(),
  placeOfBirth: z.string().trim().min(1).optional(),
});

/** POST /users (upsert by email) */
usersRouter.post("/", async (req, res, next) => {
  try {
    const data = CreateOrUpsertUserSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.upsert({
      where: { email: data.email },
      create: {
        email: data.email,
        name: data.name ?? null,
        password: hashedPassword,
        birthDate: data.birthDate,
        schoolType: data.schoolType ?? "university",
        placeOfBirth: data.placeOfBirth ?? null,
      },
      update: {
        name: data.name ?? undefined,
        password: hashedPassword,
        birthDate: data.birthDate,
        schoolType: data.schoolType ?? undefined,
        placeOfBirth: data.placeOfBirth ?? undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolType: true,
        birthDate: true,
        placeOfBirth: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json(user);
  } catch (e) {
    next(e);
  }
});

/** GET /users */
usersRouter.get("/", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolType: true,
        birthDate: true,
        placeOfBirth: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(users);
  } catch (e) {
    next(e);
  }
});