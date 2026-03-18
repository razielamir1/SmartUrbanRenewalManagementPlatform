-- ============================================================
-- 008_consent_and_types.sql
-- 1. Add 'hitarot_pratiyot' to project_type enum
-- 2. Add consent_status enum + columns to apartments
-- 3. Update seed_project_milestones for the new type
-- ============================================================

-- 1. Add new project type value
ALTER TYPE public.project_type ADD VALUE IF NOT EXISTS 'hitarot_pratiyot';

-- 2. Consent status enum
CREATE TYPE public.consent_status AS ENUM (
  'unsigned',          -- לא חתם (default — not yet reached)
  'unsigned_neutral',  -- לא חתם ולא מתנגד
  'signed',            -- חתם
  'objecting'          -- מתנגד
);

-- 3. Add consent columns to apartments
ALTER TABLE public.apartments
  ADD COLUMN consent_status    public.consent_status NOT NULL DEFAULT 'unsigned',
  ADD COLUMN consent_notes     text,
  ADD COLUMN consent_updated_at timestamptz;

-- 4. Trigger: auto-set consent_updated_at when consent_status changes
CREATE OR REPLACE FUNCTION public.set_consent_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.consent_status IS DISTINCT FROM OLD.consent_status THEN
    NEW.consent_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER apartments_consent_updated_at
  BEFORE UPDATE ON public.apartments
  FOR EACH ROW EXECUTE FUNCTION public.set_consent_updated_at();

