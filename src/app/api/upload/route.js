import { NextResponse } from 'next/server';
import { bucket } from '@/lib/firebaseAdmin';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs'; // Admin SDK requires Node runtime

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read incoming file into a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Destination path in your Firebase Storage bucket
    const folder = 'uploads';
    const safeName = file.name?.replace(/\s+/g, '_') || 'file';
    const destPath = `${folder}/${Date.now()}-${safeName}`;

    // Create a download token so we can return a direct HTTPS URL
    const token = randomUUID();

    // Save file to Storage with contentType and download token
    const gcsFile = bucket.file(destPath);
    await gcsFile.save(buffer, {
      resumable: false,
      metadata: {
        contentType: file.type || 'application/octet-stream',
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
    });

    // Public download URL using the token (no need to make the object public)
    const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      destPath
    )}?alt=media&token=${token}`;

    return NextResponse.json({ url: fileUrl, path: destPath });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
