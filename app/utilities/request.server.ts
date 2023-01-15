import { json } from "@remix-run/node";

export function badRequest<T>(data: T) {
  return json<T>(data, { status: 400, statusText: "Bad Request" });
}