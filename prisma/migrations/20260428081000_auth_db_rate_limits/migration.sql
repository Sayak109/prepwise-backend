-- CreateEnum
CREATE TYPE "AuthMethod" AS ENUM ('EMAIL_PW', 'EMAIL_OTP', 'PHONE_OTP', 'GOOGLE', 'APPLE');

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL,
ADD COLUMN     "phone_no" VARCHAR(30),
ADD COLUMN     "auth_method" "AuthMethod" NOT NULL DEFAULT 'EMAIL_PW',
ADD COLUMN     "provider_id" TEXT;

-- CreateTable
CREATE TABLE "auth_rate_limits" (
    "id" UUID NOT NULL,
    "identifier" VARCHAR(255) NOT NULL,
    "ip_address" VARCHAR(45) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "penalty_level" INTEGER NOT NULL DEFAULT 0,
    "blocked_until" TIMESTAMP(3),
    "last_attempt_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_no_key" ON "users"("phone_no");

-- CreateIndex
CREATE INDEX "users_auth_method_idx" ON "users"("auth_method");

-- CreateIndex
CREATE INDEX "auth_rate_limits_blocked_until_idx" ON "auth_rate_limits"("blocked_until");

-- CreateIndex
CREATE UNIQUE INDEX "auth_rate_limits_identifier_ip_address_key" ON "auth_rate_limits"("identifier", "ip_address");
