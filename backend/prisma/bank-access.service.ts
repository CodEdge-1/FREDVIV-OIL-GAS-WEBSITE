import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service'; // Corrected import path
import { RequestStatus } from '@prisma/client'; // This should be correct if prisma generate is run
import * as crypto from 'crypto';

@Injectable()
export class BankAccessService {
  // In production, these should be in your .env file
  private readonly algorithm = 'aes-256-cbc';
  private readonly encryptionKey = Buffer.from(process.env.BANK_ENCRYPTION_KEY || '32_char_secret_key_for_aes_256_!!', 'utf8');

  constructor(private prisma: PrismaService) {}

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    const [ivHex, data] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async approveRequest(id: string, username: string, pass: string) {
    const request = await this.prisma.bankAccessRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Request not found');

    // Set 24-hour expiry "Hook"
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return this.prisma.bankAccessRequest.update({
      where: { id },
      data: {
        status: RequestStatus.APPROVED,
        loginUsername: username,
        loginPassword: this.encrypt(pass),
        approvedTime: new Date(),
        expiresAt,
      },
    });
  }

  async getActiveCredentials(id: string, requesterId: string) {
    const request = await this.prisma.bankAccessRequest.findFirst({
      where: { 
        id, 
        requesterId,
        status: RequestStatus.APPROVED,
        expiresAt: { gt: new Date() } // Automatic expiry check
      },
    });

    if (!request || !request.loginPassword) {
      throw new BadRequestException('Access expired or not approved');
    }

    return {
      username: request.loginUsername,
      password: this.decrypt(request.loginPassword),
    };
  }

  // Cleanup "Hook" - can be called by a Cron job
  async clearExpiredRequests() {
    return this.prisma.bankAccessRequest.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    });
  }
}