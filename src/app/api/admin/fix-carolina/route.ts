import pool from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ── English (default) content ─────────────────────────────────────────────────
const EN = {
  header: {
    eyebrow: "Great Evangelistic Campaign",
    heading: "Carolina for Christ!",
    subheading: "An encounter that will transform your life · May 16 & 17, 2026",
    bg_image: "/uploads/carolina-para-cristo-poster.jpg",
    bg_overlay: 45,
    bg_position: "center top",
  },
  twoCol: {
    label: "About the Event",
    heading: "Two Nights of Power & Salvation",
    body: "On May 16 and 17, from 5:00 PM to 9:00 PM, the churches of Carolina come together for an extraordinary event filled with faith, hope, and salvation.\n\nDirectly from Luis Palau Ministries, powerful evangelist Dr. Wesley Paul brings a message that will transform hearts. Gospel illusionist and clown Chagy Adorno (from La Perla) will amaze children and adults every night. Worship leaders Yamiel Osorio (Saturday) and Misael Roldán (Sunday) will take God's presence to another level. Christopher Metivier will also share a powerful testimony that will touch your soul.",
    image: "/uploads/carolina-para-cristo-speakers.jpg",
    image_side: "right",
    image_fit: "cover",
    cta_label: "Register Free!",
    cta_href: "#contact",
  },
  cards: {
    heading: "Event Details",
    bg_light: true,
    items: [
      { title: "📍 Location",  description: "Coliseo Guillermo Angulo, Carolina, Puerto Rico",  color: "#2070B8" },
      { title: "📅 Dates",     description: "Saturday May 16 & Sunday May 17, 2026",            color: "#C0185A" },
      { title: "🕔 Time",      description: "5:00 PM – 9:00 PM each night",                     color: "#7c3aed" },
      { title: "🎟️ Admission", description: "Completely free! Bring your whole family & friends", color: "#059669" },
    ],
  },
  speakers: {
    heading: "Special Program",
    body: "🎤 Keynote Speaker: Dr. Wesley Paul — international evangelist from Luis Palau Ministries\n\n🎭 Chagy Adorno — gospel illusionist & clown from La Perla\n\n🎵 Saturday May 16: Yamiel Osorio (worship leader)\n\n🎵 Sunday May 17: Misael Roldán (worship leader)\n\n✝️ Powerful Testimony: Christopher Metivier\n\nSponsored by: Viva Carolina & Wesley Paul International Ministries\nIn collaboration with the Faith-Based Office and local churches.",
    align: "center",
    bg_color: "#0a1523",
    bg_image: "/uploads/carolina-para-cristo-speakers.jpg",
    bg_overlay: 78,
  },
  contact: {
    address: "Coliseo Guillermo Angulo, Carolina, Puerto Rico",
    email: "info@wesleypaul.org",
    phone: "+1 (859) 806-6424",
    hours: "Event: May 16 & 17, 2026 · 5:00 PM – 9:00 PM",
  },
};

