/**
 * init-db.ts — lazy, once-per-process table creation.
 * Import and call `ensureTables()` at the top of any API route that
 * uses tables that may not exist in older DB installations.
 */
import pool from "./db";

let initialized = false;

export async function ensureTables() {
  if (initialized) return;
  initialized = true;

  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        post_type ENUM('blog','news','event') DEFAULT 'blog',
        excerpt TEXT,
        content TEXT,
        featured_image VARCHAR(500) DEFAULT '',
        status ENUM('draft','published') DEFAULT 'draft',
        event_date DATETIME NULL,
        tags VARCHAR(500) DEFAULT '',
        author VARCHAR(255) DEFAULT 'Wesley Paul Ministries',
        translations_json TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Add translations_json to existing posts tables that predate this column.
    // MySQL 5.7 doesn't support ADD COLUMN IF NOT EXISTS, so check INFORMATION_SCHEMA first.
    const [trColRows] = await conn.query(`
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'posts'
        AND COLUMN_NAME = 'translations_json'
      LIMIT 1
    `);
    if ((trColRows as unknown[]).length === 0) {
      await conn.query(`ALTER TABLE posts ADD COLUMN translations_json TEXT NULL`);
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS forms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        fields_json JSON DEFAULT (JSON_ARRAY()),
        success_message VARCHAR(500) DEFAULT 'Thank you! Your response has been submitted.',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS form_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        form_id INT NOT NULL,
        form_name VARCHAR(255) DEFAULT '',
        data_json JSON NOT NULL,
        status ENUM('new','read') DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS nav_translations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nav_item_id INT NOT NULL,
        language_code VARCHAR(10) NOT NULL,
        translated_label VARCHAR(255) NOT NULL,
        UNIQUE KEY uq_nav_tr (nav_item_id, language_code),
        FOREIGN KEY (nav_item_id) REFERENCES nav_items(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS footer_translations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        language_code VARCHAR(10) UNIQUE NOT NULL,
        content_json TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Ensure media table exists (may also be created by setup route, this is idempotent)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS media (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255),
        file_path VARCHAR(500) NOT NULL,
        file_size INT DEFAULT 0,
        mime_type VARCHAR(100) DEFAULT '',
        alt_text VARCHAR(500) DEFAULT '',
        width INT DEFAULT 0,
        height INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add unique index on file_path so INSERT IGNORE deduplicates safely
    await conn.query(
      `ALTER TABLE media ADD UNIQUE INDEX IF NOT EXISTS uq_file_path (file_path(255))`
    ).catch(() => { /* ignore if already exists or old MySQL */ });

    // Seed home page if it doesn't exist yet
    await conn.query(`
      INSERT IGNORE INTO pages (title, slug, layout, status, meta_title, meta_description)
      VALUES (
        'Home',
        'home',
        'standard',
        'published',
        'Wesley Paul International Ministries',
        'A global evangelistic ministry committed to proclaiming the message of Jesus Christ.'
      )
    `);
  } finally {
    conn.release();
  }
}

/** Call this from the admin pages API so home page always exists */
export async function ensureHomePage() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      INSERT IGNORE INTO pages (title, slug, layout, status, meta_title, meta_description)
      VALUES (
        'Home',
        'home',
        'standard',
        'published',
        'Wesley Paul International Ministries',
        'A global evangelistic ministry committed to proclaiming the message of Jesus Christ.'
      )
    `);
  } finally {
    conn.release();
  }
}
