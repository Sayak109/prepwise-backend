import { Injectable } from '@nestjs/common';
import { AttemptStatus, Prisma } from '@prisma/client';
import { convertUTCToTimezone } from '@/common/utils/timezone.util';
import { PrismaService } from '@/prisma/prisma.service';
import { RecentAttemptsQueryDto } from './dto/recent-attempts-query.dto';

@Injectable()
export class DashboardService {
  private readonly passingPercent = 60;
  private readonly timezone = 'Asia/Kolkata';

  constructor(private prisma: PrismaService) {}

  async getDashboard(currentUser: any) {
    const [scoreSummary, totalTests, streak, recentAttempts] =
      await Promise.all([
        this.getScoreSummary(currentUser.id),
        this.prisma.test.count(),
        this.getStudyStreak(currentUser.id),
        this.getRecentAttempts(currentUser.id, { page: '1', limit: '5' }),
      ]);

    const overallScore =
      scoreSummary.totalPossibleScore > 0
        ? Math.round(
            (scoreSummary.totalEarnedScore / scoreSummary.totalPossibleScore) *
              100,
          )
        : 0;

    return {
      stats: {
        overallScore,
        testsCompleted: scoreSummary.completedAttempts,
        totalTests,
        testsCompletedPercent:
          totalTests > 0
            ? Math.round((scoreSummary.completedAttempts / totalTests) * 100)
            : 0,
        studyStreak: {
          currentDays: streak.currentDays,
          highestDays: streak.highestDays,
        },
      },
      recentAttempts: recentAttempts.attempts,
    };
  }

  async getAttemptHistory(currentUser: any, query: RecentAttemptsQueryDto) {
    return this.getRecentAttempts(currentUser.id, query);
  }

  private async getScoreSummary(userId: string) {
    const attempts = await this.prisma.testAttempt.findMany({
      where: {
        userId,
        status: AttemptStatus.COMPLETED,
      },
      select: {
        id: true,
        score: true,
        test: {
          select: {
            questions: {
              select: {
                points: true,
              },
            },
          },
        },
      },
    });

    return attempts.reduce(
      (summary, attempt) => {
        const possibleScore = attempt.test.questions.reduce(
          (total, question) => total.plus(question.points),
          new Prisma.Decimal(0),
        );

        summary.completedAttempts += 1;
        summary.totalEarnedScore += Number(attempt.score);
        summary.totalPossibleScore += Number(possibleScore);
        return summary;
      },
      {
        completedAttempts: 0,
        totalEarnedScore: 0,
        totalPossibleScore: 0,
      },
    );
  }

  private async getRecentAttempts(
    userId: string,
    query: RecentAttemptsQueryDto,
  ) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 5), 1), 50);
    const skip = (page - 1) * limit;

    const where = {
      userId,
      status: AttemptStatus.COMPLETED,
    };

    const [attempts, total] = await this.prisma.$transaction([
      this.prisma.testAttempt.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ completedAt: 'desc' }, { startedAt: 'desc' }],
        select: {
          id: true,
          testId: true,
          score: true,
          status: true,
          startedAt: true,
          completedAt: true,
          test: {
            select: {
              id: true,
              title: true,
              questions: {
                select: {
                  points: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.testAttempt.count({ where }),
    ]);

    return {
      attempts: attempts.map((attempt) => {
        const possibleScore = attempt.test.questions.reduce(
          (total, question) => total.plus(question.points),
          new Prisma.Decimal(0),
        );
        const scorePercent = possibleScore.gt(0)
          ? Math.round((Number(attempt.score) / Number(possibleScore)) * 100)
          : 0;

        return {
          id: attempt.id,
          testId: attempt.testId,
          title: attempt.test.title,
          attemptedAt: attempt.completedAt ?? attempt.startedAt,
          attemptedDate: this.formatDate(
            attempt.completedAt ?? attempt.startedAt,
          ),
          scorePercent,
          earnedScore: attempt.score,
          totalScore: possibleScore,
          result: scorePercent >= this.passingPercent ? 'PASSED' : 'FAILED',
        };
      }),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async getStudyStreak(userId: string) {
    const sessions = await this.prisma.userSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        createdAt: true,
        lastUsedAt: true,
      },
    });

    const loginDays = new Set<string>();
    for (const session of sessions) {
      loginDays.add(this.formatDate(session.createdAt));
      if (session.lastUsedAt) {
        loginDays.add(this.formatDate(session.lastUsedAt));
      }
    }

    const sortedDays = [...loginDays].sort();
    if (!sortedDays.length) {
      return {
        currentDays: 0,
        highestDays: 0,
      };
    }

    let highestDays = 1;
    let runningDays = 1;

    for (let index = 1; index < sortedDays.length; index++) {
      const previous = this.parseDate(sortedDays[index - 1]);
      const current = this.parseDate(sortedDays[index]);
      const dayDiff = Math.round(
        (current.getTime() - previous.getTime()) / 86_400_000,
      );

      if (dayDiff === 1) {
        runningDays += 1;
      } else {
        runningDays = 1;
      }

      highestDays = Math.max(highestDays, runningDays);
    }

    const today = this.formatDate(new Date());
    const yesterday = this.formatDate(
      new Date(Date.now() - 24 * 60 * 60 * 1000),
    );
    let currentDays = 0;
    const lastLoginDay = sortedDays[sortedDays.length - 1];

    if (lastLoginDay === today || lastLoginDay === yesterday) {
      currentDays = 1;
      for (let index = sortedDays.length - 1; index > 0; index--) {
        const current = this.parseDate(sortedDays[index]);
        const previous = this.parseDate(sortedDays[index - 1]);
        const dayDiff = Math.round(
          (current.getTime() - previous.getTime()) / 86_400_000,
        );

        if (dayDiff !== 1) break;
        currentDays += 1;
      }
    }

    return {
      currentDays,
      highestDays,
    };
  }

  private formatDate(date: Date) {
    return convertUTCToTimezone(date, this.timezone, 'yyyy-MM-dd')!;
  }

  private parseDate(value: string) {
    return new Date(`${value}T00:00:00.000Z`);
  }
}
