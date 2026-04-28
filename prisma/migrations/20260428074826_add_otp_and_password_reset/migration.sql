-- AlterTable
ALTER TABLE "users" ADD COLUMN     "reset_token" TEXT,
ADD COLUMN     "reset_token_exp" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "otp" (
    "id" UUID NOT NULL,
    "credential" TEXT,
    "OTP" INTEGER NOT NULL,
    "limit" INTEGER NOT NULL DEFAULT 0,
    "restrictedTime" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expire_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_id_credential_OTP_idx" ON "otp"("id", "credential", "OTP");
