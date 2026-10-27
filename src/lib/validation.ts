import { z } from "zod";
import { REPORT_STATUSES } from "./types";

const lang = z.enum(["en", "ta", "hi"]);
const lat = z.number().min(-90).max(90);
const lng = z.number().min(-180).max(180);
const id = z.string().min(1).max(64).regex(/^[\w-]+$/);
const dayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const workerLoginSchema = z.object({
  phone: z.string().trim().regex(/^\d{10}$/),
  pin: z.string().regex(/^\d{4}$/),
});

export const adminLoginSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(200),
});

export const checkInSchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("qr"), siteId: id, qrToken: z.string().min(4).max(64) }),
  z.object({ method: z.literal("geo"), lat, lng }),
]);

export const checkOutSchema = z.object({ lat: lat.optional(), lng: lng.optional() });

export const MAX_REPORT_TEXT = 2000;
export const MAX_PHOTO_BYTES = 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const reportSchema = z.object({
  type: z.enum(["hazard", "grievance", "manager_feedback"]),
  category: z.string().min(1).max(40).regex(/^[a-z_]+$/),
  text: z.string().trim().min(1).max(MAX_REPORT_TEXT),
  /** English transcript from /api/voice/transcribe, so the server needn't translate twice. */
  textEn: z.string().trim().max(MAX_REPORT_TEXT * 2).optional(),
  lang,
  anonymous: z.boolean(),
  siteId: id.optional(),
});

export const messageSchema = z.object({ text: z.string().trim().min(1).max(1000) });

export const pulseSchema = z.object({ score: z.number().int().min(1).max(5) });

export const reportUpdateSchema = z.object({
  status: z.enum(REPORT_STATUSES as [string, ...string[]]),
  note: z.string().trim().max(500).default(""),
  severity: z.number().int().min(1).max(4).optional(),
  category: z.string().min(1).max(40).regex(/^[a-z_]+$/).optional(),
});

export const endorseSchema = z.object({ workerId: id, skill: z.string().min(1).max(40).regex(/^[a-z_]+$/) });

export const fatigueActionSchema = z.object({
  workerId: id,
  date: dayKey,
  action: z.enum(["rest_given", "shift_swapped", "hours_reduced", "talked"]),
});

export const announcementSchema = z.object({ orgId: id, text: z.string().trim().min(1).max(280), lang });

export const MAX_AUDIO_BYTES = 2 * 1024 * 1024;
export const AUDIO_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"] as const;

export const periodSchema = dayKey;
export const orgIdSchema = id;
