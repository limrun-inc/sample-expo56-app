import * as SQLite from 'expo-sqlite';

import { generateSeedData, USERS } from './mock-data';
import type { ActivityEvent, Comment, Post } from './types';

const DATABASE_NAME = 'benchmark-social.db';
const SCHEMA_VERSION = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate();
  }
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion < SCHEMA_VERSION) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY NOT NULL,
          handle TEXT NOT NULL,
          display_name TEXT NOT NULL,
          avatar_url TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS posts (
          id TEXT PRIMARY KEY NOT NULL,
          author_id TEXT NOT NULL REFERENCES users(id),
          caption TEXT NOT NULL,
          image_url TEXT NOT NULL,
          image_aspect_ratio REAL NOT NULL DEFAULT 1,
          like_count INTEGER NOT NULL DEFAULT 0,
          liked_by_me INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
        CREATE TABLE IF NOT EXISTS comments (
          id TEXT PRIMARY KEY NOT NULL,
          post_id TEXT NOT NULL REFERENCES posts(id),
          author_handle TEXT NOT NULL,
          body TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at);
        CREATE TABLE IF NOT EXISTS activity_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          kind TEXT NOT NULL,
          detail TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(caption, content='posts', content_rowid='rowid');
      `);
      await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    });
    await seedIfEmpty(db);
  }

  return db;
}

async function seedIfEmpty(db: SQLite.SQLiteDatabase) {
  const count = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM posts');
  if ((count?.n ?? 0) > 0) return;

  const { posts, comments } = generateSeedData();

  await db.withTransactionAsync(async () => {
    const userStmt = await db.prepareAsync(
      'INSERT OR REPLACE INTO users (id, handle, display_name, avatar_url) VALUES ($id, $handle, $name, $avatar)'
    );
    try {
      for (const user of USERS) {
        await userStmt.executeAsync({
          $id: user.id,
          $handle: user.handle,
          $name: user.displayName,
          $avatar: user.avatarUrl,
        });
      }
    } finally {
      await userStmt.finalizeAsync();
    }

    const postStmt = await db.prepareAsync(
      `INSERT INTO posts (id, author_id, caption, image_url, image_aspect_ratio, like_count, created_at)
       VALUES ($id, $authorId, $caption, $imageUrl, $aspect, $likes, $createdAt)`
    );
    try {
      for (const post of posts) {
        await postStmt.executeAsync({
          $id: post.id,
          $authorId: post.authorId,
          $caption: post.caption,
          $imageUrl: post.imageUrl,
          $aspect: post.imageAspectRatio,
          $likes: post.likeCount,
          $createdAt: post.createdAt,
        });
      }
    } finally {
      await postStmt.finalizeAsync();
    }

    const commentStmt = await db.prepareAsync(
      `INSERT INTO comments (id, post_id, author_handle, body, created_at)
       VALUES ($id, $postId, $handle, $body, $createdAt)`
    );
    try {
      for (const comment of comments) {
        await commentStmt.executeAsync({
          $id: comment.id,
          $postId: comment.postId,
          $handle: comment.authorHandle,
          $body: comment.body,
          $createdAt: comment.createdAt,
        });
      }
    } finally {
      await commentStmt.finalizeAsync();
    }

    await db.execAsync(`INSERT INTO posts_fts(rowid, caption) SELECT rowid, caption FROM posts`);
  });
}

type PostRow = {
  id: string;
  author_id: string;
  caption: string;
  image_url: string;
  image_aspect_ratio: number;
  like_count: number;
  liked_by_me: number;
  created_at: number;
  handle: string;
  display_name: string;
  avatar_url: string;
  comment_count: number;
};

function rowToPost(row: PostRow): Post {
  return {
    id: row.id,
    authorId: row.author_id,
    authorHandle: row.handle,
    authorName: row.display_name,
    avatarUrl: row.avatar_url,
    caption: row.caption,
    imageUrl: row.image_url,
    imageAspectRatio: row.image_aspect_ratio,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    likedByMe: row.liked_by_me === 1,
    createdAt: row.created_at,
  };
}

const POST_SELECT = `
  SELECT posts.*, users.handle, users.display_name, users.avatar_url,
    (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS comment_count
  FROM posts JOIN users ON users.id = posts.author_id
`;

export async function fetchPostsPage(offset: number, limit: number): Promise<Post[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<PostRow>(
    `${POST_SELECT} ORDER BY posts.created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows.map(rowToPost);
}

export async function fetchPost(id: string): Promise<Post | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<PostRow>(`${POST_SELECT} WHERE posts.id = ?`, [id]);
  return row ? rowToPost(row) : null;
}

export async function searchPosts(query: string): Promise<Post[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<PostRow>(
    `${POST_SELECT} WHERE posts.rowid IN (SELECT rowid FROM posts_fts WHERE posts_fts MATCH ?) LIMIT 30`,
    [`${query.replaceAll('"', '')}*`]
  );
  return rows.map(rowToPost);
}

export async function toggleLike(postId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE posts SET
       liked_by_me = 1 - liked_by_me,
       like_count = like_count + CASE WHEN liked_by_me = 1 THEN -1 ELSE 1 END
     WHERE id = ?`,
    [postId]
  );
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    post_id: string;
    author_handle: string;
    body: string;
    created_at: number;
  }>('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC', [postId]);
  return rows.map((row) => ({
    id: row.id,
    postId: row.post_id,
    authorHandle: row.author_handle,
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function addComment(postId: string, authorHandle: string, body: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO comments (id, post_id, author_handle, body, created_at) VALUES (?, ?, ?, ?, ?)',
    [`comment-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, postId, authorHandle, body, Date.now()]
  );
}

export async function insertPost(input: {
  caption: string;
  imageUrl: string;
  imageAspectRatio: number;
}): Promise<string> {
  const db = await getDb();
  const id = `post-local-${Date.now()}`;
  await db.runAsync(
    `INSERT INTO posts (id, author_id, caption, image_url, image_aspect_ratio, like_count, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [id, USERS[0].id, input.caption, input.imageUrl, input.imageAspectRatio, Date.now()]
  );
  await db.runAsync(
    `INSERT INTO posts_fts(rowid, caption) SELECT rowid, caption FROM posts WHERE id = ?`,
    [id]
  );
  return id;
}

export async function logActivity(kind: string, detail: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT INTO activity_log (kind, detail, created_at) VALUES (?, ?, ?)', [
    kind,
    detail,
    Date.now(),
  ]);
}

export async function fetchActivity(limit = 50): Promise<ActivityEvent[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: number; kind: string; detail: string; created_at: number }>(
    'SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  return rows.map((row) => ({ id: row.id, kind: row.kind, detail: row.detail, createdAt: row.created_at }));
}

export async function getDbStats(): Promise<{ posts: number; comments: number; activity: number }> {
  const db = await getDb();
  const posts = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM posts');
  const comments = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM comments');
  const activity = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM activity_log');
  return { posts: posts?.n ?? 0, comments: comments?.n ?? 0, activity: activity?.n ?? 0 };
}
