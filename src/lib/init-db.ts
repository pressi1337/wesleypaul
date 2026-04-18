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

    // Performance indexes — idempotent (IF NOT EXISTS)
    await conn.query(`ALTER TABLE posts ADD INDEX IF NOT EXISTS idx_posts_type_status (post_type, status)`).catch(() => {});
    await conn.query(`ALTER TABLE posts ADD INDEX IF NOT EXISTS idx_posts_slug (slug(191))`).catch(() => {});
    await conn.query(`ALTER TABLE page_sections ADD INDEX IF NOT EXISTS idx_sections_page (page_id)`).catch(() => {});
    await conn.query(`ALTER TABLE form_submissions ADD INDEX IF NOT EXISTS idx_fsub_form (form_id)`).catch(() => {});
    await conn.query(`ALTER TABLE nav_items ADD INDEX IF NOT EXISTS idx_nav_parent (parent_id)`).catch(() => {});

    // ── Analytics: page visit tracking ───────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS analytics_visits (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        session_id   VARCHAR(64)  NOT NULL,
        page_path    VARCHAR(500) NOT NULL,
        ip_address   VARCHAR(50)  NOT NULL DEFAULT '',
        user_agent   VARCHAR(500) DEFAULT '',
        referrer     VARCHAR(500) DEFAULT '',
        country      VARCHAR(100) DEFAULT '',
        region       VARCHAR(100) DEFAULT '',
        city         VARCHAR(100) DEFAULT '',
        lat          DECIMAL(9,6) NULL,
        lng          DECIMAL(9,6) NULL,
        time_spent_s INT          DEFAULT 0,
        is_bot       TINYINT(1)   DEFAULT 0,
        created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_av_session  (session_id),
        INDEX idx_av_created  (created_at),
        INDEX idx_av_ip       (ip_address(20)),
        INDEX idx_av_page     (page_path(100))
      )
    `);

    // ── IP geolocation cache ──────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS ip_geocache (
        ip_address VARCHAR(50) NOT NULL,
        country    VARCHAR(100) DEFAULT '',
        region     VARCHAR(100) DEFAULT '',
        city       VARCHAR(100) DEFAULT '',
        lat        DECIMAL(9,6) NULL,
        lng        DECIMAL(9,6) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (ip_address)
      )
    `);

    // ── Audit log ─────────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        admin_id        INT          NULL,
        admin_username  VARCHAR(100) NOT NULL DEFAULT '',
        action          VARCHAR(100) NOT NULL,
        resource_type   VARCHAR(100) NOT NULL DEFAULT '',
        resource_id     VARCHAR(100) DEFAULT '',
        details         TEXT         DEFAULT '',
        ip_address      VARCHAR(50)  DEFAULT '',
        created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_al_created (created_at),
        INDEX idx_al_admin   (admin_id),
        INDEX idx_al_action  (action(50))
      )
    `);

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
