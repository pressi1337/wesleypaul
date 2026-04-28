-- Carolina for Christ page fixes
-- Run after any DB restore: mysql -uroot -ppassword wesleypaul_cms < scripts/fix-carolina-page.sql

-- 1. Ensure Decision Card form exists (id=1)
INSERT INTO forms (id, name, description, fields_json, success_message)
VALUES (1,
  'Carolina for Christ — Decision Card',
  'Supplementary decision card for Carolina for Christ gospel festival (May 16-17, 2026)',
  '[
    {"id":"salutation","type":"select","label":"Title","placeholder":"","required":false,"options":["Mr.","Mrs.","Miss"]},
    {"id":"full_name","type":"text","label":"Full Name","placeholder":"Enter your full name","required":true,"options":[]},
    {"id":"age","type":"number","label":"Approximate Age","placeholder":"","required":false,"options":[]},
    {"id":"address","type":"text","label":"Address (Street & Number)","placeholder":"Street address","required":false,"options":[]},
    {"id":"city","type":"text","label":"City","placeholder":"City","required":false,"options":[]},
    {"id":"state_province","type":"text","label":"State / Province","placeholder":"State or Province","required":false,"options":[]},
    {"id":"zip_code","type":"text","label":"Zip Code","placeholder":"Zip / Postal code","required":false,"options":[]},
    {"id":"phone","type":"phone","label":"Phone","placeholder":"Phone number","required":false,"options":[]},
    {"id":"email","type":"email","label":"Email","placeholder":"your@email.com","required":false,"options":[]},
    {"id":"decision_received","type":"checkbox","label":"Decision","placeholder":"Received Jesus Christ as Savior","required":false,"options":[]},
    {"id":"decision_interested","type":"checkbox","label":"","placeholder":"Interested but not yet decided","required":false,"options":[]},
    {"id":"decision_reconciliation","type":"checkbox","label":"","placeholder":"Reconciliation","required":false,"options":[]},
    {"id":"decision_special_need","type":"checkbox","label":"","placeholder":"Special Need","required":false,"options":[]},
    {"id":"inviter_name","type":"text","label":"Name of person who invited you","placeholder":"Full name","required":false,"options":[]},
    {"id":"inviter_church","type":"text","label":"Church of the person who invited you","placeholder":"Church name","required":false,"options":[]},
    {"id":"inviter_mobile","type":"phone","label":"Inviter''s Mobile Phone","placeholder":"Mobile number","required":false,"options":[]},
    {"id":"inviter_home","type":"phone","label":"Inviter''s Home Phone","placeholder":"Home number","required":false,"options":[]},
    {"id":"evangelical_church","type":"textarea","label":"Do you have (or have you had) a relationship with an evangelical church? If so, which one?","placeholder":"Church name or details","required":false,"options":[]},
    {"id":"visit_address","type":"text","label":"Address where you would like to be visited","placeholder":"Street address","required":false,"options":[]},
    {"id":"preferred_time","type":"text","label":"Preferred visit time","placeholder":"e.g. Weekday evenings","required":false,"options":[]},
    {"id":"occupation","type":"text","label":"Occupation","placeholder":"Your occupation","required":false,"options":[]}
  ]',
  'Thank you! Your decision card has been received. A counselor will follow up with you soon. God bless you!'
)
ON DUPLICATE KEY UPDATE
  name            = VALUES(name),
  fields_json     = VALUES(fields_json),
  success_message = VALUES(success_message);

-- 2. Fix section 63: point to form 1, fix labels
UPDATE page_sections
SET content_json = JSON_SET(
  content_json,
  '$.form_id',      1,
  '$.heading',      'Supplementary Decision Card',
  '$.submit_label', 'Submit Decision Card',
  '$.description',  '<p>Please complete this decision card so we can follow up with you personally and connect you with a local church. Your information is kept confidential.</p>'
)
WHERE id = 63;

-- 3. Fix section 61 card links (target=_blank)
UPDATE page_sections
SET content_json = JSON_SET(
  content_json,
  '$.items[2].description', '<ul><li><a href="https://www.empezandocondios.com/kit/" target="_blank" rel="noopener noreferrer">empezandocondios.com</a></li></ul>',
  '$.items[3].description', '<ol><li><a href="https://www.empezandocondios.com/kit/" target="_blank" rel="noopener noreferrer">empezandocondios.com</a></li></ol>'
)
WHERE id = 61;

-- 4. Fix section 60 CTA button label
UPDATE page_sections
SET content_json = JSON_SET(content_json, '$.cta_label', 'Register Now')
WHERE id = 60;

-- 5. Ensure video section exists for carolina page
INSERT INTO page_sections (id, page_id, section_type, sort_order, content_json)
VALUES (66, 4604, 'video_grid', 4,
  '{"heading":"Event Highlights","subtitle":"See what God is doing through Carolina for Christ","bg_light":false,"videos":[{"url":"/uploads/1777383002177.mp4","title":"Carolina for Christ – Promo Video 1"},{"url":"/uploads/1777383003180.mp4","title":"Carolina for Christ – Promo Video 2"}]}'
)
ON DUPLICATE KEY UPDATE
  section_type = VALUES(section_type),
  sort_order   = VALUES(sort_order),
  content_json = VALUES(content_json);

-- 6. Ensure media records for videos exist
INSERT INTO media (id, filename, file_path, original_name, alt_text, mime_type)
VALUES
  (40, '1777383002177.mp4', '/uploads/1777383002177.mp4', 'Carolina Para Cristo - Video 1.mp4', 'Carolina for Christ event video 1', 'video/mp4'),
  (41, '1777383003180.mp4', '/uploads/1777383003180.mp4', 'Carolina Para Cristo - Video 2.mp4', 'Carolina for Christ event video 2', 'video/mp4')
ON DUPLICATE KEY UPDATE file_path = VALUES(file_path);

SELECT 'Done' as status;
