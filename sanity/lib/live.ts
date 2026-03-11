// Live content API requires next-sanity v10+; using client fetch for compatibility with next-sanity v9.
// To enable live preview, upgrade next-sanity and use defineLive from "next-sanity/live".
import { client } from "./client";

export async function sanityFetch<T>(query: string, params?: Record<string, unknown>): Promise<T> {
  return params ? client.fetch<T>(query, params as Record<string, string>) : client.fetch<T>(query);
}

export function SanityLive(_props: Record<string, unknown>): null {
  return null;
}
