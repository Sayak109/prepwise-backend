import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { PracticeQuestionQueryDto } from './dto/practice-question-query.dto';
import { PracticeTopicQueryDto } from './dto/practice-topic-query.dto';

@Injectable()
export class PracticeService {
  constructor(private prisma: PrismaService) {}

  async findTopics(query: PracticeTopicQueryDto) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    const skip = (page - 1) * limit;
    const includeQuestions = query.includeQuestions !== 'false';

    const where: Prisma.TopicWhereInput = {};
    if (query.parentId) where.parentId = query.parentId;
    if (query.isPremium !== undefined)
      where.isPremium = query.isPremium === 'true';
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [topics, total] = await this.prisma.$transaction([
      this.prisma.topic.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.topicSelect(includeQuestions),
      }),
      this.prisma.topic.count({ where }),
    ]);

    return {
      topics,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async startTopicPractice(topicId: string, query: PracticeQuestionQueryDto) {
    const topic = await this.findPracticeTopicOrThrow(topicId);
    const questions = await this.findTopicQuestions(topicId, query);

    return {
      topic,
      ...questions,
    };
  }

  async findQuestionsByTopic(topicId: string, query: PracticeQuestionQueryDto) {
    await this.findPracticeTopicOrThrow(topicId);
    return this.findTopicQuestions(topicId, query);
  }

  private async findTopicQuestions(
    topicId: string,
    query: PracticeQuestionQueryDto,
  ) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.QuestionWhereInput = { topicId };
    if (query.type) where.type = query.type;
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.isPremium !== undefined)
      where.isPremium = query.isPremium === 'true';
    if (query.search) {
      where.questionText = { contains: query.search, mode: 'insensitive' };
    }

    const [questions, total] = await this.prisma.$transaction([
      this.prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.practiceQuestionSelect(),
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

  private topicSelect(includeQuestions: boolean) {
    return {
      id: true,
      title: true,
      slug: true,
      description: true,
      parentId: true,
      isPremium: true,
      createdAt: true,
      updatedAt: true,
      parent: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      children: {
        select: {
          id: true,
          title: true,
          slug: true,
          isPremium: true,
        },
        orderBy: { title: 'asc' as const },
      },
      _count: {
        select: {
          children: true,
          questions: true,
        },
      },
      ...(includeQuestions
        ? {
            questions: {
              orderBy: { createdAt: 'desc' as const },
              select: this.practiceQuestionSelect(),
            },
          }
        : {}),
    };
  }

  private practiceQuestionSelect() {
    return {
      id: true,
      topicId: true,
      type: true,
      questionText: true,
      explanation: true,
      correctOptionId: true,
      correctAnswer: true,
      sampleAnswer: true,
      difficulty: true,
      isPremium: true,
      createdAt: true,
      updatedAt: true,
      correctOption: {
        select: {
          id: true,
          optionText: true,
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
    };
  }

  private async findPracticeTopicOrThrow(topicId: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        parentId: true,
        isPremium: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    if (!topic) {
      throw new BadRequestException('Topic not found.');
    }

    return topic;
  }
}
