import { BadRequestException, Injectable } from '@nestjs/common';
import { Difficulty, Prisma, QuestionType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionOptionDto } from './dto/question-option.dto';
import { QuestionQueryDto } from './dto/question-query.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateQuestionDto, currentUser: any) {
    await this.ensureTopicExists(dto.topicId);
    this.validateQuestionPayload(dto.type, dto);

    const question = await this.prisma.$transaction(async (tx) => {
      const created = await tx.question.create({
        data: {
          topicId: dto.topicId,
          createdById: currentUser?.id,
          type: dto.type,
          questionText: dto.questionText,
          difficulty: dto.difficulty,
          explanation: dto.explanation,
          correctAnswer:
            dto.type === QuestionType.SHORT_ANSWER
              ? dto.correctAnswer
              : undefined,
          caseInsensitiveMatch:
            dto.type === QuestionType.SHORT_ANSWER
              ? (dto.caseInsensitiveMatch ?? true)
              : undefined,
          numericTolerance:
            dto.type === QuestionType.SHORT_ANSWER &&
            dto.numericTolerance !== undefined
              ? new Prisma.Decimal(dto.numericTolerance)
              : undefined,
          sampleAnswer:
            dto.type === QuestionType.DESCRIPTIVE
              ? dto.sampleAnswer
              : undefined,
          isPremium: dto.isPremium ?? false,
        },
        select: { id: true },
      });

      if (dto.type === QuestionType.MCQ) {
        await this.replaceOptions(tx, created.id, dto.options ?? []);
      }

      return created;
    });

    return this.findOne(question.id);
  }

  async findAll(query: QuestionQueryDto) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 10), 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.QuestionWhereInput = {};
    if (query.topicId) where.topicId = query.topicId;
    if (query.type) where.type = query.type;
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.isPremium !== undefined)
      where.isPremium = query.isPremium === 'true';
    if (query.search) {
      where.OR = [
        { questionText: { contains: query.search, mode: 'insensitive' } },
        { explanation: { contains: query.search, mode: 'insensitive' } },
        { correctAnswer: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [questions, total] = await this.prisma.$transaction([
      this.prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.questionSelect(),
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      questions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      select: this.questionSelect(),
    });

    if (!question) {
      throw new BadRequestException('Question not found.');
    }

    return question;
  }

  async update(id: string, dto: UpdateQuestionDto, currentUser: any) {
    const existing = await this.findOne(id);
    const nextType = dto.type ?? existing.type;
    const nextTopicId = dto.topicId ?? existing.topicId;
    const isTypeChanging = Boolean(dto.type && dto.type !== existing.type);

    if (dto.topicId) {
      await this.ensureTopicExists(dto.topicId);
    }

    this.validateQuestionPayload(nextType, dto, true, isTypeChanging);

    await this.prisma.$transaction(async (tx) => {
      await tx.question.update({
        where: { id },
        data: {
          topicId: nextTopicId,
          updatedById: currentUser?.id,
          type: nextType,
          questionText: dto.questionText,
          difficulty: dto.difficulty,
          explanation: dto.explanation,
          correctOptionId: nextType === QuestionType.MCQ ? undefined : null,
          correctAnswer:
            nextType === QuestionType.SHORT_ANSWER
              ? dto.correctAnswer
              : dto.type
                ? null
                : undefined,
          caseInsensitiveMatch:
            nextType === QuestionType.SHORT_ANSWER
              ? dto.caseInsensitiveMatch
              : dto.type
                ? null
                : undefined,
          numericTolerance:
            nextType === QuestionType.SHORT_ANSWER &&
            dto.numericTolerance !== undefined
              ? new Prisma.Decimal(dto.numericTolerance)
              : dto.type
                ? null
                : undefined,
          sampleAnswer:
            nextType === QuestionType.DESCRIPTIVE
              ? dto.sampleAnswer
              : dto.type
                ? null
                : undefined,
          isPremium: dto.isPremium,
        },
      });

      if (nextType === QuestionType.MCQ && dto.options) {
        await this.replaceOptions(tx, id, dto.options);
      }

      if (nextType !== QuestionType.MCQ) {
        await tx.mcqOption.deleteMany({ where: { questionId: id } });
      }
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.question.delete({
      where: { id },
      select: this.questionSelect(),
    });
  }

  private validateQuestionPayload(
    type: QuestionType,
    dto: Partial<CreateQuestionDto>,
    isUpdate = false,
    isTypeChanging = false,
  ) {
    if (type === QuestionType.MCQ) {
      if (!isUpdate || dto.options || isTypeChanging) {
        this.validateOptions(dto.options ?? []);
      }
      return;
    }

    if (dto.options?.length) {
      throw new BadRequestException(
        'Options are allowed only for MCQ questions.',
      );
    }

    if (
      (!isUpdate || isTypeChanging) &&
      type === QuestionType.SHORT_ANSWER &&
      !dto.correctAnswer?.trim()
    ) {
      throw new BadRequestException(
        'Correct answer is required for short answer questions.',
      );
    }
  }

  private validateOptions(options: QuestionOptionDto[]) {
    if (options.length < 2) {
      throw new BadRequestException(
        'MCQ questions require at least two options.',
      );
    }

    const correctOptions = options.filter((option) => option.isCorrect);
    if (correctOptions.length !== 1) {
      throw new BadRequestException(
        'MCQ questions require exactly one correct option.',
      );
    }

    const displayOrders = options.map(
      (option, index) => option.displayOrder ?? index,
    );
    if (new Set(displayOrders).size !== displayOrders.length) {
      throw new BadRequestException(
        'Duplicate option display orders are not allowed.',
      );
    }
  }

  private async replaceOptions(
    tx: Prisma.TransactionClient,
    questionId: string,
    options: QuestionOptionDto[],
  ) {
    this.validateOptions(options);

    await tx.question.update({
      where: { id: questionId },
      data: { correctOptionId: null },
    });
    await tx.mcqOption.deleteMany({ where: { questionId } });

    let correctOptionId: string | undefined;
    for (const [index, option] of options.entries()) {
      const created = await tx.mcqOption.create({
        data: {
          questionId,
          optionText: option.optionText,
          displayOrder: option.displayOrder ?? index,
        },
        select: { id: true },
      });

      if (option.isCorrect) {
        correctOptionId = created.id;
      }
    }

    await tx.question.update({
      where: { id: questionId },
      data: { correctOptionId },
    });
  }

  private async ensureTopicExists(topicId: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true },
    });

    if (!topic) {
      throw new BadRequestException('Topic not found.');
    }
  }

  private questionSelect() {
    return {
      id: true,
      topicId: true,
      type: true,
      questionText: true,
      difficulty: true,
      explanation: true,
      correctOptionId: true,
      correctAnswer: true,
      caseInsensitiveMatch: true,
      numericTolerance: true,
      sampleAnswer: true,
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
      options: {
        orderBy: { displayOrder: 'asc' as const },
        select: {
          id: true,
          optionText: true,
          displayOrder: true,
        },
      },
      correctOption: {
        select: {
          id: true,
          optionText: true,
          displayOrder: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      updatedBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    };
  }
}
