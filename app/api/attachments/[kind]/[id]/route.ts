import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSignedProofUrl, STORAGE_BUCKETS, type StorageBucket } from "@/lib/storage";

// Pages link to this route instead of embedding a signed URL, so rendering a
// list costs zero Supabase calls — a URL is only minted when an image is
// actually requested by a browser. Authorization lives here, in one place.

const SIGNED_URL_TTL_SECONDS = 3600;
const REDIRECT_CACHE_SECONDS = 300;

type Resolved = { bucket: StorageBucket; path: string } | null;

async function resolveChat(id: string): Promise<Resolved> {
  const message = await prisma.chatMessage.findUnique({ where: { id } });
  // Any signed-in member can see chat attachments — it's one shared room.
  if (!message?.attachmentPath || message.deletedAt) return null;
  return { bucket: STORAGE_BUCKETS.chatAttachments, path: message.attachmentPath };
}

async function resolvePayment(id: string, userId: string, isAdmin: boolean): Promise<Resolved> {
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) return null;
  if (!isAdmin && payment.userId !== userId) return null;
  return { bucket: STORAGE_BUCKETS.paymentProofs, path: payment.screenshotPath };
}

async function resolvePrize(id: string, userId: string, isAdmin: boolean): Promise<Resolved> {
  const prizePayment = await prisma.prizePayment.findUnique({
    where: { id },
    include: { gameWeekResult: { select: { userId: true } } },
  });
  if (!prizePayment?.proofPath) return null;
  if (!isAdmin && prizePayment.gameWeekResult.userId !== userId) return null;
  return { bucket: STORAGE_BUCKETS.prizePaymentProofs, path: prizePayment.proofPath };
}

async function resolveAvatar(userId: string): Promise<Resolved> {
  // `id` here is the target user's id, not the viewer's — profile pictures
  // are visible to any signed-in member, same as a name is.
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { profileImagePath: true } });
  if (!user?.profileImagePath) return null;
  return { bucket: STORAGE_BUCKETS.profileImages, path: user.profileImagePath };
}

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { kind, id } = await params;
  const isAdmin = session.user.role === "ADMIN";

  let resolved: Resolved = null;
  if (kind === "chat") resolved = await resolveChat(id);
  else if (kind === "payment") resolved = await resolvePayment(id, session.user.id, isAdmin);
  else if (kind === "prize") resolved = await resolvePrize(id, session.user.id, isAdmin);
  else if (kind === "avatar") resolved = await resolveAvatar(id);
  else return NextResponse.json({ error: "Unknown attachment type" }, { status: 400 });

  // Same response whether it's missing or forbidden, so this can't be used to
  // probe which records exist.
  if (!resolved) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let signedUrl: string;
  try {
    signedUrl = await getSignedProofUrl(resolved.bucket, resolved.path, SIGNED_URL_TTL_SECONDS);
  } catch {
    return NextResponse.json({ error: "Attachment unavailable" }, { status: 502 });
  }

  const response = NextResponse.redirect(signedUrl);
  // Short private cache so repeat views don't re-mint; always well under the
  // signed URL's own lifetime.
  response.headers.set("Cache-Control", `private, max-age=${REDIRECT_CACHE_SECONDS}`);
  return response;
}
