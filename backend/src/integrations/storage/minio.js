import * as Minio from 'minio'

let minioClient = null

export function getMinioClient() {
  if (!minioClient) {
    minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: Number(process.env.MINIO_PORT) || 9000,
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY || 'minio_admin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minio_pass_2024',
    })
  }
  return minioClient
}

export async function uploadFile(key, buffer, contentType) {
  const client = getMinioClient()
  const bucket = process.env.MINIO_BUCKET || 'juridico-docs'

  const exists = await client.bucketExists(bucket)
  if (!exists) {
    await client.makeBucket(bucket)
    await client.setBucketPolicy(bucket, JSON.stringify({
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/public/*`],
      }],
    }))
  }

  await client.putObject(bucket, key, buffer, buffer.length, { 'Content-Type': contentType })
  return key
}

export async function getSignedUrl(key, expiry = 3600) {
  const client = getMinioClient()
  const bucket = process.env.MINIO_BUCKET || 'juridico-docs'
  return client.presignedGetObject(bucket, key, expiry)
}

export async function deleteFile(key) {
  const client = getMinioClient()
  const bucket = process.env.MINIO_BUCKET || 'juridico-docs'
  await client.removeObject(bucket, key)
}
