import "server-only";
import bcrypt from "bcryptjs";
import { DEMO, buildSeed } from "@/data/seed";
import { MemoryRepository } from "./memory";
import type { Repository } from "./types";

export type { Repository } from "./types";

// Survive Next.js dev hot reloads so check-ins aren't lost on every file save.
const g = globalThis as typeof globalThis & { __fairshiftRepo?: Repository };

export function createMemoryRepository(now = new Date()): MemoryRepository {
  const pinHash = bcrypt.hashSync(DEMO.pin, 10);
  const adminHash = bcrypt.hashSync(DEMO.adminPassword, 10);
  return new MemoryRepository(buildSeed(now, pinHash, adminHash));
}

export function getRepo(): Repository {
  g.__fairshiftRepo ??= createMemoryRepository();
  return g.__fairshiftRepo;
}
