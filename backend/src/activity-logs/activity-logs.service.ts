import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityType } from '@prisma/client';

@Injectable()
export class ActivityLogsService {
  constructor(private prisma: PrismaService) {}

  create(createActivityLogDto: any) {
    let type: ActivityType = ActivityType.USER;
    if (createActivityLogDto.type) {
      const typeStr = createActivityLogDto.type.toUpperCase();
      if (['EXPENSE', 'PRICE', 'BALANCE', 'SECURITY', 'USER'].includes(typeStr)) {
        type = typeStr as ActivityType;
      }
    }
    
    // Some routes try to pass 'admin' as userId if they don't have it, but it must be a valid uuid or we should use a default admin id.
    // For now we'll fetch an admin user if 'admin' is passed.
    return this.prisma.user.findFirst({ where: { role: 'ADMIN' } }).then(admin => {
      const userId = createActivityLogDto.userId === 'admin' ? (admin?.id || createActivityLogDto.userId) : createActivityLogDto.userId;
      
      return this.prisma.activityLog.create({
        data: {
          userId: userId,
          action: createActivityLogDto.action,
          type: type,
          details: createActivityLogDto.details,
        }
      }).catch(err => {
          console.error("Failed to create activity log: ", err);
      });
    });
  }

  async findAll() {
    const logs = await this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return logs.map((log) => ({
      ...log,
      time: log.createdAt.toISOString(),
    }));
  }

  findOne(id: string) {
    return this.prisma.activityLog.findUnique({ where: { id } });
  }

  remove(id: string) {
    return this.prisma.activityLog.delete({ where: { id } });
  }
}
