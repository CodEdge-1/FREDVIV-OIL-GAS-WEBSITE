import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { UserStatus } from '@prisma/client';

class UpdateStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;
}

class UpdatePasswordDto {
  @IsString()
  @MinLength(6)
  password: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id/notifications/unread-count')
  getUnreadNotificationCount(@Param('id') id: string) {
    return this.usersService.getUnreadNotificationCount(id);
  }

  @Get(':id/notifications')
  getUserNotifications(@Param('id') id: string) {
    return this.usersService.getUserNotifications(id);
  }

  @Patch(':id/notifications/mark-all-read')
  markAllNotificationsRead(@Param('id') id: string) {
    return this.usersService.markAllNotificationsRead(id);
  }

  @Patch(':id/notifications/:notifId')
  markNotificationRead(@Param('id') id: string, @Param('notifId') notifId: string, @Body() body: { read: boolean }) {
    return this.usersService.markNotificationRead(id, notifId, body.read);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const isSelf = req.user.id === id || req.user.userId === id || req.user.sub === id;
    const isAdmin = req.user.role === 'ADMIN';
    if (!isAdmin && !isSelf) {
      throw new ForbiddenException('Forbidden resource');
    }
    return this.usersService.findOne(id);
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    const isSelf = req.user.id === id || req.user.userId === id || req.user.sub === id;
    const isAdmin = req.user.role === 'ADMIN';
    if (!isAdmin && !isSelf) {
      throw new ForbiddenException('Forbidden resource');
    }
    if (!isAdmin && isSelf) {
      const selfDto: UpdateUserDto = {
        name: dto.name,
        phone: dto.phone,
      };
      return this.usersService.update(id, selfDto);
    }
    return this.usersService.update(id, dto);
  }

  @Roles('ADMIN')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.usersService.update(id, { status: dto.status });
  }

  @Patch(':id/password')
  updatePassword(@Param('id') id: string, @Body() dto: UpdatePasswordDto) {
    return this.usersService.updatePassword(id, dto.password);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
