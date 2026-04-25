export interface ImportProductFileLambdaProps {
  readonly allowedOrigin: string;
  readonly s3BucketName: string;
}

export interface ParseProductFileLambdaProps {
  readonly allowedOrigin: string;
  readonly s3BucketName: string;
  readonly s3BucketUploadedFolder: string;
}
