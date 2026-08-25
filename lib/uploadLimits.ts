// Shared between client (instant validation on file select) and server
// (lib/storage.ts, the actual enforcement). Vercel's Serverless Functions cap
// request bodies at 4.5MB regardless of Next.js config, so this has to stay
// comfortably under that once multipart/form-data overhead is added — see
// next.config.ts's matching serverActions.bodySizeLimit.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_UPLOAD_MB = 4;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