// ── Spanish (es translation) content ─────────────────────────────────────────
const ES = {
  header: {
    eyebrow: "Gran Campaña Evangelística",
    heading: "¡Carolina Para Cristo!",
    subheading: "Un encuentro que transformará tu vida · 16 y 17 de mayo de 2026",
    bg_image: "/uploads/carolina-para-cristo-poster.jpg",
    bg_overlay: 45,
    bg_position: "center top",
  },
  twoCol: {
    label: "Sobre el Evento",
    heading: "Dos Noches de Poder y Salvación",
    body: "Este 16 y 17 de mayo, desde las 5:00 PM hasta las 9:00 PM, las iglesias de Carolina se unen en un evento extraordinario lleno de fe, esperanza y salvación.\n\nDirectamente desde Luis Palau Ministries, el poderoso evangelista Dr. Wesley Paul trae un mensaje que transformará corazones. Chagy Adorno (ilusionista y payaso gospel desde La Perla) estará sorprendiendo a grandes y chicos cada noche. Los líderes de alabanza Yamiel Osorio (Sábado) y Misael Roldán (Domingo) llevarán la presencia de Dios a otro nivel. Christopher Metivier compartirá un testimonio impactante que tocará tu alma.",
    image: "/uploads/carolina-para-cristo-speakers.jpg",
    image_side: "right",
    image_fit: "cover",
    cta_label: "¡Regístrate Gratis!",
    cta_href: "#contact",
  },
  cards: {
    heading: "Detalles del Evento",
    bg_light: true,
    items: [
      { title: "📍 Lugar",    description: "Coliseo Guillermo Angulo, Carolina, Puerto Rico",    color: "#2070B8" },
      { title: "📅 Fechas",   description: "Sábado 16 y Domingo 17 de mayo de 2026",            color: "#C0185A" },
      { title: "🕔 Hora",     description: "5:00 PM – 9:00 PM cada noche",                      color: "#7c3aed" },
      { title: "🎟️ Entrada",  description: "¡Libre de costo! Invita a toda tu familia y amigos", color: "#059669" },
    ],
  },
  speakers: {
    heading: "Programa Especial",
    body: "🎤 Orador Principal: Dr. Wesley Paul — evangelista internacional desde Luis Palau Ministries\n\n🎭 Chagy Adorno — ilusionista y payaso gospel desde La Perla\n\n🎵 Sábado 16 de mayo: Yamiel Osorio (líder de alabanza)\n\n🎵 Domingo 17 de mayo: Misael Roldán (líder de adoración)\n\n✝️ Testimonio impactante: Christopher Metivier\n\nAuspiciado por: Viva Carolina y Wesley Paul International Ministries\nEn colaboración con la Oficina de Base de Fe y las iglesias locales.",
    align: "center",
    bg_color: "#0a1523",
    bg_image: "/uploads/carolina-para-cristo-speakers.jpg",
    bg_overlay: 78,
  },
  contact: {
    address: "Coliseo Guillermo Angulo, Carolina, Puerto Rico",
    email: "info@wesleypaul.org",
    phone: "+1 (859) 806-6424",
    hours: "Evento: 16 y 17 de mayo de 2026 · 5:00 PM – 9:00 PM",
  },
};

const enPostContent = `<p>Prepare yourself for two nights that will mark your life forever! On May 16 and 17, from 5:00 PM to 9:00 PM, the churches of Carolina come together for an extraordinary event filled with faith, hope, and salvation.</p>

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

const esPostContent = `<p>¡Prepárate para dos noches que marcarán tu vida para siempre! Este 16 y 17 de mayo, desde las 5:00 PM hasta las 9:00 PM, las iglesias de Carolina se unen en un evento extraordinario lleno de fe, esperanza y salvación.</p>

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

