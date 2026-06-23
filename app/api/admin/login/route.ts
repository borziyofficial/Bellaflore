type AdminLoginRequest = {
  username?: unknown;
  password?: unknown;
};

function isExpectedCredential(value: unknown, expected: string): boolean {
  return typeof value === "string" && value === expected;
}

export async function POST(request: Request) {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    return Response.json(
      { message: "Admin credentials are not configured." },
      { status: 500 },
    );
  }

  let body: AdminLoginRequest;

  try {
    body = (await request.json()) as AdminLoginRequest;
  } catch {
    return Response.json(
      { message: "Invalid login request." },
      { status: 400 },
    );
  }

  if (
    !isExpectedCredential(body.username, adminUsername) ||
    !isExpectedCredential(body.password, adminPassword)
  ) {
    return Response.json(
      { message: "Invalid admin credentials." },
      { status: 401 },
    );
  }

  return Response.json({ authenticated: true });
}
