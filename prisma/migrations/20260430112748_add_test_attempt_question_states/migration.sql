-- CreateEnum
CREATE TYPE "TestQuestionStatus" AS ENUM ('NOT_VISITED', 'ANSWERED', 'FLAGGED');

-- CreateTable
CREATE TABLE "test_attempt_question_states" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "TestQuestionStatus" NOT NULL DEFAULT 'NOT_VISITED',
    "visited_at" TIMESTAMP(3),
    "flagged_at" TIMESTAMP(3),
    "answered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_attempt_question_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "test_attempt_question_states_user_id_idx" ON "test_attempt_question_states"("user_id");

-- CreateIndex
CREATE INDEX "test_attempt_question_states_question_id_idx" ON "test_attempt_question_states"("question_id");

-- CreateIndex
CREATE INDEX "test_attempt_question_states_status_idx" ON "test_attempt_question_states"("status");

-- CreateIndex
CREATE UNIQUE INDEX "test_attempt_question_states_attempt_id_question_id_key" ON "test_attempt_question_states"("attempt_id", "question_id");

-- AddForeignKey
ALTER TABLE "test_attempt_question_states" ADD CONSTRAINT "test_attempt_question_states_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempt_question_states" ADD CONSTRAINT "test_attempt_question_states_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempt_question_states" ADD CONSTRAINT "test_attempt_question_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
