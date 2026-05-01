import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AttemptStatus,
  Prisma,
  QuestionType,
  TestQuestionStatus,
} from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { FlagTestQuestionDto } from './dto/flag-test-question.dto';
import { SaveTestAnswerDto } from './dto/save-test-answer.dto';
import { StudentTestQueryDto } from './dto/test-query.dto';

@Injectable()
export class TestService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: StudentTestQueryDto) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 10), 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.TestWhereInput = {};
    if (query.topicId) where.topicId = query.topicId;
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.isPremium !== undefined)
      where.isPremium = query.isPremium === 'true';
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        {
          topic: {
            title: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [tests, total] = await this.prisma.$transaction([
      this.prisma.test.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.testListSelect(),
      }),
      this.prisma.test.count({ where }),
    ]);

    return {
      tests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const test = await this.prisma.test.findUnique({
      where: { id },
      select: this.testDetailSelect(),
    });

    if (!test) {
      throw new BadRequestException('Test not found.');
    }

    return test;
  }

  async start(testId: string, currentUser: any) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      select: {
        id: true,
        questions: {
          orderBy: { displayOrder: 'asc' },
          select: { questionId: true },
        },
      },
    });

    if (!test) {
      throw new BadRequestException('Test not found.');
    }

    if (!test.questions.length) {
      throw new BadRequestException('This test does not have any questions.');
    }

    const attempt = await this.prisma.$transaction(async (tx) => {
      const created = await tx.testAttempt.create({
        data: {
          testId,
          userId: currentUser.id,
          status: AttemptStatus.IN_PROGRESS,
        },
        select: { id: true },
      });

      await tx.testAttemptQuestionState.createMany({
        data: test.questions.map((question) => ({
          attemptId: created.id,
          questionId: question.questionId,
          userId: currentUser.id,
          status: TestQuestionStatus.NOT_VISITED,
        })),
      });

      return created;
    });

    return this.getAttempt(attempt.id, currentUser);
  }

  async getAttempt(attemptId: string, currentUser: any) {
    const attempt = await this.findAttemptOrThrow(attemptId, currentUser.id);
    await this.completeIfExpired(attempt);

    const freshAttempt = await this.findAttemptOrThrow(
      attemptId,
      currentUser.id,
    );
    return this.buildAttemptResponse(freshAttempt);
  }

  async visitQuestion(attemptId: string, questionId: string, currentUser: any) {
    const attempt = await this.ensureActiveAttempt(attemptId, currentUser.id);
    await this.ensureQuestionInAttempt(attempt.testId, questionId);

    await this.prisma.testAttemptQuestionState.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      create: {
        attemptId,
        questionId,
        userId: currentUser.id,
        status: TestQuestionStatus.NOT_VISITED,
        visitedAt: new Date(),
      },
      update: {
        visitedAt: new Date(),
      },
    });

    return this.getAttempt(attemptId, currentUser);
  }

  async flagQuestion(
    attemptId: string,
    questionId: string,
    dto: FlagTestQuestionDto,
    currentUser: any,
  ) {
    const attempt = await this.ensureActiveAttempt(attemptId, currentUser.id);
    await this.ensureQuestionInAttempt(attempt.testId, questionId);

    const answer = await this.prisma.answer.findUnique({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      select: { id: true },
    });

    await this.prisma.testAttemptQuestionState.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      create: {
        attemptId,
        questionId,
        userId: currentUser.id,
        status: dto.flagged
          ? TestQuestionStatus.FLAGGED
          : answer
            ? TestQuestionStatus.ANSWERED
            : TestQuestionStatus.NOT_VISITED,
        visitedAt: new Date(),
        flaggedAt: dto.flagged ? new Date() : null,
      },
      update: {
        status: dto.flagged
          ? TestQuestionStatus.FLAGGED
          : answer
            ? TestQuestionStatus.ANSWERED
            : TestQuestionStatus.NOT_VISITED,
        flaggedAt: dto.flagged ? new Date() : null,
        visitedAt: new Date(),
      },
    });

    return this.getAttempt(attemptId, currentUser);
  }

  async saveAnswer(
    attemptId: string,
    questionId: string,
    dto: SaveTestAnswerDto,
    currentUser: any,
  ) {
    const attempt = await this.ensureActiveAttempt(attemptId, currentUser.id);
    const testQuestion = await this.ensureQuestionInAttempt(
      attempt.testId,
      questionId,
    );

    const evaluation = await this.evaluateAnswer(testQuestion, dto);
    const currentState = await this.prisma.testAttemptQuestionState.findUnique({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      select: { status: true },
    });
    const nextStatus =
      currentState?.status === TestQuestionStatus.FLAGGED
        ? TestQuestionStatus.FLAGGED
        : TestQuestionStatus.ANSWERED;

    await this.prisma.$transaction([
      this.prisma.answer.upsert({
        where: {
          attemptId_questionId: {
            attemptId,
            questionId,
          },
        },
        create: {
          attemptId,
          questionId,
          userId: currentUser.id,
          selectedOptionId: evaluation.selectedOptionId,
          answerText: evaluation.answerText,
          isCorrect: evaluation.isCorrect,
          score: evaluation.score,
        },
        update: {
          selectedOptionId: evaluation.selectedOptionId,
          answerText: evaluation.answerText,
          isCorrect: evaluation.isCorrect,
          score: evaluation.score,
          submittedAt: new Date(),
        },
      }),
      this.prisma.testAttemptQuestionState.upsert({
        where: {
          attemptId_questionId: {
            attemptId,
            questionId,
          },
        },
        create: {
          attemptId,
          questionId,
          userId: currentUser.id,
          status: nextStatus,
          visitedAt: new Date(),
          answeredAt: new Date(),
        },
        update: {
          status: nextStatus,
          visitedAt: new Date(),
          answeredAt: new Date(),
        },
      }),
    ]);

    await this.refreshAttemptScore(attemptId);
    return this.getAttempt(attemptId, currentUser);
  }

  async complete(attemptId: string, currentUser: any) {
    const attempt = await this.ensureAttemptForUser(attemptId, currentUser.id);
    await this.completeAttempt(attempt.id);
    return this.getAttempt(attempt.id, currentUser);
  }

  private async evaluateAnswer(testQuestion: any, dto: SaveTestAnswerDto) {
    const question = testQuestion.question;
    const points = new Prisma.Decimal(testQuestion.points ?? 1);

    if (question.type === QuestionType.MCQ) {
      if (!dto.selectedOptionId) {
        throw new BadRequestException(
          'Selected option is required for MCQ questions.',
        );
      }

      const option = question.options.find(
        (item) => item.id === dto.selectedOptionId,
      );
      if (!option) {
        throw new BadRequestException(
          'Selected option does not belong to this question.',
        );
      }

      const isCorrect = dto.selectedOptionId === question.correctOptionId;
      return {
        selectedOptionId: dto.selectedOptionId,
        answerText: null,
        isCorrect,
        score: isCorrect ? points : new Prisma.Decimal(0),
      };
    }

    if (!dto.answerText?.trim()) {
      throw new BadRequestException(
        'Answer text is required for this question.',
      );
    }

    if (question.type === QuestionType.SHORT_ANSWER) {
      const isCorrect = this.isShortAnswerCorrect(question, dto.answerText);
      return {
        selectedOptionId: null,
        answerText: dto.answerText.trim(),
        isCorrect,
        score: isCorrect ? points : new Prisma.Decimal(0),
      };
    }

    return {
      selectedOptionId: null,
      answerText: dto.answerText.trim(),
      isCorrect: null,
      score: new Prisma.Decimal(0),
    };
  }

  private isShortAnswerCorrect(question: any, answerText: string) {
    const expected = question.correctAnswer?.trim();
    const actual = answerText.trim();
    if (!expected) return null;

    if (
      question.numericTolerance !== null &&
      question.numericTolerance !== undefined
    ) {
      const expectedNumber = Number(expected);
      const actualNumber = Number(actual);
      if (!Number.isNaN(expectedNumber) && !Number.isNaN(actualNumber)) {
        return (
          Math.abs(expectedNumber - actualNumber) <=
          Number(question.numericTolerance)
        );
      }
    }

    if (question.caseInsensitiveMatch !== false) {
      return expected.toLowerCase() === actual.toLowerCase();
    }

    return expected === actual;
  }

  private async ensureActiveAttempt(attemptId: string, userId: string) {
    const attempt = await this.ensureAttemptForUser(attemptId, userId);
    await this.completeIfExpired(attempt);

    const freshAttempt = await this.ensureAttemptForUser(attemptId, userId);
    if (freshAttempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('This test attempt is already completed.');
    }

    return freshAttempt;
  }

  private async ensureAttemptForUser(attemptId: string, userId: string) {
    const attempt = await this.prisma.testAttempt.findFirst({
      where: { id: attemptId, userId },
      select: this.attemptSelect(),
    });

    if (!attempt) {
      throw new BadRequestException('Test attempt not found.');
    }

    return attempt;
  }

  private async findAttemptOrThrow(attemptId: string, userId: string) {
    return this.ensureAttemptForUser(attemptId, userId);
  }

  private async ensureQuestionInAttempt(testId: string, questionId: string) {
    const testQuestion = await this.prisma.testQuestion.findFirst({
      where: { testId, questionId },
      select: {
        id: true,
        testId: true,
        questionId: true,
        points: true,
        question: {
          select: {
            id: true,
            type: true,
            correctOptionId: true,
            correctAnswer: true,
            caseInsensitiveMatch: true,
            numericTolerance: true,
            options: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!testQuestion) {
      throw new BadRequestException('Question does not belong to this test.');
    }

    return testQuestion;
  }

  private async completeIfExpired(attempt: any) {
    if (
      attempt.status === AttemptStatus.IN_PROGRESS &&
      attempt.test.isTimed &&
      (this.getRemainingSeconds(attempt) ?? 0) <= 0
    ) {
      await this.completeAttempt(attempt.id);
    }
  }

  private async completeAttempt(attemptId: string) {
    await this.refreshAttemptScore(attemptId);
    await this.prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }

  private async refreshAttemptScore(attemptId: string) {
    const answers = await this.prisma.answer.findMany({
      where: { attemptId },
      select: { score: true },
    });

    const score = answers.reduce(
      (total, answer) => total.plus(answer.score),
      new Prisma.Decimal(0),
    );

    await this.prisma.testAttempt.update({
      where: { id: attemptId },
      data: { score },
    });
  }

  private buildAttemptResponse(attempt: any) {
    const answerByQuestionId = new Map<string, any>(
      attempt.answers.map((answer) => [answer.questionId, answer]),
    );
    const stateByQuestionId = new Map<string, any>(
      attempt.questionStates.map((state) => [state.questionId, state]),
    );

    return {
      id: attempt.id,
      testId: attempt.testId,
      score: attempt.score,
      status: attempt.status,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      timeRemainingSeconds: this.getRemainingSeconds(attempt),
      test: {
        id: attempt.test.id,
        title: attempt.test.title,
        topicId: attempt.test.topicId,
        difficulty: attempt.test.difficulty,
        isTimed: attempt.test.isTimed,
        durationSeconds: attempt.test.durationSeconds,
        isPremium: attempt.test.isPremium,
        topic: attempt.test.topic,
      },
      summary: {
        totalQuestions: attempt.test.questions.length,
        answered: attempt.answers.length,
        flagged: attempt.questionStates.filter(
          (state) => state.status === TestQuestionStatus.FLAGGED,
        ).length,
        notVisited: attempt.questionStates.filter(
          (state) => state.status === TestQuestionStatus.NOT_VISITED,
        ).length,
      },
      questions: attempt.test.questions.map((testQuestion) => {
        const answer = answerByQuestionId.get(testQuestion.questionId);
        const state = stateByQuestionId.get(testQuestion.questionId);

        return {
          id: testQuestion.question.id,
          testQuestionId: testQuestion.id,
          topicId: testQuestion.question.topicId,
          type: testQuestion.question.type,
          questionText: testQuestion.question.questionText,
          difficulty: testQuestion.question.difficulty,
          isPremium: testQuestion.question.isPremium,
          displayOrder: testQuestion.displayOrder,
          points: testQuestion.points,
          state: state?.status ?? TestQuestionStatus.NOT_VISITED,
          selectedOptionId: answer?.selectedOptionId ?? null,
          answerText: answer?.answerText ?? null,
          options: testQuestion.question.options,
        };
      }),
    };
  }

  private getRemainingSeconds(attempt: any) {
    if (!attempt.test.isTimed || !attempt.test.durationSeconds) return null;
    const elapsedSeconds = Math.floor(
      (Date.now() - new Date(attempt.startedAt).getTime()) / 1000,
    );
    return Math.max(attempt.test.durationSeconds - elapsedSeconds, 0);
  }

  private testListSelect() {
    return {
      id: true,
      title: true,
      topicId: true,
      difficulty: true,
      isTimed: true,
      durationSeconds: true,
      isPremium: true,
      createdAt: true,
      updatedAt: true,
      topic: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      _count: {
        select: {
          questions: true,
        },
      },
    };
  }

  private testDetailSelect() {
    return {
      ...this.testListSelect(),
      questions: {
        orderBy: { displayOrder: 'asc' as const },
        select: {
          id: true,
          displayOrder: true,
          points: true,
          question: {
            select: this.publicQuestionSelect(),
          },
        },
      },
    };
  }

  private attemptSelect() {
    return {
      id: true,
      userId: true,
      testId: true,
      score: true,
      status: true,
      startedAt: true,
      completedAt: true,
      test: {
        select: {
          id: true,
          title: true,
          topicId: true,
          difficulty: true,
          isTimed: true,
          durationSeconds: true,
          isPremium: true,
          topic: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          questions: {
            orderBy: { displayOrder: 'asc' as const },
            select: {
              id: true,
              questionId: true,
              displayOrder: true,
              points: true,
              question: {
                select: this.publicQuestionSelect(),
              },
            },
          },
        },
      },
      answers: {
        select: {
          questionId: true,
          selectedOptionId: true,
          answerText: true,
        },
      },
      questionStates: {
        select: {
          questionId: true,
          status: true,
          visitedAt: true,
          flaggedAt: true,
          answeredAt: true,
        },
      },
    };
  }

  private publicQuestionSelect() {
    return {
      id: true,
      topicId: true,
      type: true,
      questionText: true,
      difficulty: true,
      isPremium: true,
      options: {
        orderBy: { displayOrder: 'asc' as const },
        select: {
          id: true,
          optionText: true,
          displayOrder: true,
        },
      },
    };
  }
}
