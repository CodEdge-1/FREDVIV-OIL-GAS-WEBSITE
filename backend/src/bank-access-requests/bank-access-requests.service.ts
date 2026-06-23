import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class BankAccessRequestsService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly encryptionKey: Buffer;

  constructor(private prisma: PrismaService) {
    const key = process.env.BANK_ENCRYPTION_KEY || '32_char_secret_key_for_aes_256_!!';
    // Ensure the key is exactly 32 bytes for AES-256
    this.encryptionKey = Buffer.alloc(32);
    Buffer.from(key, 'utf8').copy(this.encryptionKey);
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    const [ivHex, data] = encryptedText.split(':');
    if (!ivHex || !data) {
      throw new Error('Invalid encrypted text format');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async create(requesterId: string, bankId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: requesterId } });
    if (!user) throw new NotFoundException('User not found');

    // Check if there is already an active or pending request
    const existing = await this.prisma.bankAccessRequest.findFirst({
      where: {
        requesterId,
        bankId,
        status: { in: [RequestStatus.PENDING, RequestStatus.APPROVED] },
      },
    });

    if (existing) {
      const isExpired = existing.status === RequestStatus.APPROVED && existing.expiresAt && new Date(existing.expiresAt) < new Date();
      if (isExpired) {
        // Delete expired request to avoid clogging table
        await this.prisma.bankAccessRequest.delete({ where: { id: existing.id } });
      } else {
        throw new BadRequestException('You already have a pending or active request for this bank');
      }
    }

    const bankName = bankId === 'uba' ? 'UBA Bank' : bankId === 'zenith' ? 'Zenith Bank' : bankId;

    return this.prisma.bankAccessRequest.create({
      data: {
        requesterId,
        bankId,
        bankName,
        status: RequestStatus.PENDING,
      },
    });
  }

  async findAllUserRequests(userId: string) {
    const requests = await this.prisma.bankAccessRequest.findMany({
      where: { requesterId: userId },
      include: { requester: true },
      orderBy: { requestTime: 'desc' },
    });

    return requests.map((r) => {
      return {
        id: r.id,
        bankId: r.bankId,
        bankName: r.bankName,
        status: r.status,
        requestTime: r.requestTime.toISOString(),
        approvedTime: r.approvedTime?.toISOString() || null,
        expiresAt: r.expiresAt?.toISOString() || null,
        loginUsername: null,
        loginPassword: null,
        requesterId: r.requesterId,
        requester: r.requester.name,
        role: r.requester.role,
      };
    });
  }

  async findPendingRequests() {
    const requests = await this.prisma.bankAccessRequest.findMany({
      where: { status: RequestStatus.PENDING },
      include: { requester: true },
      orderBy: { requestTime: 'desc' },
    });

    return requests.map((r) => ({
      id: r.id,
      bankId: r.bankId,
      bankName: r.bankName,
      status: r.status,
      requestTime: r.requestTime.toISOString(),
      requesterId: r.requesterId,
      requester: r.requester.name,
      role: r.requester.role,
    }));
  }

  async approveRequest(id: string, username?: string, pass?: string) {
    const request = await this.prisma.bankAccessRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Request not found');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return this.prisma.bankAccessRequest.update({
      where: { id },
      data: {
        status: RequestStatus.APPROVED,
        loginUsername: null,
        loginPassword: null,
        approvedTime: new Date(),
        expiresAt,
      },
    });
  }

  async rejectRequest(id: string) {
    const request = await this.prisma.bankAccessRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Request not found');

    return this.prisma.bankAccessRequest.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
      },
    });
  }

  async clearExpiredRequests() {
    return this.prisma.bankAccessRequest.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
