-- CreateTable
CREATE TABLE "tbl_admin_activity_log" (
    "id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "table" TEXT,
    "action" TEXT NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_admin_activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_admin_settings" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_admin_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_admin_activity_log_id_table_description_action_idx" ON "tbl_admin_activity_log"("id", "table", "description", "action");

-- CreateIndex
CREATE INDEX "tbl_admin_settings_title_idx" ON "tbl_admin_settings"("title");
