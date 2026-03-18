import Link from 'next/link'
import {
  Building2, Users, FileText, Shield, BarChart3, MessageCircle,
  CheckCircle2, ArrowLeft, Zap, Globe, Lock, ChevronDown,
  Home, Scale, HardHat, UserCheck, FolderOpen, Star,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060d1f] text-white overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <ProjectTypesSection />
      <FeaturesSection />
      <HowItWorksSection />
      <RolesSection />
      <CTASection />
      <Footer />
    </div>
  )
}

/* ─── Navbar ─────────────────────────────────────────────────── */
function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5"
      style={{ background: 'rgba(6,13,31,0.85)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl animate-pulse-glow flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
            <Building2 size={18} className="text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-base font-bold tracking-tight">UrbanOS</p>
            <p className="text-[10px] text-blue-400/80 font-medium tracking-widest uppercase">Urban Renewal Platform</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <a href="#features" className="hover:text-white transition-colors">יתרונות</a>
          <a href="#how" className="hover:text-white transition-colors">איך עובד</a>
          <a href="#roles" className="hover:text-white transition-colors">למי מיועד</a>
        </div>

        <Link href="/login"
          className="glow-button rounded-xl px-5 py-2 text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
          כניסה למערכת
        </Link>
      </div>
    </nav>
  )
}

/* ─── Hero ───────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 grid-bg">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="max-w-7xl mx-auto px-6 w-full py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-fade-up">
            <div className="inline-flex items-center gap-2 glass-card shimmer-border rounded-full px-4 py-2 text-sm text-blue-300">
              <Zap size={14} className="text-yellow-400" />
              <span>פלטפורמה מקצועית לניהול התחדשות עירונית</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-black leading-tight tracking-tight">
              הניהול החכם
              <br />
              <span className="gradient-text">של התחדשות</span>
              <br />
              עירונית
            </h1>

            <p className="text-lg text-white/60 leading-relaxed max-w-xl">
              הפלטפורמה הדיגיטלית שמחברת יזמים, דיירים, עורכי דין ומפקחים —
              בפרויקט אחד, בשקיפות מלאה ובאפס ניירת.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/login"
                className="glow-button inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                התחל עכשיו
                <ArrowLeft size={18} />
              </Link>
              <a href="#how"
                className="glass-card inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white/80 hover:text-white transition-colors">
                <ChevronDown size={18} />
                איך עובד
              </a>
            </div>

            <div className="flex items-center gap-6 text-sm text-white/40">
              <div className="flex items-center gap-1.5"><Shield size={14} className="text-green-400" /><span>RLS Security</span></div>
              <div className="flex items-center gap-1.5"><Globe size={14} className="text-blue-400" /><span>ענן 24/7</span></div>
              <div className="flex items-center gap-1.5"><Lock size={14} className="text-purple-400" /><span>GDPR Ready</span></div>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center">
            <EcosystemDiagram />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Ecosystem Diagram ──────────────────────────────────────── */
