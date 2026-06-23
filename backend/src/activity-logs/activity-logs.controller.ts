import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';

@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Post()
  create(@Body() createActivityLogDto: any) {
    return this.activityLogsService.create(createActivityLogDto);
  }

  @Get()
  findAll() {
    return this.activityLogsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activityLogsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activityLogsService.remove(id);
  }
}
