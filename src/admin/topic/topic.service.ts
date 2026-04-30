import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import slugify from 'slugify';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { TopicQueryDto } from './dto/topic-query.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Injectable()
export class TopicService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTopicDto) {
    const title = dto.title.trim();
    const slug = await this.buildUniqueSlug(dto.slug ?? title);

    if (dto.parentId) {
      await this.findTopicOrThrow(dto.parentId);
    }

    return this.prisma.topic.create({
      data: {
        title,
        slug,
        description: dto.description,
        parentId: dto.parentId,
        isPremium: dto.isPremium ?? false,
      },
      select: this.topicSelect(),
    });
  }

  async findAll(query: TopicQueryDto) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 10), 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.TopicWhereInput = {};
    if (query.parentId) where.parentId = query.parentId;
    if (query.isPremium !== undefined) where.isPremium = query.isPremium === 'true';
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
        select: this.topicSelect(),
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

  async findOne(id: string) {
    return this.findTopicOrThrow(id);
  }

  async update(id: string, dto: UpdateTopicDto) {
    await this.findTopicOrThrow(id);

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('Topic cannot be its own parent.');
      }
      await this.findTopicOrThrow(dto.parentId);
    }

    const slug = dto.slug ? await this.buildUniqueSlug(dto.slug, id) : undefined;

    return this.prisma.topic.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        slug,
        description: dto.description,
        parentId: dto.parentId,
        isPremium: dto.isPremium,
      },
      select: this.topicSelect(),
    });
  }

  async remove(id: string) {
    await this.findTopicOrThrow(id);
    return this.prisma.topic.delete({
      where: { id },
      select: this.topicSelect(),
    });
  }

  private async findTopicOrThrow(id: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      select: this.topicSelect(),
    });

    if (!topic) {
      throw new BadRequestException('Topic not found.');
    }

    return topic;
  }

  private async buildUniqueSlug(value: string, ignoreId?: string) {
    const base = slugify(value.trim(), { lower: true, strict: true });
    if (!base) {
      throw new BadRequestException('Topic slug is invalid.');
    }

    let slug = base;
    let counter = 1;

    while (
      await this.prisma.topic.findFirst({
        where: {
          slug,
          ...(ignoreId ? { id: { not: ignoreId } } : {}),
        },
        select: { id: true },
      })
    ) {
      slug = `${base}-${counter}`;
      counter++;
    }

    return slug;
  }

  private topicSelect() {
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
      _count: {
        select: {
          children: true,
          questions: true,
        },
      },
    };
  }
}
