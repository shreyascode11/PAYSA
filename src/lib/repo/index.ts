import "server-only";
import bcrypt from "bcryptjs";
import { DEMO, buildSeed, type SeedData } from "@/data/seed";
import { FirestoreRepository } from "./firestore";
import { MemoryRepository } from "./memory";
import type { Repository } from "./types";

export type { Repository } from "./types";

// Survive Next.js dev hot reloads and per-route module copies so all requests share one store.
const g = globalThis as typeof globalThis & { __fairshiftRepo?: Repository };

function seedData(now = new Date()): SeedData {
  return buildSeed(now, bcrypt.hashSync(DEMO.pin, 10), bcrypt.hashSync(DEMO.adminPassword, 10));
}

export function createMemoryRepository(now = new Date()): MemoryRepository {
  return new MemoryRepository(seedData(now));
}

/** Firestore when FIRESTORE_PROJECT_ID is set; otherwise a zero-config in-memory demo store. */
export function getRepo(): Repository {
  const projectId = process.env.FIRESTORE_PROJECT_ID;
  g.__fairshiftRepo ??= projectId ? new FirestoreRepository(projectId, seedData) : createMemoryRepository();
  return g.__fairshiftRepo;
}
