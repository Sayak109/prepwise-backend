-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'STUDENT');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'SHORT_ANSWER', 'DESCRIPTIVE');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "parent_id" UUID,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "editor_topic_permissions" (
    "id" UUID NOT NULL,
    "editor_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "assigned_by_id" UUID,
    "can_create" BOOLEAN NOT NULL DEFAULT true,
    "can_update" BOOLEAN NOT NULL DEFAULT true,
    "can_delete" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editor_topic_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "type" "QuestionType" NOT NULL,
    "question_text" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "explanation" TEXT,
    "correct_option_id" UUID,
    "correct_answer" TEXT,
    "case_insensitive_match" BOOLEAN,
    "numeric_tolerance" DECIMAL(12,4),
    "sample_answer" TEXT,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcq_options" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "option_text" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mcq_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "topic_id" UUID,
    "difficulty" "Difficulty",
    "is_timed" BOOLEAN NOT NULL DEFAULT false,
    "duration_seconds" INTEGER,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_questions" (
    "id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "points" DECIMAL(8,2) NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "score" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "selected_option_id" UUID,
    "answer_text" TEXT,
    "is_correct" BOOLEAN,
    "score" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "feedback" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "questions_attempted" INTEGER NOT NULL DEFAULT 0,
    "correct_answers" INTEGER NOT NULL DEFAULT 0,
    "mastery_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "topics_slug_key" ON "topics"("slug");

-- CreateIndex
CREATE INDEX "topics_parent_id_idx" ON "topics"("parent_id");

-- CreateIndex
CREATE INDEX "topics_is_premium_idx" ON "topics"("is_premium");

-- CreateIndex
CREATE INDEX "editor_topic_permissions_topic_id_idx" ON "editor_topic_permissions"("topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "editor_topic_permissions_editor_id_topic_id_key" ON "editor_topic_permissions"("editor_id", "topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "questions_correct_option_id_key" ON "questions"("correct_option_id");

-- CreateIndex
CREATE INDEX "questions_topic_id_idx" ON "questions"("topic_id");

-- CreateIndex
CREATE INDEX "questions_type_idx" ON "questions"("type");

-- CreateIndex
CREATE INDEX "questions_difficulty_idx" ON "questions"("difficulty");

-- CreateIndex
CREATE INDEX "questions_is_premium_idx" ON "questions"("is_premium");

-- CreateIndex
CREATE INDEX "mcq_options_question_id_idx" ON "mcq_options"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "mcq_options_question_id_display_order_key" ON "mcq_options"("question_id", "display_order");

-- CreateIndex
CREATE INDEX "tests_topic_id_idx" ON "tests"("topic_id");

-- CreateIndex
CREATE INDEX "tests_difficulty_idx" ON "tests"("difficulty");

-- CreateIndex
CREATE INDEX "tests_is_premium_idx" ON "tests"("is_premium");

-- CreateIndex
CREATE INDEX "test_questions_question_id_idx" ON "test_questions"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_questions_test_id_question_id_key" ON "test_questions"("test_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_questions_test_id_display_order_key" ON "test_questions"("test_id", "display_order");

-- CreateIndex
CREATE INDEX "test_attempts_user_id_idx" ON "test_attempts"("user_id");

-- CreateIndex
CREATE INDEX "test_attempts_test_id_idx" ON "test_attempts"("test_id");

-- CreateIndex
CREATE INDEX "test_attempts_status_idx" ON "test_attempts"("status");

-- CreateIndex
CREATE INDEX "answers_user_id_idx" ON "answers"("user_id");

-- CreateIndex
CREATE INDEX "answers_question_id_idx" ON "answers"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "answers_attempt_id_question_id_key" ON "answers"("attempt_id", "question_id");

-- CreateIndex
CREATE INDEX "user_progress_topic_id_idx" ON "user_progress"("topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_user_id_topic_id_key" ON "user_progress"("user_id", "topic_id");

-- CreateIndex
CREATE INDEX "bookmarks_question_id_idx" ON "bookmarks"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_user_id_question_id_key" ON "bookmarks"("user_id", "question_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editor_topic_permissions" ADD CONSTRAINT "editor_topic_permissions_editor_id_fkey" FOREIGN KEY ("editor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editor_topic_permissions" ADD CONSTRAINT "editor_topic_permissions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editor_topic_permissions" ADD CONSTRAINT "editor_topic_permissions_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_correct_option_id_fkey" FOREIGN KEY ("correct_option_id") REFERENCES "mcq_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcq_options" ADD CONSTRAINT "mcq_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "mcq_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
