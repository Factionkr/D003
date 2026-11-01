import sharp from 'sharp';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const SNAPSHOT_WIDTH = 1080;
const SNAPSHOT_HEIGHT = 1440;
const THUMB_WIDTH = 300;
const THUMB_HEIGHT = 400;
const WEBP_QUALITY = 85;

export class ImageProcessingService {
  private s3: S3Client;
  private bucket: string;
  private cdnBaseUrl: string;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION || 'ap-northeast-2',
    });
    this.bucket = process.env.S3_BUCKET || 'fit-archive-images';
    this.cdnBaseUrl = process.env.CDN_BASE_URL || `https://${this.bucket}.s3.amazonaws.com`;
  }

  /**
   * 원본 이미지를 처리 → 고해상도(1080x1440) + 썸네일(300x400) WebP 변환 후 S3 업로드
   * @param sourceUrlOrBase64 원본 이미지 URL 또는 base64 문자열
   * @returns snapshotUrl, thumbnailUrl (CDN URLs)
   */
  async processAndUpload(sourceUrlOrBase64: string): Promise<{
    snapshotUrl: string;
    thumbnailUrl: string;
  }> {
    let imageBuffer: Buffer;

    if (sourceUrlOrBase64.startsWith('data:') || !sourceUrlOrBase64.startsWith('http')) {
      // Base64 디코딩
      const base64Data = sourceUrlOrBase64.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // URL에서 다운로드
      const response = await fetch(sourceUrlOrBase64);
      if (!response.ok) {
        throw new Error(`이미지 다운로드 실패: ${response.statusText}`);
      }
      imageBuffer = Buffer.from(await response.arrayBuffer());
    }

    const fileId = uuidv4();
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '/');

    // 고해상도 스냅샷 (1080x1440, 4:3 비율)
    const snapshotBuffer = await sharp(imageBuffer)
      .resize(SNAPSHOT_WIDTH, SNAPSHOT_HEIGHT, { fit: 'cover', position: 'center' })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    const snapshotKey = `snapshots/${datePrefix}/${fileId}_full.webp`;
    await this.uploadToS3(snapshotKey, snapshotBuffer, 'image/webp');

    // 썸네일 (300x400)
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: 'cover', position: 'center' })
      .webp({ quality: 70 })
      .toBuffer();

    const thumbnailKey = `thumbnails/${datePrefix}/${fileId}_thumb.webp`;
    await this.uploadToS3(thumbnailKey, thumbnailBuffer, 'image/webp');

    return {
      snapshotUrl: `${this.cdnBaseUrl}/${snapshotKey}`,
      thumbnailUrl: `${this.cdnBaseUrl}/${thumbnailKey}`,
    };
  }

  /**
   * S3 Presigned URL 생성 (읽기 전용)
   */
  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  /**
   * CDN 이미지 삭제
   */
  async deleteImages(...urls: string[]): Promise<void> {
    const deletePromises = urls.map((url) => {
      const key = url.replace(`${this.cdnBaseUrl}/`, '');
      return this.s3
        .send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
          })
        )
        .catch(() => {}); // 삭제 실패 무시
    });
    await Promise.all(deletePromises);
  }

  private async uploadToS3(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000',
      })
    );
  }
}

