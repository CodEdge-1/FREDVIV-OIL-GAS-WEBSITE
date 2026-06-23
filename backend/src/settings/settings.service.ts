import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface SystemSettings {
  companyName: string;
  reportDeadline: string;
  balanceDuration: string;
  pinLength: string;
  timezone: string;
  currency: string;
  sessionTimeout: string;
  requirePinForBalance: boolean;
  logActivity: boolean;
  twoFactor: boolean;
}

@Injectable()
export class SettingsService {
  private filePath = path.join(process.cwd(), 'settings.json');

  private defaultSettings: SystemSettings = {
    companyName: 'Fredviv Oil and Gas Limited',
    reportDeadline: '18:00',
    balanceDuration: '30',
    pinLength: '6',
    timezone: 'Africa/Lagos',
    currency: 'NGN',
    sessionTimeout: '60',
    requirePinForBalance: true,
    logActivity: true,
    twoFactor: false,
  };

  getSettings(): SystemSettings {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        return { ...this.defaultSettings, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Failed to read settings file:', error);
    }
    return this.defaultSettings;
  }

  updateSettings(dto: Partial<SystemSettings>): SystemSettings {
    const current = this.getSettings();
    const updated = { ...current, ...dto };
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(updated, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to write settings file:', error);
    }
    return updated;
  }
}
