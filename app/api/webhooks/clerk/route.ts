import { headers } from "next/headers";
import { Webhook } from "svix";
import { getDb } from "@/db/client";
import { env } from "@/lib/env";
import { roleFromMetadata } from "@/lib/auth/roles";
import {
  deleteUserByClerkId,
  upsertUserFromClerk,
} from "@/lib/repositories/users";

export const runtime = "nodejs";

interface ClerkEmail {
  id: string;
  email_address: string;
}
interface ClerkUserData {
  id: string;
  email_addresses?: ClerkEmail[];
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  public_metadata?: Record<string, unknown>;
}
interface ClerkEvent {
  type: string;
  data: ClerkUserData;
}

function primaryEmail(data: ClerkUserData): string {
  const list = data.email_addresses ?? [];
  const primary = list.find((e) => e.id === data.primary_email_address_id);
  return primary?.email_address ?? list[0]?.email_address ?? "";
}

export async function POST(req: Request): Promise<Response> {
  const hdrs = await headers();
  const svixId = hdrs.get("svix-id");
  const svixTimestamp = hdrs.get("svix-timestamp");
  const svixSignature = hdrs.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  let event: ClerkEvent;
  try {
    const wh = new Webhook(env.clerkWebhookSecret);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const db = getDb();
  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const role = roleFromMetadata(event.data.public_metadata);
      const name =
        [event.data.first_name, event.data.last_name]
          .filter(Boolean)
          .join(" ") || null;
      await upsertUserFromClerk(db, {
        clerkId: event.data.id,
        email: primaryEmail(event.data),
        name,
        ...(role ? { role } : {}),
      });
      break;
    }
    case "user.deleted": {
      if (event.data.id) await deleteUserByClerkId(db, event.data.id);
      break;
    }
    default:
      break;
  }

  return new Response("ok", { status: 200 });
}
