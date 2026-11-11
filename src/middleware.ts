import { NextResponse, type NextRequest } from "next/server";

export const config = { matcher: ["/admin/:path*", "/admin"] };

function unauthorized() {
  return new NextResponse("Acceso restringido", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Panel", charset="UTF-8"' },
  });
}

export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;
  // Sin credenciales configuradas el panel queda cerrado, nunca abierto.
  if (!user || !pass) return new NextResponse("Panel sin configurar: faltan ADMIN_USER y ADMIN_PASSWORD", { status: 503 });

  const header = req.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme !== "Basic" || !encoded) return unauthorized();
  let decoded = "";
  try {
    decoded = atob(encoded);
  } catch {
    return unauthorized();
  }
  const sep = decoded.indexOf(":");
  if (sep < 0 || decoded.slice(0, sep) !== user || decoded.slice(sep + 1) !== pass) return unauthorized();
  return NextResponse.next();
}
