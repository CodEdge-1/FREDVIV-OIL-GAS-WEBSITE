import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService, SystemSettings } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch()
  updateSettings(@Body() dto: Partial<SystemSettings>) {
    return this.settingsService.updateSettings(dto);
  }
}
