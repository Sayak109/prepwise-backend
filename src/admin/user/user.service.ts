import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Status, UserRole, AuthMethod } from '@prisma/client';
import { hashPassword } from '@/common/helper/common.helper';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateEditorDto } from './dto/create-editor.dto';
import { EditorTopicPermissionDto } from './dto/editor-topic-permission.dto';
import { UpdateEditorDto } from './dto/update-editor.dto';
import { UpdateEditorPermissionsDto } from './dto/update-editor-permissions.dto';
import { UserQueryDto } from './dto/user-query.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: UserQueryDto) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 10), 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { phoneNo: { contains: query.search } },
      ];
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.userListSelect(),
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((user) => this.formatUser(user)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createEditor(dto: CreateEditorDto, currentUser: any) {
    const email = this.normalizeEmail(dto.email);
    const phoneNo = dto.phoneNo?.trim();

    const exists = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(phoneNo ? [{ phoneNo }] : [])],
      },
      select: { id: true, email: true, phoneNo: true },
    });

    if (exists?.email === email) {
      throw new BadRequestException('Email already exists.');
    }
    if (phoneNo && exists?.phoneNo === phoneNo) {
      throw new BadRequestException('Phone number already exists.');
    }

    const editor = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email,
        phoneNo,
        passwordHash: await hashPassword(dto.password),
        role: UserRole.EDITOR,
        status: dto.status ?? Status.ACTIVE,
        authMethod: AuthMethod.EMAIL_PW,
      },
      select: this.editorSelect(),
    });

    if (dto.permissions?.length) {
      await this.setEditorTopicPermissions(
        editor.id,
        dto.permissions,
        currentUser?.id,
      );
      return this.getEditorById(editor.id);
    }

    return this.formatUser(editor);
  }

  async updateEditor(editorId: string, dto: UpdateEditorDto) {
    const editor = await this.findEditorOrThrow(editorId);
    const email = dto.email ? this.normalizeEmail(dto.email) : undefined;
    const phoneNo = dto.phoneNo?.trim();

    if (email || phoneNo) {
      const duplicate = await this.prisma.user.findFirst({
        where: {
          id: { not: editor.id },
          OR: [
            ...(email ? [{ email }] : []),
            ...(phoneNo ? [{ phoneNo }] : []),
          ],
        },
        select: { email: true, phoneNo: true },
      });

      if (duplicate?.email === email) {
        throw new BadRequestException('Email already exists.');
      }
      if (phoneNo && duplicate?.phoneNo === phoneNo) {
        throw new BadRequestException('Phone number already exists.');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: editorId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email,
        phoneNo,
        status: dto.status,
        passwordHash: dto.password
          ? await hashPassword(dto.password)
          : undefined,
      },
      select: this.editorSelect(),
    });

    if (dto.permissions) {
      await this.setEditorTopicPermissions(editorId, dto.permissions);
      return this.getEditorById(editorId);
    }

    return this.formatUser(updated);
  }

  async getEditorPermissions(editorId: string) {
    await this.findEditorOrThrow(editorId);
    return this.prisma.editorTopicPermission.findMany({
      where: { editorId },
      orderBy: { createdAt: 'desc' },
      select: this.permissionSelect(),
    });
  }

  async updateEditorPermissions(
    editorId: string,
    dto: UpdateEditorPermissionsDto,
    currentUser: any,
  ) {
    await this.setEditorTopicPermissions(
      editorId,
      dto.permissions,
      currentUser?.id,
    );
    return this.getEditorPermissions(editorId);
  }

  private async setEditorTopicPermissions(
    editorId: string,
    permissions: EditorTopicPermissionDto[],
    assignedById?: string,
  ) {
    await this.findEditorOrThrow(editorId);
    this.ensureUniqueTopics(permissions);

    const topicIds = permissions.map((permission) => permission.topicId);
    if (topicIds.length) {
      const topicCount = await this.prisma.topic.count({
        where: { id: { in: topicIds } },
      });

      if (topicCount !== topicIds.length) {
        throw new BadRequestException('One or more topics were not found.');
      }
    }

    await this.prisma.$transaction([
      this.prisma.editorTopicPermission.deleteMany({
        where: {
          editorId,
          topicId: { notIn: topicIds },
        },
      }),
      ...permissions.map((permission) =>
        this.prisma.editorTopicPermission.upsert({
          where: {
            editorId_topicId: {
              editorId,
              topicId: permission.topicId,
            },
          },
          create: {
            editorId,
            topicId: permission.topicId,
            assignedById,
            canCreate: permission.canCreate ?? true,
            canUpdate: permission.canUpdate ?? true,
            canDelete: permission.canDelete ?? true,
          },
          update: {
            assignedById,
            canCreate: permission.canCreate ?? true,
            canUpdate: permission.canUpdate ?? true,
            canDelete: permission.canDelete ?? true,
          },
        }),
      ),
    ]);
  }

  private async getEditorById(editorId: string) {
    const editor = await this.prisma.user.findUnique({
      where: { id: editorId },
      select: this.editorSelect(),
    });

    return this.formatUser(editor);
  }

  private async findEditorOrThrow(editorId: string) {
    const editor = await this.prisma.user.findUnique({
      where: { id: editorId },
      select: { id: true, role: true },
    });

    if (!editor || editor.role !== UserRole.EDITOR) {
      throw new BadRequestException('Editor not found.');
    }

    return editor;
  }

  private ensureUniqueTopics(permissions: EditorTopicPermissionDto[]) {
    const topicIds = permissions.map((permission) => permission.topicId);
    if (new Set(topicIds).size !== topicIds.length) {
      throw new BadRequestException(
        'Duplicate topic permissions are not allowed.',
      );
    }
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private formatUser(user: any) {
    if (!user) return null;
    return {
      ...user,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
    };
  }

  private userListSelect() {
    return {
      id: true,
      email: true,
      phoneNo: true,
      firstName: true,
      lastName: true,
      authMethod: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          editorTopicPermissions: true,
        },
      },
    };
  }

  private editorSelect() {
    return {
      ...this.userListSelect(),
      editorTopicPermissions: {
        orderBy: { createdAt: 'desc' as const },
        select: this.permissionSelect(),
      },
    };
  }

  private permissionSelect() {
    return {
      id: true,
      topicId: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
      createdAt: true,
      updatedAt: true,
      topic: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      assignedBy: {
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
