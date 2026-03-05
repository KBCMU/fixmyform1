/**
 * D1 Database utilities and schema
 */

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Result<T = unknown> {
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
    last_row_id: number;
    changes: number;
  };
  results: T[];
}

/**
 * Initialize database schema
 * Run this migration to set up tables
 */
export const INIT_SCHEMA = `
  -- Analysis history table
  CREATE TABLE IF NOT EXISTS analysis_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    user_id TEXT,
    exercise_type TEXT NOT NULL,
    form_score INTEGER NOT NULL,
    video_url TEXT,
    created_at INTEGER NOT NULL
  );

  -- User sessions table
  CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    exercise_type TEXT,
    video_url TEXT,
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  -- Reference exercises metadata
  CREATE TABLE IF NOT EXISTS reference_exercises (
    id TEXT PRIMARY KEY,
    exercise_type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    difficulty TEXT,
    vectorize_id TEXT,
    created_at INTEGER NOT NULL
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_analysis_user ON analysis_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_analysis_created ON analysis_history(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
`;

export class D1Service {
  constructor(private db: D1Database) {}

  /**
   * Initialize database schema
   */
  async initSchema(): Promise<void> {
    await this.db.prepare(INIT_SCHEMA).run();
  }

  /**
   * Store analysis result
   */
  async storeAnalysis(analysis: {
    sessionId: string;
    userId?: string;
    exerciseType: string;
    formScore: number;
    videoUrl?: string;
  }): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO analysis_history (session_id, user_id, exercise_type, form_score, video_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        analysis.sessionId,
        analysis.userId || null,
        analysis.exerciseType,
        analysis.formScore,
        analysis.videoUrl || null,
        Date.now()
      )
      .run();
  }

  /**
   * Get user's analysis history
   */
  async getAnalysisHistory(
    userId: string,
    limit: number = 10
  ): Promise<unknown[]> {
    const result = await this.db
      .prepare(
        `SELECT * FROM analysis_history 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`
      )
      .bind(userId, limit)
      .all();

    return result.results;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<unknown | null> {
    const result = await this.db
      .prepare(`SELECT * FROM user_sessions WHERE id = ?`)
      .bind(sessionId)
      .first();

    return result;
  }

  /**
   * Create or update session
   */
  async upsertSession(session: {
    id: string;
    userId?: string;
    exerciseType?: string;
    videoUrl?: string;
    status: string;
  }): Promise<void> {
    const existing = await this.getSession(session.id);
    const now = Date.now();

    if (existing) {
      await this.db
        .prepare(
          `UPDATE user_sessions 
           SET user_id = ?, exercise_type = ?, video_url = ?, status = ?, updated_at = ?
           WHERE id = ?`
        )
        .bind(
          session.userId || null,
          session.exerciseType || null,
          session.videoUrl || null,
          session.status,
          now,
          session.id
        )
        .run();
    } else {
      await this.db
        .prepare(
          `INSERT INTO user_sessions (id, user_id, exercise_type, video_url, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          session.id,
          session.userId || null,
          session.exerciseType || null,
          session.videoUrl || null,
          session.status,
          now,
          now
        )
        .run();
    }
  }
}

