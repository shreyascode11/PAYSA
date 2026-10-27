import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  await clearSessionCookie();
  // 303 so a plain <form method="post"> logout works without JavaScript.
  return NextResponse.redirect(new URL("/", req.url), 303);
}