-- 5. Replace seed function — now handles all 4 project types
--    (Must be run AFTER the hitarot_pratiyot value is committed to the enum)
CREATE OR REPLACE FUNCTION public.seed_project_milestones(
  p_project_id   uuid,
  p_project_type public.project_type DEFAULT 'pinui_binui'
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_project_type = 'tama38a' THEN
    INSERT INTO public.project_milestones (project_id, stage, label, label_en, description, sort_order) VALUES
      (p_project_id, 'pre_planning', 'ארגון דיירים ואישור ראשוני',      'Resident Organization',   'כינוס אסיפת בניין, השגת 66% חתימות בעלי דירות, מינוי נציגות דיירים ועורך דין', 1),
      (p_project_id, 'planning',     'בחירת יזם ותכנון הנדסי',           'Developer Selection',     'הערכת הצעות יזמים, בחירת יזם, סקר הנדסי, הכנת תוכניות חיזוק', 2),
      (p_project_id, 'permits',      'הגשה לוועדה וקבלת היתרים',        'Permits',                 'הגשת תוכניות לוועדה המקומית, טיפול בהתנגדויות, קבלת היתר בנייה', 3),
      (p_project_id, 'construction', 'חיזוק ובנייה — דיירים נשארים',     'Reinforcement Works',     'עבודות חיזוק השלד, הוספת ממ"ד, הרחבות ושיפור חזית — הדיירים ממשיכים לגור', 4),
      (p_project_id, 'finishing',    'גמר ובדיקות סופיות',               'Finishing & Inspections', 'בדיקות עירוניות סופיות, תיקון ליקויים, קבלת טופס 4', 5),
      (p_project_id, 'key_delivery', 'רישום ומסירה',                     'Registration & Handover', 'עדכון צו הבית המשותף, מסירת הדירות המשופצות לבעלים', 6);

  ELSIF p_project_type = 'tama38b' THEN
    INSERT INTO public.project_milestones (project_id, stage, label, label_en, description, sort_order) VALUES
      (p_project_id, 'pre_planning', 'ארגון דיירים — 80% אישורים חובה', 'Resident Organization',   'כינוס אסיפת בניין, השגת 80% חתימות חובה, מינוי נציגות דיירים ועורך דין', 1),
      (p_project_id, 'planning',     'בחירת יזם, היתכנות ותכנון',        'Planning & Design',       'הערכת יזמים, בדיקת כלכליות, חתימת הסכם, הכנת תוכניות בנייה מחדש', 2),
      (p_project_id, 'permits',      'הגשה לוועדה ואישורים',             'Permits',                 'הגשת תוכניות להריסה ובנייה, טיפול בהתנגדויות, קבלת היתרים', 3),
      (p_project_id, 'construction', 'פינוי, הריסה ובנייה מחדש',         'Demolition & Rebuild',    'מעבר הדיירים לדיור חלופי ממומן ביזם, הריסת הבניין, בנייה מחדש (~3 שנים)', 4),
      (p_project_id, 'finishing',    'גמר בנייה ובדיקות',                'Finishing & Inspections', 'בדיקות סופיות, קבלת טופס 4, תיאום חזרת הדיירים', 5),
      (p_project_id, 'key_delivery', 'חזרה לדירות ורישום',               'Return & Registration',   'מסירת דירות חדשות לבעלים, עדכון רישום טאבו', 6);

  ELSIF p_project_type = 'hitarot_pratiyot' THEN
    INSERT INTO public.project_milestones (project_id, stage, label, label_en, description, sort_order) VALUES
      (p_project_id, 'pre_planning', 'ייעוץ ראשוני ואיסוף מידע',         'Initial Consultation',    'פגישה עם אדריכל/מהנדס, בקשת תיק מידע מהרשות המקומית, בדיקת זכויות בנייה וחוקי תב"ע', 1),
      (p_project_id, 'planning',     'תכנון אדריכלי והנדסי',              'Architectural Planning',  'הכנת תוכניות בנייה, חישובים הנדסיים, תיאום עם חברת חשמל/מים/כבאות', 2),
      (p_project_id, 'permits',      'הגשת הבקשה ואישור הוועדה',         'Permit Application',      'הגשה רשמית לוועדה המקומית, בדיקת מהנדס עיר (30-90 יום), טיפול בהתנגדויות', 3),
      (p_project_id, 'construction', 'ביצוע בנייה ופיקוח',                'Construction & Oversight','ביצוע עבודות הבנייה לפי ההיתר, ביקורות עירוניות תקופתיות במהלך הבנייה', 4),
      (p_project_id, 'finishing',    'גמר ובדיקות סופיות',                'Finishing & Inspections', 'בדיקות גמר, תיקון ליקויים, הכנה לקבלת אישור אכלוס', 5),
      (p_project_id, 'key_delivery', 'קבלת טופס 4 ורישום',               'Occupancy Certificate',   'אישור אכלוס (טופס 4), חיבור שירותים, עדכון רישום הנכס', 6);

  ELSE -- pinui_binui (default)
    INSERT INTO public.project_milestones (project_id, stage, label, label_en, description, sort_order) VALUES
      (p_project_id, 'pre_planning', 'ארגון דיירים, נציגות ועו"ד',       'Resident Organization',   'ארגון ועד בית, מינוי עורך דין מנוסה, השגת 66% הסכמה — מינימום 24 יחידות דיור', 1),
      (p_project_id, 'planning',     'בחירת יזם, הסכמות ותכנון',         'Developer & Planning',    'הערכת יזמים, חתימת הסכם מחייב, תכנון מפורט, קביעת תמורות שוות לכל הדיירים', 2),
      (p_project_id, 'permits',      'הכרזת עירייה, תב"ע ואישורים',      'Municipal Declaration',   'הכרזת העירייה על מתחם להתחדשות, אישור תכנית בניין עיר (תב"ע), קבלת היתרי בנייה', 3),
      (p_project_id, 'construction', 'פינוי מתחם ובנייה',                 'Evacuation & Build',      'מעבר כל הדיירים לדיור חלופי (2-4 שנים), הריסה ובנייה מחדש בשלבים', 4),
      (p_project_id, 'finishing',    'גמר בנייה ובדיקות',                 'Finishing & Inspections', 'טופס 4 לכל בניין, תיאום חזרת דיירים, פיתוח סביבתי', 5),
      (p_project_id, 'key_delivery', 'חזרת דיירים ורישום',                'Return & Registration',   'מסירת דירות חדשות, עדכון טאבו, ייסוד ועדי הבתים החדשים', 6);
  END IF;
END;
$$;
