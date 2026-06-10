import handler from "@tanstack/react-start/server-entry";

export const prerender = false;

export function ALL({ request }: any) {
  return handler.fetch(request);
}
