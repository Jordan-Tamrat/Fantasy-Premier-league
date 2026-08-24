-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "GameWeekStatus" AS ENUM ('DRAFT', 'OPEN', 'PAYMENT_CLOSED', 'LOCKED', 'LIVE', 'RESULTS_PENDING', 'PRIZES_PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('TELEBIRR', 'CBE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PrizePaymentStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "SnapshotSource" AS ENUM ('API', 'MANUAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "telebirrNumber" TEXT,
    "cbeAccountNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "invitedByUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FPLAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fplEntryId" INTEGER NOT NULL,
    "fplManagerName" TEXT,
    "fplTeamName" TEXT,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "FPLAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "leagueName" TEXT NOT NULL DEFAULT 'Fantasy Money League',
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "defaultEntryFee" DECIMAL(10,2) NOT NULL,
    "defaultPaymentDeadlineOffsetHours" INTEGER NOT NULL DEFAULT 2,
    "defaultMinParticipants" INTEGER NOT NULL DEFAULT 3,
    "leagueTelebirrNumber" TEXT,
    "leagueCbeAccountNumber" TEXT,
    "leagueAccountName" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeagueSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameWeek" (
    "id" TEXT NOT NULL,
    "fplEventId" INTEGER NOT NULL,
    "status" "GameWeekStatus" NOT NULL DEFAULT 'DRAFT',
    "entryFee" DECIMAL(10,2) NOT NULL,
    "minParticipants" INTEGER NOT NULL,
    "paymentDeadlineOffsetHours" INTEGER NOT NULL,
    "fplDeadline" TIMESTAMP(3) NOT NULL,
    "paymentDeadline" TIMESTAMP(3) NOT NULL,
    "announcement" TEXT,
    "lockedAt" TIMESTAMP(3),
    "prizeConfigFrozenAt" TIMESTAMP(3),
    "collectedAmountSnapshot" DECIMAL(10,2),
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrizePosition" (
    "id" TEXT NOT NULL,
    "gameWeekId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "PrizePosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "gameWeekId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "screenshotPath" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "verifiedByUserId" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameWeekParticipant" (
    "id" TEXT NOT NULL,
    "gameWeekId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "entryFeePaidSnapshot" DECIMAL(10,2) NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameWeekParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FPLGameWeekSnapshot" (
    "id" TEXT NOT NULL,
    "gameWeekId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fplEntryId" INTEGER NOT NULL,
    "points" INTEGER,
    "source" "SnapshotSource" NOT NULL DEFAULT 'API',
    "correctionReason" TEXT,
    "rawPayload" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FPLGameWeekSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameWeekResult" (
    "id" TEXT NOT NULL,
    "gameWeekId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "tieGroupSize" INTEGER NOT NULL,
    "prizePositionsConsumed" INTEGER[],
    "prizeAwarded" DECIMAL(10,2) NOT NULL,
    "roundingAdjustment" DECIMAL(10,2) NOT NULL,
    "finalizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameWeekResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrizePayment" (
    "id" TEXT NOT NULL,
    "gameWeekResultId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PrizePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "PaymentMethod",
    "paidAt" TIMESTAMP(3),
    "paidByUserId" TEXT,
    "proofPath" TEXT,
    "referenceNumber" TEXT,
    "notes" TEXT,

    CONSTRAINT "PrizePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorLabel" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_email_idx" ON "Invite"("email");

-- CreateIndex
CREATE INDEX "Invite_status_idx" ON "Invite"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FPLAccount_userId_key" ON "FPLAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FPLAccount_fplEntryId_key" ON "FPLAccount"("fplEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "GameWeek_fplEventId_key" ON "GameWeek"("fplEventId");

-- CreateIndex
CREATE INDEX "GameWeek_status_idx" ON "GameWeek"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PrizePosition_gameWeekId_position_key" ON "PrizePosition"("gameWeekId", "position");

-- CreateIndex
CREATE INDEX "Payment_gameWeekId_status_idx" ON "Payment"("gameWeekId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gameWeekId_userId_key" ON "Payment"("gameWeekId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "GameWeekParticipant_gameWeekId_userId_key" ON "GameWeekParticipant"("gameWeekId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "FPLGameWeekSnapshot_gameWeekId_userId_key" ON "FPLGameWeekSnapshot"("gameWeekId", "userId");

-- CreateIndex
CREATE INDEX "GameWeekResult_gameWeekId_rank_idx" ON "GameWeekResult"("gameWeekId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "GameWeekResult_gameWeekId_userId_key" ON "GameWeekResult"("gameWeekId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PrizePayment_gameWeekResultId_key" ON "PrizePayment"("gameWeekResultId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FPLAccount" ADD CONSTRAINT "FPLAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrizePosition" ADD CONSTRAINT "PrizePosition_gameWeekId_fkey" FOREIGN KEY ("gameWeekId") REFERENCES "GameWeek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_gameWeekId_fkey" FOREIGN KEY ("gameWeekId") REFERENCES "GameWeek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameWeekParticipant" ADD CONSTRAINT "GameWeekParticipant_gameWeekId_fkey" FOREIGN KEY ("gameWeekId") REFERENCES "GameWeek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameWeekParticipant" ADD CONSTRAINT "GameWeekParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FPLGameWeekSnapshot" ADD CONSTRAINT "FPLGameWeekSnapshot_gameWeekId_fkey" FOREIGN KEY ("gameWeekId") REFERENCES "GameWeek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FPLGameWeekSnapshot" ADD CONSTRAINT "FPLGameWeekSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameWeekResult" ADD CONSTRAINT "GameWeekResult_gameWeekId_fkey" FOREIGN KEY ("gameWeekId") REFERENCES "GameWeek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameWeekResult" ADD CONSTRAINT "GameWeekResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrizePayment" ADD CONSTRAINT "PrizePayment_gameWeekResultId_fkey" FOREIGN KEY ("gameWeekResultId") REFERENCES "GameWeekResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrizePayment" ADD CONSTRAINT "PrizePayment_paidByUserId_fkey" FOREIGN KEY ("paidByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
