import pool from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!getAdminFromRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: string[] = [];

  // ── 1. Event post ────────────────────────────────────────────────────────────
  const spanishContent = `<p>¡Prepárate para dos noches que marcarán tu vida para siempre! Este 16 y 17 de mayo, desde las 5:00 PM hasta las 9:00 PM, las iglesias de Carolina se unen en un evento extraordinario lleno de fe, esperanza y salvación.</p>

<p>Directamente desde Luis Palau Ministries, llega el poderoso evangelista <strong>Dr. Wesley Paul</strong>, trayendo un mensaje que transformará corazones. Y eso no es todo… Desde La Perla, el increíble <strong>Chagy Adorno</strong>, ilusionista y payaso gospel, estará sorprendiendo a grandes y chicos cada noche.</p>

<p>La alabanza estará encendida con los talentosos líderes de adoración: <strong>Yamiel Osorio</strong> (Sábado 16) y <strong>Misael Roldán</strong> (Domingo 17), llevando la presencia de Dios a otro nivel. Además, <strong>Christopher Metivier</strong> compartirá un testimonio impactante que tocará tu alma.</p>

<h3>📍 Detalles del Evento</h3>
<ul>
  <li><strong>Lugar:</strong> Coliseo Guillermo Angulo, Carolina, Puerto Rico</li>
  <li><strong>Fechas:</strong> Sábado 16 y Domingo 17 de mayo de 2026</li>
  <li><strong>Hora:</strong> 5:00 PM – 9:00 PM</li>
  <li><strong>Entrada:</strong> ¡Libre de costo!</li>
</ul>

<p>¡No te lo puedes perder! Invita a tu familia, a tus amigos y a tus vecinos. ¡Ven y sé parte de este mover poderoso! ¡Unámonos como un solo pueblo para darle la bienvenida al poder de Jesucristo en Carolina!</p>

<p>🔥 <strong>¡Te esperamos… porque este puede ser el día que cambie tu vida!</strong> 🔥</p>`;

  const englishContent = `<p>Prepare yourself for two nights that will mark your life forever! On May 16 and 17, from 5:00 PM to 9:00 PM, the churches of Carolina come together for an extraordinary event filled with faith, hope, and salvation.</p>

<p>Directly from Luis Palau Ministries, the powerful evangelist <strong>Dr. Wesley Paul</strong> arrives, bringing a message that will transform hearts. And that's not all… From La Perla, the incredible <strong>Chagy Adorno</strong>, gospel illusionist and clown, will be amazing children and adults alike every night.</p>

<p>Worship will be on fire with talented worship leaders: <strong>Yamiel Osorio</strong> (Saturday, May 16) and <strong>Misael Roldán</strong> (Sunday, May 17), taking God's presence to another level. Additionally, <strong>Christopher Metivier</strong> will share a powerful testimony that will touch your soul.</p>

<h3>📍 Event Details</h3>
<ul>
  <li><strong>Location:</strong> Coliseo Guillermo Angulo, Carolina, Puerto Rico</li>
  <li><strong>Dates:</strong> Saturday May 16 &amp; Sunday May 17, 2026</li>
  <li><strong>Time:</strong> 5:00 PM – 9:00 PM</li>
  <li><strong>Admission:</strong> Free!</li>
</ul>

<p>Don't miss it! Invite your family, friends, and neighbors. Come and be part of this powerful move of God! Let us unite as one people to welcome the power of Jesus Christ in Carolina!</p>

<p>🔥 <strong>We'll be waiting for you… because this could be the day that changes your life!</strong> 🔥</p>`;

  const translationsJson = JSON.stringify({
    es: {
      title: "¡Carolina Para Cristo!",
      excerpt: "¡Prepárate para dos noches que marcarán tu vida para siempre! Sábado 16 y Domingo 17 de mayo, 5:00 PM – 9:00 PM. Coliseo Guillermo Angulo, Carolina, Puerto Rico.",
      content: spanishContent,
    },
    en: {
      title: "Carolina For Christ!",
      excerpt: "Prepare for two nights that will mark your life forever! Saturday May 16 & Sunday May 17, 5:00 PM – 9:00 PM. Coliseo Guillermo Angulo, Carolina, Puerto Rico.",
      content: englishContent,
    },
  });

  try {
    const [existingPost] = await pool.execute("SELECT id FROM posts WHERE slug = 'carolina-para-cristo' LIMIT 1");
    if ((existingPost as { id: number }[]).length === 0) {
      await pool.execute(
        `INSERT INTO posts (title, slug, post_type, excerpt, content, featured_image, status, event_date, tags, author, translations_json)
         VALUES (?, ?, 'event', ?, ?, ?, 'published', '2026-05-16 17:00:00', 'evangelism,carolina,puerto-rico,crusade', 'Wesley Paul Ministries', ?)`,
        [
          "Carolina Para Cristo",
          "carolina-para-cristo",
          "¡Prepárate para dos noches que marcarán tu vida para siempre! Sábado 16 y Domingo 17 de mayo de 2026, 5:00 PM – 9:00 PM. Coliseo Guillermo Angulo, Carolina, Puerto Rico. Entrada libre.",
          spanishContent,
          "/uploads/carolina-para-cristo-poster.jpg",
          translationsJson,
        ]
      );
      results.push("✅ Event post created");
    } else {
      results.push("⚠️ Event post already exists");
    }
  } catch (e) {
    results.push(`❌ Post error: ${String(e)}`);
  }

  // ── 2. CMS Page with page-builder sections ───────────────────────────────────
  let pageId = 0;
  try {
    const [existingPage] = await pool.execute("SELECT id FROM pages WHERE slug = 'events/carolina-para-cristo' LIMIT 1");
    const existing = existingPage as { id: number }[];
    if (existing.length > 0) {
      pageId = existing[0].id;
      results.push("⚠️ Page already exists — skipping sections");
    } else {
      const [pageResult] = await pool.execute(
        `INSERT INTO pages (title, slug, status, meta_title, meta_description)
         VALUES (?, 'events/carolina-para-cristo', 'published', ?, ?)`,
        [
          "Carolina Para Cristo — Gran Campaña Evangelística",
          "Carolina Para Cristo | Wesley Paul International Ministries",
          "¡Únete a nosotros en el Coliseo Guillermo Angulo, Carolina el 16 y 17 de mayo de 2026! Gran Campaña Evangelística con el Dr. Wesley Paul.",
        ]
      );
      pageId = (pageResult as { insertId: number }).insertId;
      results.push(`✅ Page created (id=${pageId})`);

      // ── Section 1: Page Header ─────────────────────────────────────────────
      const heroContent = JSON.stringify({
        eyebrow: "Gran Campaña Evangelística",
        heading: "¡Carolina Para Cristo!",
        subheading: "Un encuentro que transformará tu vida · 16 y 17 de mayo de 2026",
        bg_image: "/uploads/carolina-para-cristo-poster.jpg",
        bg_overlay: 45,
        bg_position: "center top",
      });
      await pool.execute(
        "INSERT INTO page_sections (page_id, section_type, sort_order, content_json) VALUES (?, 'page_header', 0, ?)",
        [pageId, heroContent]
      );

      // ── Section 2: Event details two-col ──────────────────────────────────
      const twoColContent = JSON.stringify({
        label: "Sobre el Evento",
        heading: "Dos Noches de Poder y Salvación",
        body: "Este 16 y 17 de mayo, desde las 5:00 PM hasta las 9:00 PM, las iglesias de Carolina se unen en un evento extraordinario lleno de fe, esperanza y salvación.\n\nDirectamente desde Luis Palau Ministries, el poderoso evangelista Dr. Wesley Paul trae un mensaje que transformará corazones. Chagy Adorno (ilusionista y payaso gospel) sorprenderá a grandes y chicos. Y los líderes de alabanza Yamiel Osorio y Misael Roldán llevarán la presencia de Dios a otro nivel.",
        image: "/uploads/carolina-para-cristo-speakers.jpg",
        image_side: "right",
        image_fit: "cover",
        cta_label: "¡Regístrate Gratis!",
        cta_href: "#contact",
      });
      const [s2] = await pool.execute(
        "INSERT INTO page_sections (page_id, section_type, sort_order, content_json) VALUES (?, 'two_col', 1, ?)",
        [pageId, twoColContent]
      );
      const s2id = (s2 as { insertId: number }).insertId;

      // Spanish translation for section 2
      await pool.execute(
        "INSERT INTO section_translations (section_id, language_code, content_json, status) VALUES (?, 'es', ?, 'reviewed')",
        [s2id, twoColContent]
      );
      // English translation for section 2
      const twoColEn = JSON.stringify({
        label: "About the Event",
        heading: "Two Nights of Power & Salvation",
        body: "On May 16 and 17, from 5:00 PM to 9:00 PM, the churches of Carolina unite for an extraordinary event filled with faith, hope, and salvation.\n\nDr. Wesley Paul (from Luis Palau Ministries) brings a heart-transforming message. Gospel illusionist Chagy Adorno will amaze young and old. Worship leaders Yamiel Osorio and Misael Roldán will take God's presence to another level.",
        image: "/uploads/carolina-para-cristo-speakers.jpg",
        image_side: "right",
        image_fit: "cover",
        cta_label: "Register Free!",
        cta_href: "#contact",
      });
      await pool.execute(
        "INSERT INTO section_translations (section_id, language_code, content_json, status) VALUES (?, 'en', ?, 'reviewed')",
        [s2id, twoColEn]
      );

      // ── Section 3: Event details cards ────────────────────────────────────
      const cardsContent = JSON.stringify({
        heading: "Detalles del Evento",
        bg_light: true,
        items: [
          { title: "📍 Lugar", description: "Coliseo Guillermo Angulo, Carolina, Puerto Rico", color: "#2070B8" },
          { title: "📅 Fechas", description: "Sábado 16 y Domingo 17 de mayo de 2026", color: "#C0185A" },
          { title: "🕔 Hora", description: "5:00 PM – 9:00 PM cada noche", color: "#7c3aed" },
          { title: "🎟️ Entrada", description: "¡Libre de costo! Invita a toda tu familia y amigos", color: "#059669" },
        ],
      });
      const [s3] = await pool.execute(
        "INSERT INTO page_sections (page_id, section_type, sort_order, content_json) VALUES (?, 'cards_grid', 2, ?)",
        [pageId, cardsContent]
      );
      const s3id = (s3 as { insertId: number }).insertId;
      await pool.execute(
        "INSERT INTO section_translations (section_id, language_code, content_json, status) VALUES (?, 'es', ?, 'reviewed')",
        [s3id, cardsContent]
      );
      const cardsEn = JSON.stringify({
        heading: "Event Details",
        bg_light: true,
        items: [
          { title: "📍 Location", description: "Coliseo Guillermo Angulo, Carolina, Puerto Rico", color: "#2070B8" },
          { title: "📅 Dates", description: "Saturday May 16 & Sunday May 17, 2026", color: "#C0185A" },
          { title: "🕔 Time", description: "5:00 PM – 9:00 PM each night", color: "#7c3aed" },
          { title: "🎟️ Admission", description: "Completely free! Bring your whole family and friends", color: "#059669" },
        ],
      });
      await pool.execute(
        "INSERT INTO section_translations (section_id, language_code, content_json, status) VALUES (?, 'en', ?, 'reviewed')",
        [s3id, cardsEn]
      );

      // ── Section 4: Speaker lineup text section ────────────────────────────
      const speakersContent = JSON.stringify({
        heading: "Programa Especial",
        body: "🎤 Orador Principal: Dr. Wesley Paul — evangelista internacional desde Luis Palau Ministries\n\n🎭 Chagy Adorno — ilusionista y payaso gospel desde La Perla\n\n🎵 Sábado 16 de mayo: Yamiel Osorio (líder de alabanza)\n\n🎵 Domingo 17 de mayo: Misael Roldán (líder de adoración)\n\n✝️ Testimonio impactante: Christopher Metivier\n\nAuspiciado por: Viva Carolina y Wesley Paul International Ministries\nEn colaboración con la Oficina de Base de Fe y las iglesias locales.",
        align: "center",
        bg_color: "#0a1523",
        bg_image: "/uploads/carolina-para-cristo-speakers.jpg",
        bg_overlay: 78,
      });
      const [s4] = await pool.execute(
        "INSERT INTO page_sections (page_id, section_type, sort_order, content_json) VALUES (?, 'text', 3, ?)",
        [pageId, speakersContent]
      );
      const s4id = (s4 as { insertId: number }).insertId;
      await pool.execute(
        "INSERT INTO section_translations (section_id, language_code, content_json, status) VALUES (?, 'es', ?, 'reviewed')",
        [s4id, speakersContent]
      );
      const speakersEn = JSON.stringify({
        heading: "Special Program",
        body: "🎤 Keynote Speaker: Dr. Wesley Paul — international evangelist from Luis Palau Ministries\n\n🎭 Chagy Adorno — gospel illusionist & clown from La Perla\n\n🎵 Saturday May 16: Yamiel Osorio (worship leader)\n\n🎵 Sunday May 17: Misael Roldán (worship leader)\n\n✝️ Powerful Testimony: Christopher Metivier\n\nSponsored by: Viva Carolina & Wesley Paul International Ministries\nIn collaboration with the Faith-Based Office and local churches.",
        align: "center",
        bg_color: "#0a1523",
        bg_image: "/uploads/carolina-para-cristo-speakers.jpg",
        bg_overlay: 78,
      });
      await pool.execute(
        "INSERT INTO section_translations (section_id, language_code, content_json, status) VALUES (?, 'en', ?, 'reviewed')",
        [s4id, speakersEn]
      );

      // ── Section 5: Contact / Registration form ────────────────────────────
      // Find the General Contact form id
      const [formRows] = await pool.execute("SELECT id FROM forms WHERE name LIKE '%Contact%' OR name LIKE '%contact%' LIMIT 1");
      const formArr = formRows as { id: number }[];
      const formId = formArr.length > 0 ? formArr[0].id : 0;

      const contactContent = JSON.stringify({
        heading: "¡Regístrate o Contáctanos!",
        description: "¿Tienes preguntas o deseas registrarte? Escríbenos y con gusto te ayudamos.",
        form_heading: "Envíanos un Mensaje",
        form_id: String(formId),
        layout: "right_form",
        bg_color: "#f8f9fa",
      });
      const [s5] = await pool.execute(
        "INSERT INTO page_sections (page_id, section_type, sort_order, content_json) VALUES (?, 'custom_form', 4, ?)",
        [pageId, contactContent]
      );
      const s5id = (s5 as { insertId: number }).insertId;
      await pool.execute(
        "INSERT INTO section_translations (section_id, language_code, content_json, status) VALUES (?, 'es', ?, 'reviewed')",
        [s5id, contactContent]
      );
      const contactEn = JSON.stringify({
        heading: "Register or Contact Us!",
        description: "Have questions or want to register? Write to us and we'll be happy to help.",
        form_heading: "Send Us a Message",
        form_id: String(formId),
        layout: "right_form",
        bg_color: "#f8f9fa",
      });
      await pool.execute(
        "INSERT INTO section_translations (section_id, language_code, content_json, status) VALUES (?, 'en', ?, 'reviewed')",
        [s5id, contactEn]
      );

      results.push("✅ 5 page sections created with ES/EN translations");
    }
  } catch (e) {
    results.push(`❌ Page/sections error: ${String(e)}`);
  }

  // ── 3. Event Promo Tab ────────────────────────────────────────────────────────
  try {
    const promoTab = JSON.stringify({
      enabled: true,
      tab_label: "¡Evento!",
      title: "¡Carolina Para Cristo!",
      subtitle: "16 y 17 de mayo · 5 PM · Coliseo Guillermo Angulo · ¡Entrada libre!",
      event_date: "2026-05-16T17:00:00",
      image_url: "/uploads/carolina-para-cristo-poster.jpg",
      cta_label: "Ver Detalles",
      cta_href: "/events/carolina-para-cristo",
      translations: {
        en: {
          tab_label: "Event!",
          title: "Carolina For Christ!",
          subtitle: "May 16 & 17 · 5 PM · Coliseo Guillermo Angulo · Free admission!",
          cta_label: "View Details",
        },
        es: {
          tab_label: "¡Evento!",
          title: "¡Carolina Para Cristo!",
          subtitle: "16 y 17 de mayo · 5 PM · Coliseo Guillermo Angulo · ¡Entrada libre!",
          cta_label: "Ver Detalles",
        },
      },
    });
    await pool.execute(
      "INSERT INTO site_settings (setting_key, setting_value) VALUES ('event_promo_tab', ?) ON DUPLICATE KEY UPDATE setting_value = ?",
      [promoTab, promoTab]
    );
    results.push("✅ Event promo tab updated");
  } catch (e) {
    results.push(`❌ Promo tab error: ${String(e)}`);
  }

  // ── 4. Popup Promotion ────────────────────────────────────────────────────────
  try {
    const popup = JSON.stringify({
      enabled: true,
      type: "image",
      media_url: "/uploads/carolina-para-cristo-poster.jpg",
      poster_url: "",
      title: "¡Carolina Para Cristo!",
      description: "¡Dos noches de fe, salvación y alabanza! 16 y 17 de mayo de 2026 · 5:00 PM · Coliseo Guillermo Angulo, Carolina · ¡Entrada libre!",
      cta_label: "¡Ver Detalles!",
      cta_href: "/events/carolina-para-cristo",
      cta_external: false,
      show_once: true,
      show_delay: 2,
      home_only: false,
      show_media: true,
      translations: {
        en: {
          title: "Carolina For Christ!",
          description: "Two nights of faith, salvation & praise! May 16 & 17, 2026 · 5:00 PM · Coliseo Guillermo Angulo, Carolina · Free admission!",
          cta_label: "View Details!",
        },
        es: {
          title: "¡Carolina Para Cristo!",
          description: "¡Dos noches de fe, salvación y alabanza! 16 y 17 de mayo de 2026 · 5:00 PM · Coliseo Guillermo Angulo, Carolina · ¡Entrada libre!",
          cta_label: "¡Ver Detalles!",
        },
      },
    });
    await pool.execute(
      "INSERT INTO site_settings (setting_key, setting_value) VALUES ('promo_popup', ?) ON DUPLICATE KEY UPDATE setting_value = ?",
      [popup, popup]
    );
    results.push("✅ Popup promotion updated");
  } catch (e) {
    results.push(`❌ Popup error: ${String(e)}`);
  }

  // ── 5. Register images in media table ────────────────────────────────────────
  try {
    await pool.execute(
      "INSERT IGNORE INTO media (filename, original_name, file_path, mime_type, alt_text) VALUES (?, ?, ?, 'image/jpeg', ?)",
      ["carolina-para-cristo-poster.jpg", "Carolina Para Cristo - Gran Campaña Evangelística.jpg", "/uploads/carolina-para-cristo-poster.jpg", "Carolina Para Cristo — Gran Campaña Evangelística poster"]
    );
    await pool.execute(
      "INSERT IGNORE INTO media (filename, original_name, file_path, mime_type, alt_text) VALUES (?, ?, ?, 'image/jpeg', ?)",
      ["carolina-para-cristo-speakers.jpg", "Carolina Para Cristo - Dr Wesley Paul & Speakers.jpg", "/uploads/carolina-para-cristo-speakers.jpg", "Carolina Para Cristo — Dr. Wesley Paul, Yamiel Osorio, Misael Roldán"]
    );
    results.push("✅ Images registered in media library");
  } catch (e) {
    results.push(`❌ Media error: ${String(e)}`);
  }

  return Response.json({ success: true, results });
}