function EcosystemDiagram() {
  const nodes = [
    { icon: '👷', label: 'יזם',      angle: 0 },
    { icon: '⚖️', label: 'עו"ד',     angle: 60 },
    { icon: '🏗️', label: 'מפקח',     angle: 120 },
    { icon: '🏠', label: 'דייר',     angle: 180 },
    { icon: '👥', label: 'נציג',     angle: 240 },
    { icon: '📋', label: 'מנהל',     angle: 300 },
  ]
  return (
    <div className="relative w-[360px] h-[360px] animate-float-slow">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 360 360">
        <defs>
          <radialGradient id="lg1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
          </radialGradient>
        </defs>
        {nodes.map((n, i) => {
          const rad = (n.angle * Math.PI) / 180
          const x2 = 180 + Math.cos(rad) * 125
          const y2 = 180 + Math.sin(rad) * 125
          return <line key={i} x1="180" y1="180" x2={x2} y2={y2}
            stroke="url(#lg1)" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.5" />
        })}
        <circle cx="180" cy="180" r="125" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="1" />
      </svg>

      {/* Center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 rounded-2xl animate-pulse-glow flex flex-col items-center justify-center gap-1 z-10"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
          <Building2 size={26} className="text-white" />
          <span className="text-[9px] text-white/80 font-bold tracking-widest">PROJECT</span>
        </div>
      </div>

      {/* Orbit nodes */}
      {nodes.map((n, i) => {
        const rad = (n.angle * Math.PI) / 180
        const x = 180 + Math.cos(rad) * 125 - 28
        const y = 180 + Math.sin(rad) * 125 - 28
        return (
          <div key={i} className="absolute w-14 h-14 rounded-xl glass-card flex flex-col items-center justify-center gap-0.5"
            style={{ left: x, top: y }}>
            <span className="text-xl leading-none">{n.icon}</span>
            <span className="text-[9px] text-white/60 font-medium">{n.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Stats ──────────────────────────────────────────────────── */
function StatsSection() {
  const stats = [
    { value: '9',    label: 'תפקידים ייעודיים' },
    { value: '100%', label: 'שקיפות מלאה' },
    { value: '24/7', label: 'גישה בענן' },
    { value: '0',    label: 'ניירת פיזית' },
  ]
  return (
    <section className="border-y border-white/5 py-10"
      style={{ background: 'linear-gradient(90deg,rgba(59,130,246,0.05),rgba(139,92,246,0.05))' }}>
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <div key={i} className="text-center animate-count-up" style={{ animationDelay: `${i * 0.15}s` }}>
            <p className="text-4xl font-black gradient-text">{s.value}</p>
            <p className="text-sm text-white/50 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─── Project Types ──────────────────────────────────────────── */
function ProjectTypesSection() {
  const types = [
    {
      icon: '🏗️',
      name: 'תמ"א 38 א — חיזוק',
      color: '#3b82f6',
      desc: 'חיזוק מבנה קיים מפני רעידות אדמה, הוספת ממ"ד ושיפורים מוגבלים.',
      bullets: [
        'דיירים נשארים בבית לאורך כל הבנייה',
        '66% הסכמה בעלי הדירות',
        'משך פרויקט: 3-5 שנים',
        'חוק חיזוק מבנים 2008',
      ],
      duration: '3-5 שנים',
    },
    {
      icon: '🏢',
      name: 'תמ"א 38 ב — הריסה ובנייה',
      color: '#8b5cf6',
      desc: 'הריסת הבניין הקיים ובניית בניין חדש ומודרני עם קומות נוספות ויחידות חדשות.',
      bullets: [
        'פינוי זמני ~3 שנים ממומן ביזם',
        '80% הסכמה — סף גבוה יותר',
        'משך פרויקט: 5-6 שנים',
        'הגדלה משמעותית של מספר הדירות',
      ],
      duration: '5-6 שנים',
    },
    {
      icon: '🏙️',
      name: 'פינוי-בינוי',
      color: '#10b981',
      desc: 'התחדשות עירונית רחבת היקף של מתחם שלם — בניינים מרובים ושכונה חדשה.',
      bullets: [
        'מינימום 24 יחידות דיור במתחם',
        '66% הסכמה (תיקון 2018)',
        'הכרזת עירייה ואישור תב"ע',
        'הגנות מיוחדות לדיירים קשישים',
      ],
      duration: '10-12 שנים',
    },
  ]

  return (
    <section id="types" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 text-sm text-green-300 mb-6">
            <Building2 size={14} className="text-green-400" /> סוגי פרויקטים
          </div>
          <h2 className="text-4xl font-black mb-4">3 סוגי התחדשות עירונית</h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">כל סוג מקבל שלבים, אבני דרך ותיאורים ייחודיים מותאמים אוטומטית בעת יצירת הפרויקט</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          {types.map((t, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 space-y-4 flex flex-col">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: `${t.color}20`, border: `1px solid ${t.color}30` }}
                >
                  {t.icon}
                </div>
                <div>
                  <h3 className="font-bold text-base leading-snug">{t.name}</h3>
                  <span
                    className="inline-block text-xs font-semibold rounded-full px-2 py-0.5 mt-0.5"
                    style={{ background: `${t.color}20`, color: t.color }}
                  >
                    {t.duration}
                  </span>
                </div>
              </div>
              <p className="text-white/55 text-sm leading-relaxed">{t.desc}</p>
              <ul className="space-y-1.5 flex-1">
                {t.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-white/60">
                    <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: t.color }} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Features ───────────────────────────────────────────────── */
function FeaturesSection() {
  const features = [
    { icon: <FolderOpen size={22} />, color: '#3b82f6', title: 'ניהול מסמכים חכם', desc: 'העלאה, אישור ומעקב של כל מסמך — תעודת זהות, נסח טאבו, חוזה, היתר ועוד. כל מסמך מסומן בסטטוס חי.' },
    { icon: <Users size={22} />,      color: '#8b5cf6', title: '9 תפקידים ייעודיים', desc: 'כל גורם בפרויקט רואה בדיוק את מה שרלוונטי לו — לא פחות, לא יותר.' },
    { icon: <BarChart3 size={22} />,  color: '#06b6d4', title: 'לוח בקרה מרכזי',   desc: 'מפת חום של מסמכים, התקדמות פרויקטים ואבני דרך — הכל בזמן אמת.' },
    { icon: <Shield size={22} />,     color: '#10b981', title: 'אבטחה ברמת בנק',   desc: 'Row Level Security מבטיח שכל משתמש רואה רק את הנתונים שמותר לו.' },
    { icon: <MessageCircle size={22} />, color: '#22c55e', title: 'WhatsApp Integration', desc: 'קישורי קבוצת WhatsApp ייעודיים לכל בניין ולכל פרויקט.' },
    { icon: <CheckCircle2 size={22} />, color: '#f59e0b', title: 'אבני דרך ייחודיות לכל סוג', desc: 'תמ"א 38 א, תמ"א 38 ב ופינוי-בינוי — כל סוג מקבל שלבים ותיאורים מותאמים מראש.' },
  ]
  return (
    <section id="features" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 text-sm text-blue-300 mb-6">
            <Star size={14} className="text-yellow-400" /> יתרונות המערכת
          </div>
          <h2 className="text-4xl font-black mb-4">כל מה שצריך לפרויקט מוצלח</h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">מהרגע שהפרויקט עולה ועד מסירת המפתחות — המערכת מנהלת הכל</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 space-y-3 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `${f.color}22`, color: f.color, border: `1px solid ${f.color}33` }}>
                {f.icon}
              </div>
              <h3 className="text-lg font-bold">{f.title}</h3>
              <p className="text-white/50 text-base leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── How It Works ───────────────────────────────────────────── */
function HowItWorksSection() {
  const steps = [
    { num: '01', icon: <Building2 size={26} />, color: '#3b82f6', title: 'מנהל מערכת יוצר פרויקט', desc: 'בוחר את סוג הפרויקט (תמ"א 38 א/ב או פינוי-בינוי), מגדיר בניינים ודירות, ממנה מנהל פרויקט.' },
    { num: '02', icon: <Users size={26} />,     color: '#8b5cf6', title: 'מנהל הפרויקט בונה צוות', desc: 'מוסיף דיירים, עורכי דין ומפקחים — כל אחד עם גישה מותאמת לתפקידו.' },
    { num: '03', icon: <FileText size={26} />,  color: '#06b6d4', title: 'כולם מעלים מסמכים',      desc: 'דיירים מעלים תעודות זהות ונסחי טאבו. היזם מעלה היתרים. כל מסמך עובר אישור דיגיטלי.' },
    { num: '04', icon: <BarChart3 size={26} />, color: '#10b981', title: 'מעקב ושקיפות מלאה',      desc: 'כולם רואים בזמן אמת איפה הפרויקט עומד — מאחוז השלמת המסמכים ועד ציר הזמן.' },
  ]
  return (
    <section id="how" className="py-24 grid-bg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 text-sm text-purple-300 mb-6">
            <Zap size={14} className="text-yellow-400" /> תהליך העבודה
          </div>
          <h2 className="text-4xl font-black mb-4">4 צעדים לפרויקט מנוהל</h2>
          <p className="text-white/50 text-lg">פשוט. מהיר. שקוף.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="relative glass-card shimmer-border rounded-2xl p-6 space-y-4">
              <span className="text-5xl font-black opacity-10 absolute top-4 left-4 select-none">{s.num}</span>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: `${s.color}20`, color: s.color, border: `1px solid ${s.color}30` }}>
                {s.icon}
              </div>
              <h3 className="text-lg font-bold leading-snug">{s.title}</h3>
              <p className="text-white/50 text-base leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Roles ──────────────────────────────────────────────────── */
function RolesSection() {
  const roles = [
    { icon: <Shield size={18} />,     color: '#f59e0b', title: 'מנהל מערכת',           desc: 'שולט בהכל — פרויקטים, משתמשים, מסמכים.' },
    { icon: <FolderOpen size={18} />, color: '#3b82f6', title: 'מנהל פרויקט',           desc: 'מנהל פרויקט ספציפי, מוסיף צוות ומעקב.' },
    { icon: <Home size={18} />,       color: '#06b6d4', title: 'דייר',                  desc: 'מעלה מסמכים ועוקב אחרי הפרויקט שלו.' },
    { icon: <UserCheck size={18} />,  color: '#8b5cf6', title: 'נציג דיירים',           desc: 'מייצג את הדיירים ועוקב אחרי תהליכים.' },
    { icon: <Scale size={18} />,      color: '#ec4899', title: 'עו"ד דיירים',           desc: 'סקירה משפטית של מסמכי הפרויקט.' },
    { icon: <BarChart3 size={18} />,  color: '#10b981', title: 'מפקח מטעם הדיירים',   desc: 'מאשר מסמכים ומפקח על התקדמות.' },
    { icon: <Building2 size={18} />,  color: '#f97316', title: 'יזם',                  desc: 'מנהל את הפרויקט ומעלה תוכניות והיתרים.' },
    { icon: <Scale size={18} />,      color: '#a78bfa', title: 'עו"ד יזם',             desc: 'ייעוץ משפטי ליזם וסקירת חוזים.' },
    { icon: <HardHat size={18} />,    color: '#fb923c', title: 'מפקח מטעם היזם',      desc: 'מנהל מסמכים בשטח ומעדכן אבני דרך.' },
  ]
  return (
    <section id="roles" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 text-sm text-cyan-300 mb-6">
            <Users size={14} /> ניהול תפקידים
          </div>
          <h2 className="text-4xl font-black mb-4">למי מיועדת המערכת?</h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">9 תפקידים ייעודיים — כל אחד רואה בדיוק מה שרלוונטי לו</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r, i) => (
            <div key={i} className="glass-card rounded-xl p-4 flex items-start gap-4 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ background: `${r.color}20`, color: r.color, border: `1px solid ${r.color}30` }}>
                {r.icon}
              </div>
              <div>
                <p className="font-semibold text-base">{r.title}</p>
                <p className="text-white/45 text-sm mt-0.5 leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── CTA ────────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="relative rounded-3xl p-12 overflow-hidden"
          style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.3)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%,rgba(59,130,246,0.2),transparent 70%)' }} />
          <div className="relative space-y-6">
            <div className="w-16 h-16 rounded-2xl mx-auto animate-pulse-glow flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
              <Zap size={28} className="text-white" />
            </div>
            <h2 className="text-4xl font-black">מוכן להתחיל?</h2>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              הפרויקט שלך מחכה. היכנס למערכת ותתחיל לנהל בצורה חכמה.
            </p>
            <Link href="/login"
              className="glow-button inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
              כניסה למערכת <ArrowLeft size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Footer ─────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
            <Building2 size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white/70">UrbanOS — פלטפורמת התחדשות עירונית</span>
        </div>
        <p className="text-sm text-white/30">© 2025 · Supabase + Next.js · אבטחת מידע ברמה גבוהה</p>
      </div>
    </footer>
  )
}
