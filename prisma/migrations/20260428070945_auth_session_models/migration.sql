/*
  Warnings:

  - You are about to drop the column `is_active` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `refresh_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('ANDROID', 'IOS', 'WEB');

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_user_id_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "is_active",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ACTIVE';

-- DropTable
DROP TABLE "refresh_tokens";

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "device_info" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "refresh_token_hash" TEXT NOT NULL,
    "refresh_token_encrypted" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invalidated_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "token_hash" TEXT NOT NULL,
    "reason" VARCHAR(255),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invalidated_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_fcm_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "device_id" VARCHAR(255),
    "platform" "Platform" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_fcm_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_session_id_key" ON "user_sessions"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refresh_token_hash_key" ON "user_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_session_id_user_id_idx" ON "user_sessions"("session_id", "user_id");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "user_sessions_revoked_at_idx" ON "user_sessions"("revoked_at");

-- CreateIndex
CREATE UNIQUE INDEX "invalidated_tokens_token_hash_key" ON "invalidated_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "invalidated_tokens_user_id_idx" ON "invalidated_tokens"("user_id");

-- CreateIndex
CREATE INDEX "invalidated_tokens_expires_at_idx" ON "invalidated_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_fcm_tokens_token_key" ON "user_fcm_tokens"("token");

-- CreateIndex
CREATE INDEX "user_fcm_tokens_user_id_idx" ON "user_fcm_tokens"("user_id");

-- CreateIndex
CREATE INDEX "user_fcm_tokens_platform_idx" ON "user_fcm_tokens"("platform");

-- CreateIndex
CREATE INDEX "user_fcm_tokens_is_active_idx" ON "user_fcm_tokens"("is_active");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invalidated_tokens" ADD CONSTRAINT "invalidated_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_fcm_tokens" ADD CONSTRAINT "user_fcm_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