export async function POST(request: Request) {
  if (!getAdminFromRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const results: string[] = [];
  const sectionMap = [
    { id: 59, enContent: EN.header,   esContent: ES.header   },
    { id: 60, enContent: EN.twoCol,   esContent: ES.twoCol   },
    { id: 61, enContent: EN.cards,    esContent: ES.cards    },
    { id: 62, enContent: EN.speakers, esContent: ES.speakers },
    { id: 63, enContent: EN.contact,  esContent: ES.contact  },
  ];

  // ── 1. Flip every section: default = EN, es translation = Spanish ─────────────
  for (const { id, enContent, esContent } of sectionMap) {
    try {
      const enJson = JSON.stringify(enContent);
      const esJson = JSON.stringify(esContent);
      // Set the default content_json to English
      await pool.execute("UPDATE page_sections SET content_json=? WHERE id=?", [enJson, id]);
      // Upsert EN translation (mirrors default — ensures admin preview works)
      await pool.execute(
        "INSERT INTO section_translations (section_id,language_code,content_json,status) VALUES (?,'en',?,'reviewed') ON DUPLICATE KEY UPDATE content_json=?,status='reviewed'",
        [id, enJson, enJson]
      );
      // Upsert ES translation
      await pool.execute(
        "INSERT INTO section_translations (section_id,language_code,content_json,status) VALUES (?,'es',?,'reviewed') ON DUPLICATE KEY UPDATE content_json=?,status='reviewed'",
        [id, esJson, esJson]
      );
      results.push(`✅ Section ${id}: default=EN, es translation updated`);
    } catch (e) { results.push(`❌ Section ${id} error: ${String(e)}`); }
  }

  // ── 2. Event post: default = English, es in translations_json ────────────────
  try {
    const translationsJson = JSON.stringify({
      es: {
        title: "¡Carolina Para Cristo! — Gran Campaña Evangelística",
        excerpt: "¡Prepárate para dos noches que marcarán tu vida para siempre! Sábado 16 y Domingo 17 de mayo de 2026 · 5:00 PM – 9:00 PM · Coliseo Guillermo Angulo, Carolina, PR · ¡Entrada libre!",
        content: esPostContent,
      },
    });
    await pool.execute(
      `UPDATE posts SET
        title       = 'Carolina For Christ! — Great Evangelistic Campaign',
        excerpt     = 'Prepare for two nights that will mark your life forever! Saturday May 16 & Sunday May 17, 2026 · 5:00 PM – 9:00 PM · Coliseo Guillermo Angulo, Carolina, PR · Free admission!',
        content     = ?,
        translations_json = ?
       WHERE slug   = 'carolina-para-cristo'`,
      [enPostContent, translationsJson]
    );
    results.push("✅ Event post: default=EN, es translation stored");
  } catch (e) { results.push(`❌ Post error: ${String(e)}`); }

  // ── 3. Event promo tab: default = English, translations.es = Spanish ──────────
  try {
    const promoTab = JSON.stringify({
      enabled: true,
      tab_label: "Event!",
      title: "Carolina for Christ!",
      subtitle: "May 16 & 17 · 5 PM · Coliseo Guillermo Angulo · Free admission!",
      event_date: "2026-05-16T17:00:00",
      image_url: "/uploads/carolina-para-cristo-poster.jpg",
      cta_label: "View Details",
      cta_href: "/events/carolina-para-cristo",
      translations: {
        es: {
          tab_label: "¡Evento!",
          title: "¡Carolina Para Cristo!",
          subtitle: "16 y 17 de mayo · 5 PM · Coliseo Guillermo Angulo · ¡Entrada libre!",
          cta_label: "Ver Detalles",
        },
      },
    });
    await pool.execute(
      "INSERT INTO site_settings (setting_key,setting_value) VALUES ('event_promo_tab',?) ON DUPLICATE KEY UPDATE setting_value=?",
      [promoTab, promoTab]
    );
    results.push("✅ Event promo tab: default=EN, es translation stored");
  } catch (e) { results.push(`❌ Promo tab error: ${String(e)}`); }

  // ── 4. Popup: default = English, translations.es = Spanish ───────────────────
  try {
    const popup = JSON.stringify({
      enabled: true,
      type: "image",
      media_url: "/uploads/carolina-para-cristo-poster.jpg",
      poster_url: "",
      title: "Carolina for Christ!",
      description: "Two nights of faith, salvation & praise! May 16 & 17, 2026 · 5:00 PM · Coliseo Guillermo Angulo, Carolina · Free admission!",
      cta_label: "View Details!",
      cta_href: "/events/carolina-para-cristo",
      cta_external: false,
      show_once: true,
      show_delay: 2,
      home_only: false,
      show_media: true,
      translations: {
        es: {
          title: "¡Carolina Para Cristo!",
          description: "¡Dos noches de fe, salvación y alabanza! 16 y 17 de mayo de 2026 · 5:00 PM · Coliseo Guillermo Angulo, Carolina · ¡Entrada libre!",
          cta_label: "¡Ver Detalles!",
        },
      },
    });
    await pool.execute(
      "INSERT INTO site_settings (setting_key,setting_value) VALUES ('promo_popup',?) ON DUPLICATE KEY UPDATE setting_value=?",
      [popup, popup]
    );
    results.push("✅ Popup: default=EN, es translation stored");
  } catch (e) { results.push(`❌ Popup error: ${String(e)}`); }

  return Response.json({ success: true, results });
}
