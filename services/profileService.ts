import { prisma } from "@/lib/prisma";
import { buildProofPath, uploadProofImage, STORAGE_BUCKETS } from "@/lib/storage";

export async function updateProfilePicture(userId: string, image: File) {
  const path = buildProofPath("avatar", userId, image.name);
  await uploadProofImage(STORAGE_BUCKETS.profileImages, path, image);
  return prisma.user.update({ where: { id: userId }, data: { profileImagePath: path } });
}
