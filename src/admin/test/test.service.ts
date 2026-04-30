import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateTestDto } from './dto/create-test.dto';
import { TestQueryDto } from './dto/test-query.dto';
import { TestQuestionInputDto } from './dto/test-question-input.dto';
import { UpdateTestQuestionsDto } from './dto/update-test-questions.dto';
import { UpdateTestDto } from './dto/update-test.dto';

@Injectable()
export class AdminTestService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTestDto, currentUser: any) {
    await this.validateTestPayload(dto);

    const test = await this.prisma.$transaction(async (tx) => {
      const created = await tx.test.create({
        data: {
          title: dto.title.trim(),
          topicId: dto.topicId,
          difficulty: dto.difficulty,
          isTimed: dto.isTimed ?? false,
          durationSeconds: dto.isTimed ? dto.durationSeconds : undefined,
          isPremium: dto.isPremium ?? false,
          createdById: currentUser?.id,
        },
        select: { id: true },
      });

      if (dto.questions?.length) {
        await this.replaceQuestions(tx, created.id, dto.questions);
      }

      return created;
    });

    return this.findOne(test.id);
  }

  async findAll(query: TestQueryDto) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 10), 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.TestWhereInput = {};
    if (query.topicId) where.topicId = query.topicId;
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.isPremium !== undefined)
      where.isPremium = query.isPremium === 'true';
    if (query.search)
      where.title = { contains: query.search, mode: 'insensitive' };

    const [tests, total] = await this.prisma.$transaction([
      this.prisma.test.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.testSelect(),
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
      select: this.testSelect(),
    });

    if (!test) {
      throw new BadRequestException('Test not found.');
    }

    return test;
  }

  async update(id: string, dto: UpdateTestDto) {
    await this.findOne(id);
    await this.validateTestPayload(dto, true);

    await this.prisma.$transaction(async (tx) => {
      await tx.test.update({
        where: { id },
        data: {
          title: dto.title?.trim(),
          topicId: dto.topicId,
          difficulty: dto.difficulty,
          isTimed: dto.isTimed,
          durationSeconds: dto.isTimed === false ? null : dto.durationSeconds,
          isPremium: dto.isPremium,
        },
      });

      if (dto.questions) {
        await this.replaceQuestions(tx, id, dto.questions);
      }
    });

    return this.findOne(id);
  }

  async updateQuestions(id: string, dto: UpdateTestQuestionsDto) {
    await this.findOne(id);
    await this.prisma.$transaction((tx) =>
      this.replaceQuestions(tx, id, dto.questions),
    );

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.test.delete({
      where: { id },
      select: this.testSelect(),
    });
  }

  private async validateTestPayload(
    dto: Partial<CreateTestDto>,
    isUpdate = false,
  ) {
    if (!isUpdate && !dto.title?.trim()) {
      throw new BadRequestException('Test title is required.');
    }

    if (dto.topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: dto.topicId },
        select: { id: true },
      });

      if (!topic) {
        throw new BadRequestException('Topic not found.');
      }
    }

    if (dto.isTimed && (!dto.durationSeconds || dto.durationSeconds < 60)) {
      throw new BadRequestException('Timed tests require at least 60 seconds.');
    }

    if (dto.questions) {
      await this.validateQuestions(dto.questions);
    }
  }

  private async validateQuestions(questions: TestQuestionInputDto[]) {
    const questionIds = questions.map((question) => question.questionId);
    if (new Set(questionIds).size !== questionIds.length) {
      throw new BadRequestException('Duplicate questions are not allowed.');
    }

    const displayOrders = questions.map(
      (question, index) => question.displayOrder ?? index,
    );
    if (new Set(displayOrders).size !== displayOrders.length) {
      throw new BadRequestException(
        'Duplicate question display orders are not allowed.',
      );
    }

    const existingCount = await this.prisma.question.count({
      where: { id: { in: questionIds } },
    });

    if (existingCount !== questionIds.length) {
      throw new BadRequestException('One or more questions were not found.');
    }
  }

  private async replaceQuestions(
    tx: Prisma.TransactionClient,
    testId: string,
    questions: TestQuestionInputDto[],
  ) {
    await this.validateQuestions(questions);
    await tx.testQuestion.deleteMany({ where: { testId } });

    for (const [index, question] of questions.entries()) {
      await tx.testQuestion.create({
        data: {
          testId,
          questionId: question.questionId,
          displayOrder: question.displayOrder ?? index,
          points:
            question.points !== undefined
              ? new Prisma.Decimal(question.points)
              : new Prisma.Decimal(1),
        },
      });
    }
  }

  private testSelect() {
    return {
      id: true,
      title: true,
      topicId: true,
      difficulty: true,
      isTimed: true,
      durationSeconds: true,
      isPremium: true,
      createdById: true,
      createdAt: true,
      updatedAt: true,
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
          displayOrder: true,
          points: true,
          question: {
            select: {
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
            },
          },
        },
      },
      _count: {
        select: {
          questions: true,
          attempts: true,
        },
      },
    };
  }
}
