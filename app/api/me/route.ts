import { getCurrentDbUser } from "@/lib/auth/current-user";
import { errorResponse, jsonResponse, withErrorHandling } from "@/lib/http";

export const runtime = "nodejs";

export const GET = withErrorHandling(async () => {
  const user = await getCurrentDbUser();
  if (!user) return errorResponse("unauthorized", "Not signed in.");
  return jsonResponse({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
});
