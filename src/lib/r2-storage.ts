/**
 * R2 Storage utilities for video uploads
 */

export interface R2UploadOptions {
  key: string;
  body: ReadableStream | ArrayBuffer | string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export class R2Storage {
  constructor(private r2: R2Bucket) {}

  /**
   * Upload a video file to R2
   */
  async uploadVideo(options: R2UploadOptions): Promise<string> {
    const { key, body, contentType, metadata } = options;

    await this.r2.put(key, body, {
      httpMetadata: {
        contentType: contentType || "video/mp4",
        cacheControl: "public, max-age=31536000",
      },
      customMetadata: metadata || {},
    });

    // Return the public URL (you'll need to configure R2 public access or use signed URLs)
    return `/videos/${key}`;
  }

  /**
   * Get a signed URL for video access
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // R2 signed URLs would be generated here
    // For now, return a placeholder
    return `/videos/${key}`;
  }

  /**
   * Delete a video from R2
   */
  async deleteVideo(key: string): Promise<void> {
    await this.r2.delete(key);
  }

  /**
   * Check if a video exists
   */
  async videoExists(key: string): Promise<boolean> {
    const object = await this.r2.head(key);
    return object !== null;
  }
}

