-- ============================================================
-- 007_project_type.sql
-- Add project_type enum and column to projects table.
-- Update seed_project_milestones() to be type-aware,
-- seeding different milestone labels/descriptions for each type.
-- ============================================================

-- 1. Add project_type enum
CREATE TYPE public.project_type AS ENUM ('tama38a', 'tama38b', 'pinui_binui');

-- 2. Add column (existing rows default to 'pinui_binui')
ALTER TABLE public.projects
  ADD COLUMN project_type public.project_type NOT NULL DEFAULT 'pinui_binui';

-- 3. Replace seed function with type-aware version
--    Signature adds p_project_type with a default so old callers still work.
CREATE OR REPLACE FUNCTION public.seed_project_milestones(
  p_project_id   uuid,
  p_project_type public.project_type DEFAULT 'pinui_binui'
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_project_type = 'tama38a' THEN
    -- תמ"א 38 א — חיזוק: residents stay throughout construction
    INSERT INTO public.project_milestones (project_id, stage, label, label_en, description, sort_order) VALUES
      (p_project_id, 'pre_planning', 'ארגון דיירים ואישור ראשוני',      'Resident Organization',   'כינוס אסיפת בניין, השגת 66% חתימות בעלי דירות, מינוי נציגות דיירים ועורך דין', 1),
      (p_project_id, 'planning',     'בחירת יזם ותכנון הנדסי',           'Developer Selection',     'הערכת הצעות יזמים, בחירת יזם, סקר הנדסי, הכנת תוכניות חיזוק', 2),
      (p_project_id, 'permits',      'הגשה לוועדה וקבלת היתרים',        'Permits',                 'הגשת תוכניות לוועדה המקומית, טיפול בהתנגדויות, קבלת היתר בנייה', 3),
      (p_project_id, 'construction', 'חיזוק ובנייה — דיירים נשארים',     'Reinforcement Works',     'עבודות חיזוק השלד, הוספת ממ"ד, הרחבות ושיפור חזית — הדיירים ממשיכים לגור בדירותיהם', 4),
      (p_project_id, 'finishing',    'גמר ובדיקות סופיות',               'Finishing & Inspections', 'בדיקות עירוניות סופיות, תיקון ליקויים, קבלת טופס 4', 5),
      (p_project_id, 'key_delivery', 'רישום ומסירה',                     'Registration & Handover', 'עדכון צו הבית המשותף, מסירת הדירות המשופצות לבעלים', 6);

  ELSIF p_project_type = 'tama38b' THEN
    -- תמ"א 38 ב — הריסה ובנייה מחדש: residents evacuated ~3 years
    INSERT INTO public.project_milestones (project_id, stage, label, label_en, description, sort_order) VALUES
      (p_project_id, 'pre_planning', 'ארגון דיירים — 80% אישורים חובה', 'Resident Organization',   'כינוס אסיפת בניין, השגת 80% חתימות חובה, מינוי נציגות דיירים ועורך דין', 1),
      (p_project_id, 'planning',     'בחירת יזם, היתכנות ותכנון',        'Planning & Design',       'הערכת יזמים, בדיקת כלכליות, חתימת הסכם, הכנת תוכניות בנייה מחדש', 2),
      (p_project_id, 'permits',      'הגשה לוועדה ואישורים',             'Permits',                 'הגשת תוכניות להריסה ובנייה, טיפול בהתנגדויות, קבלת היתרים', 3),
      (p_project_id, 'construction', 'פינוי, הריסה ובנייה מחדש',         'Demolition & Rebuild',    'מעבר הדיירים לדיור חלופי ממומן ביזם, הריסת הבניין, בנייה מחדש (~3 שנים)', 4),
      (p_project_id, 'finishing',    'גמר בנייה ובדיקות',                'Finishing & Inspections', 'בדיקות סופיות, קבלת טופס 4, תיאום חזרת הדיירים', 5),
      (p_project_id, 'key_delivery', 'חזרה לדירות ורישום',               'Return & Registration',   'מסירת דירות חדשות לבעלים, עדכון רישום טאבו', 6);

  ELSE
    -- פינוי-בינוי (default): multi-building, neighborhood-scale renewal
    INSERT INTO public.project_milestones (project_id, stage, label, label_en, description, sort_order) VALUES
      (p_project_id, 'pre_planning', 'ארגון דיירים, נציגות ועו"ד',       'Resident Organization',   'ארגון ועד בית, מינוי עורך דין מנוסה, השגת 66% הסכמה — מינימום 24 יחידות דיור', 1),
      (p_project_id, 'planning',     'בחירת יזם, הסכמות ותכנון',         'Developer & Planning',    'הערכת יזמים, חתימת הסכם מחייב, תכנון מפורט, קביעת תמורות שוות לכל הדיירים', 2),
      (p_project_id, 'permits',      'הכרזת עירייה, תב"ע ואישורים',      'Municipal Declaration',   'הכרזת העירייה על מתחם להתחדשות, אישור תכנית בניין עיר (תב"ע), קבלת היתרי בנייה', 3),
      (p_project_id, 'construction', 'פינוי מתחם ובנייה',                 'Evacuation & Build',      'מעבר כל הדיירים לדיור חלופי (2-4 שנים), הריסה ובנייה מחדש בשלבים — כולל הגנות מיוחדות לקשישים', 4),
      (p_project_id, 'finishing',    'גמר בנייה ובדיקות',                 'Finishing & Inspections', 'טופס 4 לכל בניין, תיאום חזרת דיירים, פיתוח סביבתי', 5),
      (p_project_id, 'key_delivery', 'חזרת דיירים ורישום',                'Return & Registration',   'מסירת דירות חדשות, עדכון טאבו, ייסוד ועדי הבתים החדשים', 6);
  END IF;
END;
$$;
