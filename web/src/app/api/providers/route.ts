import { listProviders } from "@/lib/providers";

// Names + ids only (no keys) so the client can offer a picker when more than one
// provider is configured.
export async function GET() {
  return Response.json({ providers: listProviders() });
}
