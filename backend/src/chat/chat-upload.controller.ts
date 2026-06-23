import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { v4 as uuidv4 } from 'uuid';
import * as fsLib from 'fs';
import * as pathLib from 'path';

const s3Config = process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY && process.env.S3_BUCKET 
  ? new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
      },
    })
  : null;

const uploadDir = pathLib.join(process.cwd(), 'uploads');
if (!s3Config && !fsLib.existsSync(uploadDir)) {
  fsLib.mkdirSync(uploadDir, { recursive: true });
}

const storageEngine = s3Config
  ? multerS3({
      s3: s3Config,
      bucket: process.env.S3_BUCKET,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const uniqueSuffix = uuidv4();
        const ext = extname(file.originalname);
        cb(null, 'chat-attachments/' + uniqueSuffix + ext);
      },
    })
  : diskStorage({
      destination: uploadDir,
      filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4();
        const ext = extname(file.originalname);
        cb(null, uniqueSuffix + ext);
      },
    });

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatUploadController {
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: storageEngine,
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    let fileUrl = '';

    if (file.location) {
      if (process.env.S3_PUBLIC_URL) {
        const baseUrl = process.env.S3_PUBLIC_URL.replace(/\/$/, '');
        fileUrl = baseUrl + '/' + file.key;
      } else {
        fileUrl = file.location;
      }
    } else {
      const baseUrl = process.env.API_URL || 'http://localhost:3001';
      fileUrl = baseUrl + '/uploads/' + file.filename;
    }

    return {
      url: fileUrl,
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
    };
  }
}
