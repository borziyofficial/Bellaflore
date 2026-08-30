import { ADMIN_SESSION_COOKIE } from "@/lib/adminApiAuth";

export const dynamic = "force-dynamic";

export async function POST() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return Response.json(
    { authenticated: false },
    {
      headers: {
        "Set-Cookie": `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
      },
    },
  );
}
