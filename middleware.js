import { geolocation, next } from "@vercel/edge";

export const config = {
  matcher: "/",
};

export default function middleware(request) {
  const { country, countryRegion } = geolocation(request);
  const geo = `${country ?? ""}-${countryRegion ?? ""}`;

  const response = next();
  response.headers.append(
    "Set-Cookie",
    `geo=${encodeURIComponent(geo)}; Path=/; Max-Age=1800; SameSite=Lax`
  );
  return response;
}
