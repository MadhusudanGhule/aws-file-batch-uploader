import express from 'express';
import cors from 'cors';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'uploads.db'));

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS upload_sessions (
    session_id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    total_chunks INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS upload_chunks (
    session_id TEXT,
    chunk_index INTEGER,
    completed BOOLEAN DEFAULT FALSE,
    completed_at DATETIME,
    PRIMARY KEY (session_id, chunk_index),
    FOREIGN KEY (session_id) REFERENCES upload_sessions(session_id)
  );
`);

const app = express();
app.use(cors());
app.use(express.json());

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// Initialize upload session
app.post('/init-upload', (req, res) => {
  const { fileName, fileSize, totalChunks } = req.body;
  const sessionId = Math.random().toString(36).substring(2, 15);

  try {
    db.prepare(`
      INSERT INTO upload_sessions (session_id, file_name, file_size, total_chunks)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, fileName, fileSize, totalChunks);

    // Initialize chunk tracking
    const insertChunk = db.prepare(`
      INSERT INTO upload_chunks (session_id, chunk_index)
      VALUES (?, ?)
    `);

    for (let i = 0; i < totalChunks; i++) {
      insertChunk.run(sessionId, i);
    }

    res.json({ sessionId });
  } catch (error) {
    console.error('Failed to initialize upload:', error);
    res.status(500).json({ error: 'Failed to initialize upload' });
  }
});

// Generate presigned URL for chunk upload
app.post('/presigned-url', async (req, res) => {
  const { fileName, chunkIndex, sessionId } = req.body;
  const key = `${sessionId}/${fileName}.part${chunkIndex}`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    res.json({ presignedUrl });
  } catch (error) {
    console.error('Failed to generate presigned URL:', error);
    res.status(500).json({ error: 'Failed to generate presigned URL' });
  }
});

// Mark chunk as completed
app.post('/chunk-completed', (req, res) => {
  const { sessionId, chunkIndex } = req.body;

  try {
    db.prepare(`
      UPDATE upload_chunks
      SET completed = TRUE, completed_at = CURRENT_TIMESTAMP
      WHERE session_id = ? AND chunk_index = ?
    `).run(sessionId, chunkIndex);

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to mark chunk as completed:', error);
    res.status(500).json({ error: 'Failed to mark chunk as completed' });
  }
});

// Verify upload completion
app.post('/verify-upload', (req, res) => {
  const { sessionId } = req.body;

  try {
    const totalChunks = db.prepare(`
      SELECT total_chunks FROM upload_sessions WHERE session_id = ?
    `).get(sessionId).total_chunks;

    const completedChunks = db.prepare(`
      SELECT COUNT(*) as count FROM upload_chunks
      WHERE session_id = ? AND completed = TRUE
    `).get(sessionId).count;

    if (completedChunks === totalChunks) {
      db.prepare(`
        UPDATE upload_sessions
        SET completed_at = CURRENT_TIMESTAMP
        WHERE session_id = ?
      `).run(sessionId);

      res.json({ completed: true });
    } else {
      res.json({ completed: false, progress: completedChunks / totalChunks });
    }
  } catch (error) {
    console.error('Failed to verify upload:', error);
    res.status(500).json({ error: 'Failed to verify upload' });
  }
});

// Get upload session status
app.get('/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = db.prepare(`
      SELECT * FROM upload_sessions WHERE session_id = ?
    `).get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const completedChunks = db.prepare(`
      SELECT chunk_index FROM upload_chunks
      WHERE session_id = ? AND completed = TRUE
    `).all(sessionId).map(row => row.chunk_index);

    res.json({
      ...session,
      completedChunks,
    });
  } catch (error) {
    console.error('Failed to get session status:', error);
    res.status(500).json({ error: 'Failed to get session status' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});