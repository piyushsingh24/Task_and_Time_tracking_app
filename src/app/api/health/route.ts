import { ok } from "@/lib/api-response";

export async function GET() {
  return ok({ ok: true, service: "taskflow", phase: 1 });
}
