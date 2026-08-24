import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role client: server-only, never imported into client components.
// Buckets are private — proofs are only ever reached through a signed URL
// issued to the owner or an admin. Built lazily (not at module load) so
// routes that don't touch storage still work before Supabase credentials
// are configured, and so a build doesn't fail collecting page data.
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
  }
  return supabaseAdmin;
}

export const STORAGE_BUCKETS = {
  paymentProofs: "payment-proofs",
  prizePaymentProofs: "prize-payment-proofs",
  chatAttachments: "chat-attachments",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function buildProofPath(gameWeekId: string, userId: string, filename: string): string {
  const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return `${gameWeekId}/${userId}/${Date.now()}-${safeName}`;
}

export async function uploadProofImage(bucket: StorageBucket, path: string, file: File): Promise<void> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Only PNG, JPEG, or WEBP screenshots are accepted.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large (max 5MB).");
  }
  const { error } = await getSupabaseAdmin().storage.from(bucket).upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) throw new Error(`Failed to upload file: ${error.message}`);
}

export async function getSignedProofUrl(
  bucket: StorageBucket,
  path: string,
  expiresInSeconds = 300,
): Promise<string> {
  const { data, error } = await getSupabaseAdmin().storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error || !data) throw new Error(`Failed to create signed URL: ${error?.message ?? "unknown error"}`);
  return data.signedUrl;
}
