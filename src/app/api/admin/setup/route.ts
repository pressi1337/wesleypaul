import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

export async function GET() {
  let connection;
  try {
    // Connect without specifying database first to create it
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'password',
    });

    await connection.query('CREATE DATABASE IF NOT EXISTS wesleypaul_cms');
    await connection.query('USE wesleypaul_cms');

    // Create tables (use query() for DDL — execute() uses prepared statements which don't support some DDL)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        layout ENUM('standard','gallery') DEFAULT 'standard',
        status ENUM('draft','published') DEFAULT 'draft',
        meta_title VARCHAR(255),
        meta_description TEXT,
        meta_keywords VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS page_sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_id INT NOT NULL,
        section_type VARCHAR(50) NOT NULL,
        sort_order INT DEFAULT 0,
        content_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS translations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_id INT NOT NULL,
        language_code VARCHAR(10) NOT NULL,
        field_key VARCHAR(100) NOT NULL,
        content TEXT,
        status ENUM('pending','reviewed') DEFAULT 'pending',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_translation (page_id, language_code, field_key),
        FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS email_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        smtp_host VARCHAR(255),
        smtp_port INT DEFAULT 587,
        smtp_user VARCHAR(255),
        smtp_password VARCHAR(255),
        from_email VARCHAR(255),
        from_name VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS analytics_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ga_tracking_id VARCHAR(100),
        fb_pixel_id VARCHAR(100),
        gtm_id VARCHAR(100),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS media (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255),
        file_path VARCHAR(500) NOT NULL,
        file_size INT,
        mime_type VARCHAR(100),
        alt_text VARCHAR(500) DEFAULT '',
        width INT DEFAULT 0,
        height INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS section_translations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        section_id INT NOT NULL,
        language_code VARCHAR(10) NOT NULL,
        content_json TEXT NOT NULL,
        status ENUM('pending','reviewed') DEFAULT 'pending',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_sec_tr (section_id, language_code),
        FOREIGN KEY (section_id) REFERENCES page_sections(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS nav_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        label VARCHAR(100) NOT NULL,
        href VARCHAR(500) NOT NULL DEFAULT '/',
        parent_id INT DEFAULT NULL,
        sort_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        open_new_tab TINYINT(1) DEFAULT 0,
        FOREIGN KEY (parent_id) REFERENCES nav_items(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS site_content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content_key VARCHAR(100) UNIQUE NOT NULL,
        content_json LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS contact_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        status ENUM('new','read','replied') DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS booking_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(100),
        organization VARCHAR(255),
        event_type VARCHAR(255),
        location VARCHAR(255),
        preferred_dates TEXT,
        message TEXT,
        status ENUM('new','in_review','confirmed','declined') DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS forms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        fields_json TEXT NOT NULL DEFAULT '[]',
        success_message TEXT DEFAULT 'Thank you! Your submission has been received.',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS form_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        form_id INT NOT NULL,
        form_name VARCHAR(255),
        data_json TEXT NOT NULL,
        status ENUM('new','read') DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS nav_translations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nav_item_id INT NOT NULL,
        language_code VARCHAR(10) NOT NULL,
        translated_label VARCHAR(255) NOT NULL,
        UNIQUE KEY unique_nav_tr (nav_item_id, language_code),
        FOREIGN KEY (nav_item_id) REFERENCES nav_items(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS footer_translations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        language_code VARCHAR(10) NOT NULL UNIQUE,
        content_json TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES
      ('site_title', 'Wesley Paul International Ministries'),
      ('site_tagline', 'Surrendered Lives, Eternal Purpose'),
      ('site_description', 'A global evangelistic ministry'),
      ('contact_email', 'info@wesleypaul.org'),
      ('contact_phone', '+1 (859) 806-6424'),
      ('facebook_url', 'https://www.facebook.com/wesleypaul.org/'),
      ('youtube_url', 'https://www.youtube.com/@DrWesleyPaul'),
      ('instagram_url', 'https://www.instagram.com/drwesleypaul/')
    `);

    // ── Seed nav_items (only if table is empty) ───────────────────────────
    const [navCount] = await connection.query('SELECT COUNT(*) as cnt FROM nav_items');
    if ((navCount as { cnt: number }[])[0].cnt === 0) {
      // Top-level items
      await connection.query(`INSERT INTO nav_items (label,href,parent_id,sort_order) VALUES
        ('HOME','/',NULL,0),
        ('ABOUT','/who-we-are',NULL,1),
        ('MINISTRIES','/what-we-do',NULL,2),
        ('SERMONS','/sermons',NULL,3),
        ('CONTACT','/contact',NULL,4)`);
      // Get IDs of ABOUT and MINISTRIES
      const [topRows] = await connection.query(`SELECT id,label FROM nav_items WHERE parent_id IS NULL`);
      const tops = topRows as { id: number; label: string }[];
      const aboutId = tops.find(t => t.label === 'ABOUT')?.id;
      const minId   = tops.find(t => t.label === 'MINISTRIES')?.id;
      if (aboutId) {
        await connection.query(`INSERT INTO nav_items (label,href,parent_id,sort_order) VALUES
          ("Dr. Wesley Paul's Bio",'/meet-wesley',${aboutId},0),
          ('Who We Are','/who-we-are',${aboutId},1),
          ('What We Do','/what-we-do',${aboutId},2)`);
      }
      if (minId) {
        await connection.query(`INSERT INTO nav_items (label,href,parent_id,sort_order) VALUES
          ('Gospel Festivals','/ministries/gospel-festivals',${minId},0),
          ('Renewals & Revivals','/ministries/renewals-revivals',${minId},1),
          ('Evangelism Seminars','/ministries/evangelism',${minId},2),
          ('Marriage & Family Seminars','/ministries/marriage-family',${minId},3),
          ('Youth Outreach','/ministries/youth-outreach',${minId},4)`);
      }
    }

    // ── Seed site_content ──────────────────────────────────────────��──────
    const heroSlides = JSON.stringify([
      {"type":"video","src":"/images/wp_slider1_optimized.mp4","poster":"/images/wp_slider1.jpg","eyebrow":"Now Streaming","title":"WATCH THE LATEST\\nMINISTRY UPDATE NOW","cta_label":"Watch Now","cta_href":"https://www.youtube.com/@DrWesleyPaul","cta_external":true,"show_platforms":true},
      {"type":"image","src":"/images/image_11.jpeg","eyebrow":"Evangelism","title":"GOSPEL FESTIVALS\\nACROSS THE NATIONS","cta_label":"Learn More","cta_href":"/ministries/gospel-festivals","cta_external":false,"show_platforms":false},
      {"type":"image","src":"/images/image_13.jpeg","eyebrow":"Family","title":"STRENGTHENING\\nMARRIAGES & FAMILIES","cta_label":"Find Out More","cta_href":"/ministries/marriage-family","cta_external":false,"show_platforms":false},
      {"type":"image","src":"/images/image_16.jpeg","eyebrow":"Revival","title":"RENEWALS &\\nREVIVAL GATHERINGS","cta_label":"Explore Ministries","cta_href":"/what-we-do","cta_external":false,"show_platforms":false}
    ]);
    const statsBar = JSON.stringify({"count":"30+","tagline":"Nations Served & Thousands of Souls Transformed Through the Gospel"});
    const welcome = JSON.stringify({"image":"/images/image_16.jpeg","heading":"Proclaiming Christ & Strengthening Families","body1":"Wesley Paul International Ministries is a global evangelistic ministry committed to proclaiming the life-transforming message of Jesus Christ and strengthening the foundation of marriages and families across the world.","body2":"We partner with local churches to conduct Gospel Festivals, revival meetings, marriage and family seminars, and evangelism training across more than 30 nations. Dr. Wesley and Debbie Paul bring a unique blend of spiritual depth and practical wisdom to every ministry setting.","cta_label":"Know More","cta_href":"/meet-wesley"});
    const impact = JSON.stringify([{"value":"30+","label":"Nations Served"},{"value":"20+","label":"Years of Ministry"},{"value":"1000s","label":"Lives Changed"},{"value":"100s","label":"Churches Partnered"}]);
    const ministries = JSON.stringify([
      {"image":"/images/event-1.jpg","category":"Evangelism","title":"Gospel Festivals","excerpt":"Large-scale evangelistic crusades mobilizing entire cities through local church partnerships, worship, and powerful Gospel preaching.","href":"/ministries/gospel-festivals"},
      {"image":"/images/event-2.jpg","category":"Revival","title":"Renewals & Revivals","excerpt":"Weekend and multi-day revival gatherings igniting fresh passion and bringing spiritual transformation to local congregations.","href":"/ministries/renewals-revivals"},
      {"image":"/images/event-3.jpg","category":"Family","title":"Marriage & Family Seminars","excerpt":"Spirit-led seminars combining Biblical wisdom and therapeutic tools — led by Dr. Wesley and Debbie Paul — to strengthen families.","href":"/ministries/marriage-family"},
      {"image":"/images/sermon-1.jpg","category":"Training","title":"Evangelism Seminars","excerpt":"Equipping believers to understand and communicate the Gospel clearly and confidently in their everyday relationships.","href":"/ministries/evangelism"},
      {"image":"/images/sermon-2.jpg","category":"Youth","title":"Youth Outreach","excerpt":"Dynamic speaking sessions for schools, colleges and universities — engaging today's youth with Biblical truth and purpose.","href":"/ministries/youth-outreach"},
      {"image":"/images/sermon-3.jpg","category":"Training","title":"Evangelism Training","excerpt":"Pre-festival intensive training workshops that prepare church members to lead their friends and community to Christ.","href":"/ministries/evangelism"}
    ]);
    const sermons = JSON.stringify([
      {"image":"/images/sermon-1.jpg","title":"God Wants To Do A New Thing In Your Life","date":"Jan 13, 2024","href":"https://www.youtube.com/@DrWesleyPaul"},
      {"image":"/images/sermon-2.jpg","title":"The Power of the Gospel to Save Every Soul","date":"Feb 4, 2024","href":"https://www.youtube.com/@DrWesleyPaul"},
      {"image":"/images/sermon-3.jpg","title":"Reviving the Church for the Great Commission","date":"Mar 18, 2024","href":"https://www.youtube.com/@DrWesleyPaul"}
    ]);
    const endorsements = JSON.stringify([
      {"quote":"Wesley Paul is a gifted evangelist who has a deep passion for the lost. His ministry is marked by integrity, excellence, and genuine compassion for every soul he encounters.","name":"Luis Palau","title":"President, Luis Palau Evangelistic Association","initials":"LP","color":"#2070B8"},
      {"quote":"I have known Wesley Paul for many years. He is a man of God, a man of prayer, and a man with a genuine burden for the lost that is evident in every ministry he undertakes.","name":"Dr. Lon Allison","title":"Former Executive Director, Billy Graham Center at Wheaton","initials":"LA","color":"#C0185A"},
      {"quote":"Dr. Wesley Paul brings theological depth combined with evangelistic urgency. His ministry has impacted thousands across the globe and continues to bear lasting fruit.","name":"Dr. Ramesh Richard","title":"President, RREACH — Dallas Theological Seminary","initials":"RR","color":"#0a7c52"},
      {"quote":"Wesley Paul's Gospel Festival in Nairobi was one of the most powerful evangelistic events our city has seen in recent years. Lives were genuinely and permanently changed.","name":"Bishop Arthur Kitonga","title":"Founder, Redeemed Gospel Churches, Nairobi","initials":"AK","color":"#7c3a9b"},
      {"quote":"I have watched Wesley grow into a powerful man of God. His heart for the Gospel and for people is absolutely genuine — he lives what he preaches.","name":"Dr. Don Wilton","title":"Billy Graham's Pastor, First Baptist Church","initials":"DW","color":"#c0622b"}
    ]);
    const gallery = JSON.stringify(["/images/image_11.jpeg","/images/image_13.jpeg","/images/image_16.jpeg","/images/image_17.jpeg"]);
    const giveCta = JSON.stringify({"label":"Partner With Us","heading":"Reaching Nations. Restoring Homes. Reviving Hearts.","body":"Your generous support enables us to carry the Gospel to unreached communities, revive churches, and strengthen families across the world. Every gift makes an eternal difference.","primary_label":"Give / Donate","primary_href":"/give","secondary_label":"Book Dr. Wesley","secondary_href":"/book"});
    const footerSettings = JSON.stringify({
      "tagline":"A global evangelistic ministry committed to proclaiming the life-transforming message of Jesus Christ and strengthening marriages and families across the world.",
      "cta_strip_text":"Partner with us — every gift reaches another soul with the Gospel.",
      "cta_strip_label":"Give Now",
      "cta_strip_href":"/give",
      "address":"P.O. Box 88, Springfield, KY 40069",
      "email":"info@wesleypaul.org",
      "phone":"+1 (859) 806-6424",
      "hours":"Mon – Fri: 9:00 AM – 6:00 PM",
      "social":{
        "facebook":"https://www.facebook.com/wesleypaul.org/",
        "youtube":"https://www.youtube.com/@DrWesleyPaul",
        "instagram":"https://www.instagram.com/drwesleypaul/",
        "twitter":"https://twitter.com/DrWesleyPaul",
        "tiktok":"https://www.tiktok.com/@DrWesleyPaul"
      },
      "quick_links":[
        {"label":"Home","href":"/"},{"label":"Who We Are","href":"/who-we-are"},
        {"label":"Meet Dr. Wesley","href":"/meet-wesley"},{"label":"What We Do","href":"/what-we-do"},
        {"label":"Sermons","href":"/sermons"},{"label":"Book Dr. Wesley","href":"/book"},
        {"label":"Give / Donate","href":"/give"},{"label":"Contact","href":"/contact"}
      ],
      "ministry_links":[
        {"label":"Gospel Festivals","href":"/ministries/gospel-festivals"},
        {"label":"Renewals & Revivals","href":"/ministries/renewals-revivals"},
        {"label":"Marriage & Family Seminars","href":"/ministries/marriage-family"},
        {"label":"Evangelism Seminars","href":"/ministries/evangelism"},
        {"label":"Youth Outreach","href":"/ministries/youth-outreach"}
      ]
    });

    const contentRows: [string, string][] = [
      ['home_hero_slides', heroSlides],
      ['home_stats_bar', statsBar],
      ['home_welcome', welcome],
      ['home_impact', impact],
      ['home_ministries', ministries],
      ['home_sermons', sermons],
      ['home_endorsements', endorsements],
      ['home_gallery', gallery],
      ['home_give_cta', giveCta],
      ['footer_settings', footerSettings],
    ];
    for (const [key, val] of contentRows) {
      await connection.query(
        `INSERT INTO site_content (content_key, content_json) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE content_json = IF(content_json = '[]' OR content_json = '{}' OR content_json = '', VALUES(content_json), content_json)`,
        [key, val]
      );
    }

    // ── Seed inner pages ───────────────────────────────────────────────────────
    type SectionSeed = { type: string; order: number; content: Record<string, unknown> };
    type PageSeed = { slug: string; title: string; meta_title: string; meta_description: string; sections: SectionSeed[] };

    const innerPages: PageSeed[] = [
      {
        slug: 'who-we-are', title: 'Who We Are',
        meta_title: 'Who We Are | Wesley Paul International Ministries',
        meta_description: 'Learn about Wesley Paul International Ministries — our mission, vision, beliefs, and global impact for the Kingdom of God.',
        sections: [
          { type: 'page_header', order: 0, content: { eyebrow: 'About WPIM', heading: 'Who We Are', subheading: 'A global evangelistic ministry committed to proclaiming the life-transforming message of Jesus Christ.' } },
          { type: 'text', order: 1, content: { heading: 'Proclaiming Christ. Strengthening Families. Reviving the Church.', body: 'Wesley Paul International Ministries is a global evangelistic ministry committed to proclaiming the life-transforming message of Jesus Christ and strengthening the foundation of marriages and families across the world.\n\nWe partner with local churches, denominations, and Christian organizations to conduct Gospel Festivals, revival meetings, marriage seminars, evangelism training, and youth outreach events around the globe.', align: 'center' } },
          { type: 'cards_grid', order: 2, content: { heading: 'Our Core Values', items: [
            { title: 'Global Reach', description: 'We believe every person on earth deserves to hear the Gospel of Jesus Christ. We are committed to reaching the unreached across all nations.', color: '#2070B8' },
            { title: 'Family Foundation', description: 'Strong families build strong communities. We invest in marriages and families as foundational pillars of a healthy society and church.', color: '#C0185A' },
            { title: 'Biblical Truth', description: 'All our ministry is grounded firmly in the authority and sufficiency of Scripture. God\'s Word is our guide in every area of life and ministry.', color: '#2070B8' },
            { title: 'Church Partnership', description: 'We work alongside local churches — not in place of them. Every crusade, revival, and seminar is designed to strengthen the local body.', color: '#0a7c52' },
          ] } },
          { type: 'faq', order: 3, content: { heading: 'Statement of Faith', items: [
            { question: 'The Bible', answer: 'The inspired, inerrant, and authoritative Word of God — the complete revelation of God\'s will for salvation and the ultimate guide for Christian living.' },
            { question: 'God', answer: 'One eternal God who exists in three persons: Father, Son, and Holy Spirit — equal in nature, distinct in relationship, and unified in purpose.' },
            { question: 'Jesus Christ', answer: 'The deity of Jesus Christ, His virgin birth, His sinless life, His atoning death, His bodily resurrection, and His coming again in power and glory.' },
            { question: 'Salvation', answer: 'Salvation is by grace through faith in Jesus Christ alone. Repentance from sin and trust in Christ as Savior and Lord is the only way to eternal life.' },
            { question: 'The Holy Spirit', answer: 'The present ministry of the Holy Spirit who indwells, seals, and empowers believers for holy living and fruitful service.' },
            { question: 'The Church', answer: 'The local church is God\'s primary instrument for evangelism, discipleship, and worship. We are committed to serving the Church in all our ministry.' },
          ] } },
          { type: 'cta', order: 4, content: { heading: 'Ready to Partner With Us?', body: 'Whether you want to host an event, give, or simply connect — we would love to hear from you.', primary_cta_text: 'Get in Touch', primary_cta_link: '/contact', secondary_cta_text: 'Support the Ministry', secondary_cta_link: '/give' } },
        ],
      },
      {
        slug: 'meet-wesley', title: 'Meet Dr. Wesley Paul',
        meta_title: 'Meet Dr. Wesley Paul | Wesley Paul International Ministries',
        meta_description: 'Learn about Dr. Wesley Paul — evangelist, counselor, revivalist, and founder of Wesley Paul International Ministries.',
        sections: [
          { type: 'page_header', order: 0, content: { eyebrow: 'About Dr. Wesley', heading: 'Meet Dr. Wesley Paul', subheading: 'Founder & President of Wesley Paul International Ministries' } },
          { type: 'two_col', order: 1, content: { image: '/images/image_16.jpeg', image_side: 'left', label: 'Biography', heading: 'A Life Devoted to the Gospel', body: 'Dr. Wesley Paul is the Founder and President of Wesley Paul International Ministries. Born in India, he moved to Kentucky in 1984 and has spent over two decades serving as a passionate preacher, counselor, and revivalist across more than 30 nations.\n\nHis journey into ministry was shaped by a deep encounter with the transforming power of Jesus Christ — a power he has spent his life communicating to others. From large-scale Gospel Festivals to intimate revival gatherings, Dr. Wesley brings the same fire and sincerity to every setting.\n\nDr. Wesley holds a Master of Divinity from New Orleans Baptist Theological Seminary, a Master of Science in Marriage and Family Therapy from Campbellsville University, and a Doctor of Ministry in Pastoral Care and Counseling from the Lutheran School of Theology in Chicago.\n\nHe is married to Debbie Paul, his partner in life and ministry. Together they lead the Marriage and Family Seminar ministry. They have two children, Ashley and Jonathan, and make their home in Springfield, Kentucky.', cta_label: 'Book Dr. Wesley', cta_href: '/book', cta_secondary_label: 'Contact the Ministry', cta_secondary_href: '/contact' } },
          { type: 'cta', order: 2, content: { heading: 'Invite Dr. Wesley to Your Church', body: 'Whether for a Gospel Festival, revival, marriage seminar, or speaking engagement, Dr. Wesley brings a powerful and authentic ministry experience to every invitation.', primary_cta_text: 'Book an Event', primary_cta_link: '/book', secondary_cta_text: 'View Ministry Programs', secondary_cta_link: '/what-we-do' } },
        ],
      },
      {
        slug: 'what-we-do', title: 'What We Do',
        meta_title: 'What We Do | Wesley Paul International Ministries',
        meta_description: 'Explore the ministry programs of Wesley Paul International Ministries — Gospel Festivals, Revivals, Marriage Seminars, Evangelism Training, and Youth Outreach.',
        sections: [
          { type: 'page_header', order: 0, content: { eyebrow: 'Our Ministry', heading: 'What We Do', subheading: 'Gospel Festivals, Revivals, Marriage & Family Seminars, Evangelism Training, and Youth Outreach across the nations.' } },
          { type: 'cards_grid', order: 1, content: { heading: 'Ministry Programs', items: [
            { title: 'Gospel Festivals', description: 'Large-scale evangelistic crusades mobilizing entire cities through local church partnerships, worship, and powerful Gospel preaching.', color: '#2070B8' },
            { title: 'Renewals & Revivals', description: 'Weekend and multi-day revival gatherings igniting fresh passion and bringing spiritual transformation to local congregations.', color: '#C0185A' },
            { title: 'Marriage & Family Seminars', description: 'Spirit-led seminars combining Biblical wisdom and therapeutic tools — led by Dr. Wesley and Debbie Paul — to strengthen families.', color: '#2070B8' },
            { title: 'Evangelism Seminars', description: 'Equipping believers to understand and communicate the Gospel clearly and confidently in their everyday relationships.', color: '#0a7c52' },
            { title: 'Youth Outreach', description: 'Dynamic speaking sessions for schools, colleges and universities — engaging today\'s youth with Biblical truth and purpose.', color: '#7c3a9b' },
          ] } },
          { type: 'cta', order: 2, content: { heading: 'Partner With Us', body: 'Bring Wesley Paul International Ministries to your church, city, or community.', primary_cta_text: 'Book an Event', primary_cta_link: '/book', secondary_cta_text: 'Contact Us', secondary_cta_link: '/contact' } },
        ],
      },
      {
        slug: 'sermons', title: 'Sermons',
        meta_title: 'Sermons | Wesley Paul International Ministries',
        meta_description: 'Watch and listen to sermons and messages from Dr. Wesley Paul.',
        sections: [
          { type: 'page_header', order: 0, content: { eyebrow: 'Media', heading: 'Sermons', subheading: 'Watch and listen to messages from Dr. Wesley Paul.' } },
          { type: 'sermons_grid', order: 1, content: { heading: 'Watch and Listen to Dr. Wesley', subtitle: 'Subscribe to our YouTube channel for sermons, crusade highlights, and ministry updates from Dr. Wesley Paul.', youtube_url: 'https://www.youtube.com/@DrWesleyPaul', items: [
            { image: '/images/sermon-1.jpg', title: 'God Wants To Do A New Thing In Your Life', date: 'January 13, 2024', href: 'https://www.youtube.com/@DrWesleyPaul' },
            { image: '/images/sermon-2.jpg', title: 'The Power of the Gospel to Save Every Soul', date: 'February 4, 2024', href: 'https://www.youtube.com/@DrWesleyPaul' },
            { image: '/images/sermon-3.jpg', title: 'Reviving the Church for the Great Commission', date: 'March 18, 2024', href: 'https://www.youtube.com/@DrWesleyPaul' },
            { image: '/images/event-1.jpg', title: 'Faith That Moves Mountains', date: 'April 7, 2024', href: 'https://www.youtube.com/@DrWesleyPaul' },
            { image: '/images/event-2.jpg', title: 'The Great Commission: Our Calling', date: 'April 21, 2024', href: 'https://www.youtube.com/@DrWesleyPaul' },
            { image: '/images/event-3.jpg', title: 'Building a Marriage That Lasts', date: 'May 5, 2024', href: 'https://www.youtube.com/@DrWesleyPaul' },
          ] } },
        ],
      },
      {
        slug: 'give', title: 'Give / Donate',
        meta_title: 'Give / Donate | Wesley Paul International Ministries',
        meta_description: 'Partner with Wesley Paul International Ministries through your generous financial support. Every gift carries the Gospel further.',
        sections: [
          { type: 'page_header', order: 0, content: { eyebrow: 'Partner With Us', heading: 'Give / Donate', subheading: 'Your generous support enables us to carry the Gospel to the ends of the earth.' } },
          { type: 'two_col', order: 1, content: { image: '/images/donate_wesley.jpg', image_side: 'left', label: 'Give / Donate', heading: 'Reaching Nations. Restoring Homes. Reviving Hearts.', body: 'Your support helps us carry the Gospel to the ends of the earth, strengthen families, revive churches, and make the name of Jesus known in communities that need it most.\n\nAll donations are tax-deductible to the full extent allowed by law. We are committed to full transparency and accountability in the use of every gift.\n\nMailing a check? Make payable to Wesley Paul International Ministries, P.O. Box 88, Springfield, KY 40069.', cta_label: 'Donate Now via PayPal', cta_href: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=364WE28H8TQAJ', cta_secondary_label: 'Contact for Bank Transfer', cta_secondary_href: '/contact' } },
          { type: 'cards_grid', order: 2, content: { heading: 'Your Gift Makes an Eternal Difference', bg_light: false, items: [
            { title: 'Fund Gospel Events', description: 'Support large-scale evangelistic crusades reaching unreached communities.', color: '#2070B8' },
            { title: 'Church Revival', description: 'Enable revival meetings that bring spiritual transformation to congregations.', color: '#C0185A' },
            { title: 'Family Counseling', description: 'Empower families through marriage seminars and counseling support programs.', color: '#0a7c52' },
            { title: 'Evangelism Training', description: 'Equip believers with resources and training to share the Gospel confidently.', color: '#7c3a9b' },
          ] } },
          { type: 'cta', order: 3, content: { heading: '"God loves a cheerful giver." — 2 Cor. 9:7', body: 'Every gift carries the Gospel further. Thank you for your partnership in reaching the nations.', primary_cta_text: 'Give Now', primary_cta_link: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=364WE28H8TQAJ', secondary_cta_text: 'Contact Us', secondary_cta_link: '/contact' } },
        ],
      },
      {
        slug: 'book', title: 'Book Dr. Wesley',
        meta_title: 'Book Dr. Wesley | Wesley Paul International Ministries',
        meta_description: 'Invite Dr. Wesley Paul to your church or community for a Gospel Festival, revival, marriage seminar, or speaking event.',
        sections: [
          { type: 'page_header', order: 0, content: { eyebrow: 'Partner With Us', heading: 'Book Dr. Wesley', subheading: 'Invite Dr. Wesley Paul to your church, campus, or community for a Gospel Festival, revival, seminar, or speaking event.' } },
          { type: 'booking_form', order: 1, content: {} },
        ],
      },
      {
        slug: 'contact', title: 'Contact Us',
        meta_title: 'Contact | Wesley Paul International Ministries',
        meta_description: 'Get in touch with Wesley Paul International Ministries. We would love to hear from you.',
        sections: [
          { type: 'page_header', order: 0, content: { eyebrow: 'Get in Touch', heading: 'Contact Us', subheading: 'We would love to hear from you. Whether you have a question, want to partner, or need prayer — reach out and our team will respond promptly.' } },
          { type: 'contact_form', order: 1, content: { address: 'P.O. Box 88, Springfield, KY 40069', office_address: 'Rosemead, CA 91770', email: 'info@wesleypaul.org', phone: '+1 (859) 806-6424', hours: 'Monday – Friday, 9:00 AM – 6:00 PM EST' } },
        ],
      },
      {
        slug: 'ministries/gospel-festivals', title: 'Gospel Festivals',
        meta_title: 'Gospel Festivals | Wesley Paul International Ministries',
        meta_description: 'Large-scale evangelistic crusades reaching entire communities with the message of Jesus Christ through worship, preaching, and altar calls.',
        sections: [
          { type: 'page_header', order: 0, content: { eyebrow: 'Ministry Programs', heading: 'Gospel Festivals', subheading: 'Large-scale evangelistic events that bring churches together to reach entire communities with the transforming message of Jesus Christ.' } },
          { type: 'text', order: 1, content: { heading: 'Reaching Cities for Christ', body: 'Gospel Festivals are large-scale evangelistic crusades conducted through strategic partnerships with local churches. These events are designed to mobilize entire communities and create an environment where people can respond to the message of Jesus Christ.\n\nDr. Wesley Paul has conducted Gospel Festivals across Asia, Africa, Europe, and the Americas — seeing thousands come to faith in Jesus Christ through these events.' } },
          { type: 'cards_grid', order: 2, content: { heading: 'What Makes a Gospel Festival', items: [
            { title: 'Community Mobilization', description: 'Partnering with local churches to mobilize volunteers and create citywide impact.', color: '#2070B8' },
            { title: 'Worship & Praise', description: 'Powerful worship that creates an atmosphere of encounter with the living God.', color: '#C0185A' },
            { title: 'Gospel Preaching', description: 'Clear, compelling proclamation of the life-changing message of Jesus Christ.', color: '#2070B8' },
            { title: 'Altar Calls', description: 'Personal invitations for people to receive Jesus, be healed, or rededicate their lives.', color: '#0a7c52' },
            { title: 'Follow-up Discipleship', description: 'Connecting new believers with local churches for ongoing discipleship and community.', color: '#7c3a9b' },
            { title: 'Pre-event Training', description: 'Evangelism seminars prepare church members to lead friends and family to Christ.', color: '#C0185A' },
          ] } },
          { type: 'cta', order: 3, content: { heading: 'Host a Gospel Festival', body: 'Partner with us to bring a life-changing Gospel Festival to your city or region.', primary_cta_text: 'Book Dr. Wesley', primary_cta_link: '/book', secondary_cta_text: 'Contact Us', secondary_cta_link: '/contact' } },
        ],
      },
      {
        slug: 'ministries/renewals-revivals', title: 'Renewals & Revivals',
        meta_title: 'Renewals & Revivals | Wesley Paul International Ministries',
        meta_description: 'Weekend and multi-day revival gatherings igniting fresh passion and bringing spiritual transformation to local congregations.',
        sections: [
          { type: 'page_header', order: 0, content: { eyebrow: 'Ministry Programs', heading: 'Renewals & Revivals', subheading: 'Weekend events and extended revival series designed to bring fresh fire and spiritual renewal to local congregations.' } },
          { type: 'text', order: 1, content: { heading: 'Rekindling the Fire of the Holy Spirit', body: 'Renewal and revival meetings are weekend events or extended multi-day series designed to bring fresh fire and spiritual renewal to local congregations. These meetings feature passionate worship, deep Biblical teaching, and personal encounters with God.\n\nDr. Wesley Paul is called to bring revival — not just religious activity, but genuine, life-changing encounters with the living God that transform individuals, families, and entire church communities.' } },
          { type: 'cards_grid', order: 2, content: { heading: 'What to Expect', items: [
            { title: 'Passionate Preaching', description: 'Expository Bible preaching that calls believers to deeper repentance, faith, and surrender.', color: '#C0185A' },
            { title: 'Powerful Worship', description: 'Spirit-led worship that creates an atmosphere for genuine encounter with God.', color: '#2070B8' },
            { title: 'Personal Ministry', description: 'Opportunities for personal prayer, healing, and ministry at every service.', color: '#0a7c52' },
            { title: 'Church Strengthening', description: 'Tailored to the specific needs of the host church — building up the local body.', color: '#7c3a9b' },
          ] } },
          { type: 'cta', order: 3, content: { heading: 'Invite a Revival to Your Church', body: 'Partner with us to bring renewal, revival, and fresh fire to your congregation.', primary_cta_text: 'Book Dr. Wesley', primary_cta_link: '/book', secondary_cta_text: 'Contact Us', secondary_cta_link: '/contact' } },
        ],
      },
      {
        slug: 'ministries/evangelism', title: 'Evangelism Seminars',
        meta_title: 'Evangelism Seminars | Wesley Paul International Ministries',
        meta_description: 'Equipping believers to understand and communicate the Gospel clearly and confidently in their everyday relationships.',
        sections: [
          { type: 'page_header', order: 0, content: { eyebrow: 'Ministry Programs', heading: 'Evangelism Seminars', subheading: 'Equipping every believer to share the Gospel clearly and confidently in their everyday life.' } },
          { type: 'text', order: 1, content: { heading: 'Every Believer an Evangelist', body: 'Evangelism seminars are intensive training sessions designed to equip church members to share the Gospel clearly and confidently in their everyday relationships and communities.\n\nThese seminars are often held as pre-festival training events to prepare church members to lead their friends and family to Christ during a Gospel Festival — multiplying the evangelistic impact of every event.' } },
          { type: 'cards_grid', order: 2, content: { heading: 'What You Will Learn', items: [
            { title: 'The Clear Gospel', description: 'How to present the message of salvation simply and clearly from Scripture.', color: '#2070B8' },
            { title: 'Personal Testimony', description: 'How to share your personal story of faith in a compelling and natural way.', color: '#C0185A' },
            { title: 'Overcoming Objections', description: 'How to respond to common questions and objections about the Christian faith.', color: '#0a7c52' },
            { title: 'Follow-up Discipleship', description: 'How to help new believers take their first steps in faith and community.', color: '#7c3a9b' },
          ] } },
          { type: 'cta', order: 3, content: { heading: 'Equip Your Church to Evangelize', body: 'Host an evangelism seminar and mobilize your congregation to reach your community.', primary_cta_text: 'Book a Seminar', primary_cta_link: '/book', secondary_cta_text: 'Contact Us', secondary_cta_link: '/contact' } },
        ],
      },
      {
        slug: 'ministries/marriage-family', title: 'Marriage & Family Seminars',
        meta_title: 'Marriage & Family Seminars | Wesley Paul International Ministries',
        meta_description: 'Spirit-led seminars combining Biblical wisdom with therapeutic tools to strengthen marriages and families.',
        sections: [
          { type: 'page_header', order: 0, content: { eyebrow: 'Ministry Programs', heading: 'Marriage & Family Seminars', subheading: 'Spirit-led seminars combining Biblical wisdom and therapeutic tools — led by Dr. Wesley and Debbie Paul — to strengthen marriages and families.' } },
          { type: 'text', order: 1, content: { heading: 'Strengthening Marriages. Restoring Families.', body: 'Led by Dr. Wesley Paul and Debbie Paul, Marriage and Family Seminars blend spiritual wisdom with therapeutic tools to help couples and families thrive. Drawing on Dr. Wesley\'s dual expertise as a minister and licensed marriage therapist, these seminars address real challenges with Biblical truth and practical tools.\n\nDebbie Paul brings warmth, personal testimony, and a pastoral heart that connects deeply with couples at every stage of marriage.' } },
          { type: 'cards_grid', order: 2, content: { heading: 'What the Seminar Covers', items: [
            { title: 'Communication & Conflict', description: 'Biblical and therapeutic principles for healthy communication and conflict resolution.', color: '#2070B8' },
            { title: 'Spiritual Foundation', description: 'Building marriage on the unshakeable foundation of faith and Scripture.', color: '#C0185A' },
            { title: 'Intimacy & Connection', description: 'Deepening emotional, physical, and spiritual intimacy in marriage.', color: '#0a7c52' },
            { title: 'Parenting & Family', description: 'Raising children with Biblical values and building a God-centered home.', color: '#7c3a9b' },
          ] } },
          { type: 'cta', order: 3, content: { heading: 'Strengthen Your Church Families', body: 'Host a Marriage & Family Seminar and invest in the foundation of your congregation.', primary_cta_text: 'Book the Seminar', primary_cta_link: '/book', secondary_cta_text: 'Contact Us', secondary_cta_link: '/contact' } },
        ],
      },
      {
        slug: 'ministries/youth-outreach', title: 'Youth Outreach',
        meta_title: 'Youth Outreach | Wesley Paul International Ministries',
        meta_description: 'Dynamic speaking sessions for schools, colleges and universities — engaging today\'s youth with Biblical truth and purpose.',
        sections: [
          { type: 'page_header', order: 0, content: { eyebrow: 'Ministry Programs', heading: 'Youth Outreach', subheading: 'Engaging today\'s youth with Biblical truth, purpose, and the life-transforming power of Jesus Christ.' } },
          { type: 'text', order: 1, content: { heading: 'Reaching the Next Generation', body: 'Youth outreach sessions are dynamic, engaging, and relevant — designed to connect with the hearts of young people in schools, colleges, and universities. Dr. Wesley brings the timeless message of the Gospel in a way that speaks directly to the questions, pressures, and opportunities facing today\'s youth.\n\nFrom campus chapels to full university outreach events, Dr. Wesley partners with student organizations and local churches to reach young people where they are.' } },
          { type: 'cards_grid', order: 2, content: { heading: 'Outreach Formats', items: [
            { title: 'School Assemblies', description: 'Relevant, engaging presentations that connect with students in school settings.', color: '#2070B8' },
            { title: 'University Events', description: 'Campus outreach and Gospel presentations at colleges and universities.', color: '#C0185A' },
            { title: 'Youth Camps', description: 'Intensive retreat settings where young people encounter God in powerful ways.', color: '#0a7c52' },
            { title: 'Church Youth Groups', description: 'Special sessions for local church youth ministries and student groups.', color: '#7c3a9b' },
          ] } },
          { type: 'cta', order: 3, content: { heading: 'Reach the Youth in Your Community', body: 'Partner with us to bring the Gospel to young people in your school, campus, or church.', primary_cta_text: 'Book Youth Outreach', primary_cta_link: '/book', secondary_cta_text: 'Contact Us', secondary_cta_link: '/contact' } },
        ],
      },
    ];

    for (const pageData of innerPages) {
      const [existing] = await connection.query('SELECT id FROM pages WHERE slug = ?', [pageData.slug]);
      if ((existing as { id: number }[]).length > 0) continue; // already seeded
      await connection.query(
        `INSERT INTO pages (title, slug, status, meta_title, meta_description) VALUES (?, ?, 'published', ?, ?)`,
        [pageData.title, pageData.slug, pageData.meta_title, pageData.meta_description]
      );
      const [inserted] = await connection.query('SELECT LAST_INSERT_ID() as id');
      const pageId = (inserted as { id: number }[])[0].id;
      for (const sec of pageData.sections) {
        await connection.query(
          `INSERT INTO page_sections (page_id, section_type, sort_order, content_json) VALUES (?, ?, ?, ?)`,
          [pageId, sec.type, sec.order, JSON.stringify(sec.content)]
        );
      }
    }

    // Seed Home page
    await connection.query(`INSERT IGNORE INTO pages (title, slug, layout, status) VALUES ('Home', 'home', 'standard', 'published')`);

    // Seed starter forms
    const [formCount] = await connection.query('SELECT COUNT(*) as cnt FROM forms');
    if ((formCount as { cnt: number }[])[0].cnt === 0) {
      const firecampFields = JSON.stringify([
        { id: 'f1', type: 'text',     label: 'Full Name',      placeholder: 'Your full name',        required: true,  options: [] },
        { id: 'f2', type: 'email',    label: 'Email Address',  placeholder: 'you@example.com',        required: true,  options: [] },
        { id: 'f3', type: 'phone',    label: 'Phone Number',   placeholder: '+1 (000) 000-0000',      required: false, options: [] },
        { id: 'f4', type: 'text',     label: 'Church / Organization', placeholder: 'Your church name', required: false, options: [] },
        { id: 'f5', type: 'select',   label: 'Age Group',      placeholder: '',                       required: false, options: ['Youth','Young Adult','Adult'] },
        { id: 'f6', type: 'select',   label: 'Attendance Days', placeholder: '',                      required: false, options: ['Day 1','Day 2','Full Camp'] },
        { id: 'f7', type: 'textarea', label: 'Special Needs / Dietary Requirements', placeholder: 'Let us know of any special needs', required: false, options: [] },
      ]);
      await connection.query(
        `INSERT INTO forms (name, description, fields_json, success_message) VALUES (?, ?, ?, ?)`,
        ['Firecamp Registration', 'Registration form for Firecamp events', firecampFields, 'Thank you for registering! We will be in touch with confirmation details.']
      );

      const contactFields = JSON.stringify([
        { id: 'c1', type: 'text',     label: 'Full Name',    placeholder: 'Your name',        required: true,  options: [] },
        { id: 'c2', type: 'email',    label: 'Email Address', placeholder: 'you@example.com', required: true,  options: [] },
        { id: 'c3', type: 'textarea', label: 'Message',      placeholder: 'Your message…',    required: true,  options: [] },
      ]);
      await connection.query(
        `INSERT INTO forms (name, description, fields_json, success_message) VALUES (?, ?, ?, ?)`,
        ['General Contact', 'Simple general contact form', contactFields, 'Thank you! We will get back to you shortly.']
      );
    }

    // Insert default admin user if not exists
    const [existing] = await connection.query(
      'SELECT id FROM admin_users WHERE username = ?',
      ['admin']
    );
    const rows = existing as { id: number }[];
    if (rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await connection.query(
        'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
        ['admin', hash]
      );
    }

    // Insert default email_config row if empty
    const [emailRows] = await connection.query('SELECT id FROM email_config LIMIT 1');
    if ((emailRows as { id: number }[]).length === 0) {
      await connection.query(
        `INSERT INTO email_config (smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name)
         VALUES ('smtp.gmail.com', 587, '', '', 'admin@wesleypaul.org', 'Wesley Paul Ministries')`
      );
    }

    // Insert default analytics_config row if empty
    const [analyticsRows] = await connection.query('SELECT id FROM analytics_config LIMIT 1');
    if ((analyticsRows as { id: number }[]).length === 0) {
      await connection.query(
        `INSERT INTO analytics_config (ga_tracking_id, fb_pixel_id, gtm_id) VALUES ('', '', '')`
      );
    }

    await connection.end();

    return Response.json({
      success: true,
      message: 'Database setup complete. Admin user: admin / admin123',
    });
  } catch (error) {
    if (connection) await connection.end().catch(() => {});
    console.error('Setup error:', error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
