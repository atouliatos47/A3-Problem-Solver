import { useState, useRef, useEffect } from "react";

// Helper functions (unchanged)
function eh(s) { if (!s) return ""; return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function fd(d) { if (!d) return ""; try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; } }

// ── Pareto SVG (unchanged) ──────────────────────────────────────────────
function ParetoChart({ data }) {
  if (!data || !data.length) return null;
  const sorted = [...data].sort((a, b) => b.frequency - a.frequency);
  const tot = sorted.reduce((s, i) => s + i.frequency, 0);
  let cum = 0;
  const pd = sorted.map(item => { cum += item.frequency; return { ...item, cp: Math.round((cum / tot) * 100) }; });
  const W = 510, H = 148, pl = 36, pr = 36, pt = 8, pb = 36, plotW = W - pl - pr, plotH = H - pt - pb;
  const maxF = Math.max(...pd.map(d => d.frequency));
  const bW = Math.min(32, (plotW / pd.length) - 3);
  const xS = i => pl + (i + .5) * (plotW / pd.length);
  const yF = v => pt + plotH - (v / maxF) * plotH;
  const yP = p => pt + plotH - (p / 100) * plotH;
  const COLS = ["#2ecc71", "#27ae60", "#229954"];
  let linePath = "";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", maxHeight: 148 }}>
      <line x1={pl} y1={pt} x2={pl} y2={pt + plotH} stroke="#555" strokeWidth="1" />
      <line x1={pl} y1={pt + plotH} x2={W - pr} y2={pt + plotH} stroke="#555" strokeWidth="1" />
      {pd.map((item, i) => {
        const x = xS(i), bH = (item.frequency / maxF) * plotH, col = COLS[Math.min(i, 2)];
        const py = yP(item.cp);
        if (i === 0) linePath = `M ${x} ${py}`; else linePath += ` L ${x} ${py}`;
        const lbl = item.category.length > 9 ? item.category.slice(0, 8) + "…" : item.category;
        return (
          <g key={i}>
            <rect x={x - bW / 2} y={yF(item.frequency)} width={bW} height={bH} fill={col} rx="2" />
            <text x={x} y={yF(item.frequency) - 2} textAnchor="middle" fontSize="7" fill="#ccc" fontWeight="600">{item.frequency}</text>
            <text x={x} y={H - 3} textAnchor="middle" fontSize="6.5" fill="#ccc">{lbl}</text>
            <circle cx={x} cy={py} r="2.5" fill="#e67e22" />
            <text x={x + 3} y={py - 2} fontSize="6" fill="#e67e22">{item.cp}%</text>
          </g>
        );
      })}
      <path d={linePath} stroke="#e67e22" strokeWidth="1.5" fill="none" />
      <line x1={pl} y1={yP(80)} x2={W - pr} y2={yP(80)} stroke="#f39c12" strokeWidth="1" strokeDasharray="3" opacity=".7" />
      <text x={pl + 2} y={yP(80) - 2} fontSize="6" fill="#f39c12">80%</text>
    </svg>
  );
}

// ── Fishbone SVG (colors adapted to theme via props) ────────────────────
function Fishbone({ fishbone, title, darkMode }) {
  const W = 510, H = 188, spY = H / 2;
  const cats = ["Man", "Machine", "Method", "Material", "Environment", "Measurement"];
  const cols = { Man: "#2ecc71", Machine: "#27ae60", Method: "#229954", Material: "#1e8449", Environment: "#16a085", Measurement: "#e67e22" };
  const pos = [{ x: 145, top: true }, { x: 278, top: true }, { x: 395, top: true }, { x: 145, top: false }, { x: 278, top: false }, { x: 395, top: false }];
  const prob = (title || "Problem").slice(0, 18);
  const bgColor = darkMode ? "#1a1a1a" : "#f9f9f9";
  const textColor = darkMode ? "#ccc" : "#333";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", maxHeight: 170, display: "block" }}>
      <rect width={W} height={H} fill={bgColor} rx="4" />
      <line x1="28" y1={spY} x2="425" y2={spY} stroke="#2ecc71" strokeWidth="3" />
      <polygon points={`425,${spY} 495,${spY - 12} 495,${spY + 12}`} fill="#2ecc71" />
      <rect x="497" y={spY - 15} width="60" height="30" rx="3" fill="#2ecc71" />
      <text x="527" y={spY + 4} textAnchor="middle" fontSize="6.5" fill="#000" fontWeight="700">{prob}</text>
      {cats.map((cat, i) => {
        const p = pos[i], bY = p.top ? 22 : H - 22, sJX = p.x + 16, col = cols[cat];
        const causes = (fishbone[cat] || []).slice(0, 3);
        return (
          <g key={cat}>
            <line x1={p.x} y1={bY} x2={sJX} y2={spY} stroke={col} strokeWidth="2" />
            <text x={p.x} y={p.top ? bY - 4 : bY + 10} textAnchor="middle" fontSize="7.5" fontWeight="700" fill={col}>{cat}</text>
            {causes.map((cause, ci) => {
              const t = (ci + 1) / (causes.length + 1);
              const bx = p.x + t * (sJX - p.x), by = bY + t * (spY - bY);
              const sx = bx - 24, sy = by + (p.top ? -7 : 7);
              const txt = cause.length > 15 ? cause.slice(0, 14) + "…" : cause;
              return (
                <g key={ci}>
                  <line x1={bx} y1={by} x2={sx} y2={sy} stroke={col} strokeWidth="1" opacity=".65" />
                  <text x={sx - 2} y={sy + (p.top ? -2 : 4)} textAnchor="end" fontSize="6" fill={textColor}>{txt}</text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

// ── Example datasets (unchanged) ─────────────────────────────────────────
const EXAMPLES = [
  {
    name: "Manufacturing Downtime",
    data: {
      rootCauseSummary: "The primary root cause is lack of preventive maintenance on the stamping press, combined with inadequate operator training on fault recognition.",
      fiveWhys: [
        "Because there is no scheduled maintenance for the press.",
        "Because the maintenance team is understaffed and focused on reactive repairs.",
        "Because management has not prioritised preventive maintenance.",
        "Because production targets leave no downtime for maintenance.",
        "Because the plant has always operated in a reactive mode."
      ],
      fishbone: {
        Man: "Untrained operators\nLack of awareness",
        Machine: "Worn bearings\nNo lubrication schedule",
        Method: "No standard work for setup",
        Material: "Inconsistent coil quality",
        Environment: "Hot and dusty",
        Measurement: "No OEE tracking"
      },
      countermeasures: "Implement weekly lubrication rounds, High\nTrain all operators on basic fault codes, Medium\nInstall vibration sensors, High\nCreate a preventive maintenance calendar, Medium",
      actionPlan: "Lubrication rounds, Maintenance, 1 week, Open\nOperator training, HR, 2 weeks, Open\nVibration sensors, Engineering, 1 month, Open\nPM calendar, Maintenance Manager, 2 weeks, Open",
      standardisation: "Add lubrication to daily checklist; include fault code training in new hire onboarding; review OEE weekly."
    }
  },
  {
    name: "Software Bug (IT)",
    data: {
      rootCauseSummary: "The bug originates from an unvalidated input field that causes a null pointer exception. The root cause is insufficient unit test coverage and code review process gaps.",
      fiveWhys: [
        "Because the application crashes when a special character is entered.",
        "Because the input sanitation function was omitted.",
        "Because the developer was not aware of that requirement.",
        "Because the requirements document did not specify input validation.",
        "Because the team lacks a standard security checklist."
      ],
      fishbone: {
        Man: "Junior developer\nLack of security training",
        Machine: "Old framework version",
        Method: "No code review checklist",
        Material: "Third-party library with known bugs",
        Environment: "Rushed deployment",
        Measurement: "No static analysis in CI"
      },
      countermeasures: "Add input validation, High\nUpdate to latest framework, Medium\nImplement mandatory code reviews, High\nAdd unit tests for edge cases, Medium",
      actionPlan: "Validation patch, Dev Team, 3 days, Open\nFramework upgrade, Lead Dev, 1 week, Open\nCode review policy, Tech Lead, 2 weeks, Open\nUnit tests, QA, 1 week, Open",
      standardisation: "Include input validation in coding standards; add security linter to CI pipeline."
    }
  },
  {
    name: "Customer Service Complaints",
    data: {
      rootCauseSummary: "Complaints stem from long response times and unclear return policy. Root cause: understaffed support team and outdated knowledge base.",
      fiveWhys: [
        "Because customers wait over 24 hours for a reply.",
        "Because the support team has only two people for 500 daily tickets.",
        "Because the company froze hiring due to budget.",
        "Because management underestimated support needs.",
        "Because there is no data on ticket volume trends."
      ],
      fishbone: {
        Man: "Understaffed\nLow morale",
        Machine: "Old ticketing system",
        Method: "No standard replies",
        Material: "Outdated FAQ",
        Environment: "High season",
        Measurement: "No SLA tracking"
      },
      countermeasures: "Hire two additional agents, High\nUpdate knowledge base, Medium\nImplement chatbot for common queries, Medium\nSet up SLA monitoring, Low",
      actionPlan: "Post job ads, HR, 1 week, Open\nKnowledge base update, Support Lead, 2 weeks, Open\nChatbot integration, IT, 1 month, Open\nSLA dashboard, IT, 2 weeks, Open",
      standardisation: "Monthly review of ticket trends; include support metrics in management dashboard."
    }
  }
];

// ── Main App ────────────────────────────────────────────────────────────
export default function A3Solver() {
  const [darkMode, setDarkMode] = useState(true); // true = dark, false = light
  const [view, setView] = useState("input");
  const [form, setForm] = useState({
    title: "", area: "", date: new Date().toISOString().slice(0, 10),
    owner: "", team: "", statement: "", currentMetric: "", target: "",
    currentDesc: "", machine: "", context: "", factors: "", manualData: ""
  });
  const [csvData, setCsvData] = useState([]);
  const [analysis, setAnalysis] = useState({
    rootCauseSummary: "",
    fiveWhys: ["", "", "", "", ""],
    fishbone: { Man: "", Machine: "", Method: "", Material: "", Environment: "", Measurement: "" },
    countermeasures: "",
    actionPlan: "",
    standardisation: ""
  });
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedExample, setSelectedExample] = useState(EXAMPLES[0].name);
  const fileRef = useRef();

  // PWA install state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setDeferredPrompt(null);
      setInstallable(false);
    });
  };

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Load example dataset
  const loadExample = (exampleName) => {
    const ex = EXAMPLES.find(e => e.name === exampleName);
    if (!ex) return;
    setAnalysis({
      rootCauseSummary: ex.data.rootCauseSummary,
      fiveWhys: ex.data.fiveWhys,
      fishbone: ex.data.fishbone,
      countermeasures: ex.data.countermeasures,
      actionPlan: ex.data.actionPlan,
      standardisation: ex.data.standardisation
    });
    showToast(`Loaded example: ${ex.name}`);
  };

  // CSV parse (unchanged)
  const parseCSVFile = (file) => {
    const r = new FileReader();
    r.onload = e => {
      const lines = e.target.result.split("\n").map(l => l.trim()).filter(Boolean);
      const rows = lines.slice(1).map(l => {
        const c = l.split(",").map(x => x.trim());
        return { category: c[0] || "", frequency: parseInt(c[1]) || 0, duration: parseInt(c[2]) || 0 };
      }).filter(x => x.category);
      setCsvData(rows);
      showToast(`Loaded ${rows.length} rows`);
    };
    r.readAsText(file);
  };

  const parseManual = () => {
    if (!form.manualData.trim()) return [];
    return form.manualData.split("\n").map(l => {
      const p = l.split(",").map(x => x.trim());
      return { category: p[0] || "", frequency: parseInt(p[1]) || 0, duration: parseInt(p[2]) || 0 };
    }).filter(x => x.category);
  };

  const getEventData = () => csvData.length ? csvData : parseManual();

  // Build result from all manual inputs
  const buildA3 = () => {
    const eventData = getEventData();

    const parseFishbone = (fb) => {
      const result = {};
      for (let cat in fb) {
        result[cat] = fb[cat].split("\n").map(s => s.trim()).filter(Boolean);
      }
      return result;
    };

    const fiveWhys = analysis.fiveWhys.map((because, idx) => ({
      why: idx === 0 ? "Why is the problem occurring?" :
        idx === 1 ? "Why is that happening?" :
          idx === 2 ? "Why does that occur?" :
            idx === 3 ? "Why is that the case?" :
              "Why does this root cause exist?",
      because: because || "—"
    }));

    const countermeasures = analysis.countermeasures.split("\n")
      .map(line => line.split(",").map(s => s.trim()))
      .filter(parts => parts[0])
      .map(parts => ({ action: parts[0], priority: parts[1] || "Medium" }));

    const actionPlan = analysis.actionPlan.split("\n")
      .map(line => line.split(",").map(s => s.trim()))
      .filter(parts => parts[0])
      .map(parts => ({
        action: parts[0],
        responsible: parts[1] || "—",
        dueDate: parts[2] || "—",
        status: parts[3] || "Open"
      }));

    setResult({
      formData: { ...form },
      eventData,
      rootCauseSummary: analysis.rootCauseSummary || "—",
      fiveWhys,
      fishbone: parseFishbone(analysis.fishbone),
      countermeasures: countermeasures.length ? countermeasures : [{ action: "—", priority: "" }],
      actionPlan: actionPlan.length ? actionPlan : [{ action: "—", responsible: "—", dueDate: "—", status: "Open" }],
      standardisation: analysis.standardisation || "—"
    });
    setView("a3");
  };

  // ── THEME STYLES ────────────────────────────────────────────
  const theme = {
    dark: {
      appBg: "#000000",
      appFg: "#f0f0f0",
      headerBg: "#111111",
      headerBorder: "#333",
      cardBg: "#1a1a1a",
      cardBorder: "#333",
      cardHeadBg: "#222",
      cardHeadBorder: "#444",
      inputBg: "#111",
      inputBorder: "#333",
      inputFg: "#f0f0f0",
      labelFg: "#aaa",
      dropZoneBg: "#0a0a0a",
      infoBoxBg: "rgba(46,204,113,.1)",
      infoBoxBorder: "rgba(46,204,113,.25)",
      infoBoxFg: "#aaa",
      toolbarBg: "#1a1a1a",
      toolbarBorder: "#333",
      toastBg: "#1a1a1a",
      toastBorderErr: "#e74c3c",
      toastBorderOk: "#2ecc71",
      a3wrapBg: "#333",
      a3headBg: "#1a1a1a",
      a3headBorder: "#2ecc71",
      a3bodyBorder: "#1a1a1a",
      a3cellBorder: "#ccc",
      a3textColor: "#333",
      stripBorder: "#ccc",
      stripLblFg: "#666",
      stripValFg: "#111",
      footerBg: "#f5f5f5",
      footerBorder: "#1a1a1a",
      footerFg: "#666",
    },
    light: {
      appBg: "#f5f5f5",
      appFg: "#222",
      headerBg: "#ffffff",
      headerBorder: "#ddd",
      cardBg: "#ffffff",
      cardBorder: "#ddd",
      cardHeadBg: "#f0f0f0",
      cardHeadBorder: "#ccc",
      inputBg: "#ffffff",
      inputBorder: "#ccc",
      inputFg: "#222",
      labelFg: "#555",
      dropZoneBg: "#fafafa",
      infoBoxBg: "rgba(46,204,113,.05)",
      infoBoxBorder: "rgba(46,204,113,.2)",
      infoBoxFg: "#555",
      toolbarBg: "#ffffff",
      toolbarBorder: "#ddd",
      toastBg: "#ffffff",
      toastBorderErr: "#e74c3c",
      toastBorderOk: "#2ecc71",
      a3wrapBg: "#ccc",
      a3headBg: "#2ecc71",
      a3headBorder: "#229954",
      a3bodyBorder: "#2ecc71",
      a3cellBorder: "#ddd",
      a3textColor: "#222",
      stripBorder: "#ddd",
      stripLblFg: "#777",
      stripValFg: "#222",
      footerBg: "#f0f0f0",
      footerBorder: "#2ecc71",
      footerFg: "#555",
    }
  };

  const t = darkMode ? theme.dark : theme.light;

  const s = {
    app: { fontFamily: "'Segoe UI',system-ui,sans-serif", background: t.appBg, color: t.appFg, minHeight: "100vh" },
    header: { background: t.headerBg, padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid " + t.headerBorder },
    logoRow: { display: "flex", alignItems: "center", gap: 10 },
    logoIcon: { width: 38, height: 38, background: "#2ecc71", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, color: "#000" },
    h1: { fontSize: 19, fontWeight: 700, margin: 0, color: darkMode ? "#fff" : "#222" },
    sub: { fontSize: 11, color: t.labelFg, margin: 0 },
    btn: (variant = "secondary", sm = false) => ({
      padding: sm ? "6px 13px" : "9px 18px",
      borderRadius: 8,
      cursor: "pointer",
      fontSize: sm ? 12 : 13,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontFamily: "inherit",
      background: variant === "primary" ? "#2ecc71" : variant === "success" ? "#27ae60" : darkMode ? "#333" : "#e0e0e0",
      color: variant === "secondary" ? (darkMode ? "#f0f0f0" : "#222") : "#000",
      border: variant === "secondary" ? (darkMode ? "1px solid #555" : "1px solid #ccc") : "none"
    }),
    wrap: { maxWidth: 840, margin: "0 auto", padding: 22 },
    card: { background: t.cardBg, border: "1px solid " + t.cardBorder, borderRadius: 10, marginBottom: 16, overflow: "hidden" },
    cardHead: { padding: "11px 17px", background: t.cardHeadBg, display: "flex", alignItems: "center", gap: 9, borderBottom: "1px solid " + t.cardHeadBorder, fontWeight: 600, fontSize: 13, color: darkMode ? "#fff" : "#222" },
    badge: () => ({ background: "#2ecc71", color: "#000", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700 }),
    cardBody: { padding: 17 },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 },
    grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 13 },
    field: { display: "flex", flexDirection: "column", gap: 5 },
    label: { fontSize: 11, fontWeight: 600, color: t.labelFg, textTransform: "uppercase", letterSpacing: .4 },
    input: { background: t.inputBg, border: "1px solid " + t.inputBorder, borderRadius: 7, padding: "8px 11px", color: t.inputFg, fontSize: 13, fontFamily: "inherit", width: "100%" },
    textarea: { background: t.inputBg, border: "1px solid " + t.inputBorder, borderRadius: 7, padding: "8px 11px", color: t.inputFg, fontSize: 13, fontFamily: "inherit", width: "100%", resize: "vertical", minHeight: 70 },
    select: { background: t.inputBg, border: "1px solid " + t.inputBorder, borderRadius: 7, padding: "8px 11px", color: t.inputFg, fontSize: 13, fontFamily: "inherit", width: "100%" },
    dropZone: { border: "2px dashed #444", borderRadius: 8, padding: 18, textAlign: "center", cursor: "pointer", marginBottom: 10, background: t.dropZoneBg },
    infoBox: { background: t.infoBoxBg, border: "1px solid " + t.infoBoxBorder, borderRadius: 8, padding: "11px 14px", marginBottom: 15, fontSize: 12, color: t.infoBoxFg },
    analyseZone: { textAlign: "center", padding: "26px 20px" },
    exampleBar: { background: t.inputBg, border: "1px solid " + t.inputBorder, borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
    // Toolbar
    toolbar: { background: t.toolbarBg, borderBottom: "1px solid " + t.toolbarBorder, padding: "9px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
    // A3 paper (these styles are for the white A3 preview; they remain mostly unchanged to keep the printed look)
    a3wrap: { padding: 22, background: t.a3wrapBg, minHeight: "calc(100vh - 52px)", overflowX: "auto" },
    a3: { width: 1160, background: "#fff", color: "#111", margin: "0 auto", boxShadow: "0 8px 40px rgba(0,0,0,.5)", fontFamily: "'Segoe UI',Arial,sans-serif", fontSize: 10.5, display: "grid", gridTemplateRows: "auto auto 1fr auto" },
    a3head: { background: t.a3headBg, color: "#fff", padding: "9px 15px", display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 15, borderBottom: "3px solid " + t.a3headBorder },
    a3body: { display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "2px solid " + t.a3bodyBorder },
    a3col: (right = false) => ({ display: "flex", flexDirection: "column", borderRight: right ? "none" : "2px solid " + t.a3bodyBorder }),
    a3cell: (grow = false) => ({ borderBottom: grow ? "none" : "1px solid " + t.a3cellBorder, padding: "6px 10px", flex: grow ? 1 : undefined }),
    cellTitle: { fontSize: 8.5, fontWeight: 800, color: darkMode ? "#1a1a1a" : "#2ecc71", textTransform: "uppercase", letterSpacing: .7, marginBottom: 4, paddingBottom: 3, borderBottom: "1px solid " + t.a3cellBorder, display: "flex", alignItems: "center", gap: 4 },
    cn: { background: darkMode ? "#1a1a1a" : "#2ecc71", color: "#fff", borderRadius: 3, width: 13, height: 13, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 7.5, flexShrink: 0 },
    a3text: { fontSize: 10, lineHeight: 1.5, color: t.a3textColor },
    strip: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", borderBottom: "2px solid " + t.a3bodyBorder },
    stripCell: { padding: "4px 9px", borderRight: "1px solid " + t.stripBorder },
    stripLbl: { fontSize: 7.5, fontWeight: 700, color: t.stripLblFg, textTransform: "uppercase", letterSpacing: .4 },
    stripVal: { fontSize: 10.5, fontWeight: 600, color: t.stripValFg, marginTop: 1 },
  };

  // ── INPUT VIEW ───────────────────────────────────────────
  if (view === "input") return (
    <div style={s.app}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={s.header}>
        <div style={s.logoRow}>
          <div style={s.logoIcon}>📋</div>
          <div><div style={s.h1}>A3 Problem Solver</div><div style={s.sub}>Clamason Industries · {darkMode ? "Dark" : "Light"} Mode</div></div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button style={s.btn("secondary", true)} onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
          {installable && (
            <button style={s.btn("primary", true)} onClick={handleInstallClick}>
              📲 Install App
            </button>
          )}
          <button style={s.btn("secondary", true)} onClick={() => { setResult(null); setCsvData([]); }}>↩ Reset</button>
        </div>
      </div>
      <div style={s.wrap}>
        <div style={s.infoBox}>💡 Fill in all sections below, or load an example to get started.</div>

        {/* Example selector */}
        <div style={s.exampleBar}>
          <span style={{ fontWeight: 600, color: t.labelFg }}>Load example:</span>
          <select style={{ ...s.select, width: 250 }} value={selectedExample} onChange={e => setSelectedExample(e.target.value)}>
            {EXAMPLES.map(ex => <option key={ex.name} value={ex.name}>{ex.name}</option>)}
          </select>
          <button style={s.btn("primary", true)} onClick={() => loadExample(selectedExample)}>📋 Load Example</button>
        </div>

        {/* Card 1 - Background */}
        <div style={s.card}>
          <div style={s.cardHead}><span style={s.badge()}>1</span> Problem Background</div>
          <div style={s.cardBody}>
            <div style={s.grid3}>
              <div style={s.field}><label style={s.label}>Problem Title</label><input style={s.input} value={form.title} onChange={e => upd("title", e.target.value)} placeholder="e.g. Press #3 Excessive Downtime" /></div>
              <div style={s.field}><label style={s.label}>Area / Department</label><input style={s.input} value={form.area} onChange={e => upd("area", e.target.value)} placeholder="e.g. Press Shop" /></div>
              <div style={s.field}><label style={s.label}>Date</label><input style={s.input} type="date" value={form.date} onChange={e => upd("date", e.target.value)} /></div>
            </div>
            <div style={{ ...s.grid2, marginTop: 12 }}>
              <div style={s.field}><label style={s.label}>Problem Owner</label><input style={s.input} value={form.owner} onChange={e => upd("owner", e.target.value)} placeholder="Name / Role" /></div>
              <div style={s.field}><label style={s.label}>Team Members</label><input style={s.input} value={form.team} onChange={e => upd("team", e.target.value)} placeholder="e.g. Maintenance, Production" /></div>
            </div>
            <div style={{ ...s.field, marginTop: 12 }}>
              <label style={s.label}>Problem Statement</label>
              <textarea style={s.textarea} value={form.statement} onChange={e => upd("statement", e.target.value)} rows={3} placeholder="What is happening? When? How often? What is the impact?" />
            </div>
          </div>
        </div>

        {/* Card 2 - Current Condition & Target */}
        <div style={s.card}>
          <div style={s.cardHead}><span style={s.badge()}>2</span> Current Condition &amp; Target</div>
          <div style={s.cardBody}>
            <div style={s.grid2}>
              <div style={s.field}><label style={s.label}>Current Metric</label><input style={s.input} value={form.currentMetric} onChange={e => upd("currentMetric", e.target.value)} placeholder="e.g. OEE = 54%, MTBF = 3 days" /></div>
              <div style={s.field}><label style={s.label}>Target / Goal</label><input style={s.input} value={form.target} onChange={e => upd("target", e.target.value)} placeholder="e.g. OEE ≥ 75%" /></div>
            </div>
            <div style={{ ...s.field, marginTop: 12 }}>
              <label style={s.label}>Description</label>
              <textarea style={s.textarea} value={form.currentDesc} onChange={e => upd("currentDesc", e.target.value)} rows={3} placeholder="Describe current state with observations..." />
            </div>
          </div>
        </div>

        {/* Card 3 - Event Data */}
        <div style={s.card}>
          <div style={s.cardHead}><span style={s.badge()}>3</span> Failure / Event Data <span style={{ fontSize: 11, color: t.labelFg, fontWeight: 400, marginLeft: 4 }}>— for Pareto chart (optional)</span></div>
          <div style={s.cardBody}>
            <p style={{ fontSize: 12, color: t.labelFg, marginBottom: 12 }}>CSV format: <code style={{ background: t.inputBg, padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>category,frequency,duration_mins</code></p>
            <div style={s.dropZone}
              onClick={() => fileRef.current.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) parseCSVFile(f); }}>
              <div style={{ fontSize: 26 }}>📂</div>
              <strong>Click to import CSV</strong>
              <div style={{ fontSize: 12, color: t.labelFg, marginTop: 4 }}>or drag and drop here</div>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) parseCSVFile(f); }} />
            </div>
            {csvData.length > 0 && (
              <div style={{ background: t.inputBg, border: "1px solid " + t.inputBorder, borderRadius: 7, padding: 11, marginBottom: 12, fontSize: 11 }}>
                <strong style={{ color: t.labelFg }}>Preview ({csvData.length} rows)</strong>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 6 }}>
                  <thead><tr>{["Category", "Frequency", "Duration"].map(h => <th key={h} style={{ background: t.cardHeadBg, padding: "4px 8px", textAlign: "left", color: t.labelFg, fontSize: 10 }}>{h}</th>)}</tr></thead>
                  <tbody>{csvData.slice(0, 5).map((r, i) => <tr key={i}><td style={{ padding: "3px 8px", borderTop: "1px solid " + t.inputBorder }}>{r.category}</td><td style={{ padding: "3px 8px", borderTop: "1px solid " + t.inputBorder }}>{r.frequency}</td><td style={{ padding: "3px 8px", borderTop: "1px solid " + t.inputBorder }}>{r.duration}</td></tr>)}</tbody>
                </table>
              </div>
            )}
            <div style={s.field}>
              <label style={s.label}>Or enter manually (Category, Frequency, Duration — one per line)</label>
              <textarea style={{ ...s.textarea, fontFamily: "monospace", fontSize: 12 }} value={form.manualData} onChange={e => upd("manualData", e.target.value)} rows={5} placeholder={"Die misalignment, 12, 45\nBearing failure, 8, 120\nSensor fault, 15, 20\nTooling wear, 6, 90"} />
            </div>
          </div>
        </div>

        {/* Card 4 - Context */}
        <div style={s.card}>
          <div style={s.cardHead}><span style={s.badge()}>4</span> Context</div>
          <div style={s.cardBody}>
            <div style={s.grid2}>
              <div style={s.field}><label style={s.label}>Machine / Process</label><input style={s.input} value={form.machine} onChange={e => upd("machine", e.target.value)} placeholder="e.g. 250T Stamping Press" /></div>
              <div style={s.field}><label style={s.label}>Context / Domain</label><input style={s.input} value={form.context} onChange={e => upd("context", e.target.value)} placeholder="e.g. Manufacturing, IT, Healthcare" /></div>
            </div>
            <div style={{ ...s.field, marginTop: 12 }}>
              <label style={s.label}>Known Contributing Factors</label>
              <textarea style={s.textarea} value={form.factors} onChange={e => upd("factors", e.target.value)} rows={3} placeholder="Anything you already suspect or have observed..." />
            </div>
          </div>
        </div>

        {/* Card 5 - Root Cause & 5-Whys */}
        <div style={s.card}>
          <div style={s.cardHead}><span style={s.badge()}>5</span> Root Cause Analysis</div>
          <div style={s.cardBody}>
            <div style={s.field}>
              <label style={s.label}>Root Cause Summary</label>
              <textarea style={s.textarea} value={analysis.rootCauseSummary} onChange={e => setAnalysis(a => ({ ...a, rootCauseSummary: e.target.value }))} rows={2} placeholder="Summarize the root cause(s) in 2-3 sentences" />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={s.label}>5‑Whys (enter the “because” answers only)</label>
              {[0, 1, 2, 3, 4].map(idx => (
                <div key={idx} style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <span style={{ background: "#2ecc71", color: "#000", borderRadius: "50%", width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>{idx + 1}</span>
                  <input style={s.input} value={analysis.fiveWhys[idx]} onChange={e => {
                    const newWhys = [...analysis.fiveWhys];
                    newWhys[idx] = e.target.value;
                    setAnalysis(a => ({ ...a, fiveWhys: newWhys }));
                  }} placeholder={`Why? (answer ${idx + 1})`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 6 - Fishbone */}
        <div style={s.card}>
          <div style={s.cardHead}><span style={s.badge()}>6</span> Fishbone Diagram (Ishikawa)</div>
          <div style={s.cardBody}>
            <p style={{ fontSize: 12, color: t.labelFg, marginBottom: 12 }}>Enter causes for each category, one per line.</p>
            <div style={s.grid2}>
              {["Man", "Machine", "Method", "Material", "Environment", "Measurement"].map(cat => (
                <div style={s.field} key={cat}>
                  <label style={s.label}>{cat}</label>
                  <textarea style={{ ...s.textarea, minHeight: 60 }} value={analysis.fishbone[cat]} onChange={e => setAnalysis(a => ({ ...a, fishbone: { ...a.fishbone, [cat]: e.target.value } }))} placeholder={`Causes for ${cat}...`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 7 - Countermeasures */}
        <div style={s.card}>
          <div style={s.cardHead}><span style={s.badge()}>7</span> Countermeasures</div>
          <div style={s.cardBody}>
            <div style={s.field}>
              <label style={s.label}>One per line: "action, priority" (High/Medium/Low)</label>
              <textarea style={s.textarea} value={analysis.countermeasures} onChange={e => setAnalysis(a => ({ ...a, countermeasures: e.target.value }))} rows={4} placeholder="Install sensor shield, High&#10;Train operators, Medium&#10;Update checklist, Low" />
            </div>
          </div>
        </div>

        {/* Card 8 - Action Plan */}
        <div style={s.card}>
          <div style={s.cardHead}><span style={s.badge()}>8</span> Action Plan</div>
          <div style={s.cardBody}>
            <div style={s.field}>
              <label style={s.label}>One per line: "action, responsible, due, status"</label>
              <textarea style={s.textarea} value={analysis.actionPlan} onChange={e => setAnalysis(a => ({ ...a, actionPlan: e.target.value }))} rows={4} placeholder="Install shield, Maintenance, 1 week, Open&#10;Train operators, HR, 2 weeks, Open" />
            </div>
          </div>
        </div>

        {/* Card 9 - Standardisation & Follow-up */}
        <div style={s.card}>
          <div style={s.cardHead}><span style={s.badge()}>9</span> Standardisation & Follow-up</div>
          <div style={s.cardBody}>
            <div style={s.field}>
              <label style={s.label}>How to sustain and prevent recurrence</label>
              <textarea style={s.textarea} value={analysis.standardisation} onChange={e => setAnalysis(a => ({ ...a, standardisation: e.target.value }))} rows={3} placeholder="Update work instructions, schedule audits..." />
            </div>
          </div>
        </div>

        <div style={s.analyseZone}>
          <button style={{ ...s.btn("success"), fontSize: 15, padding: "14px 36px" }} onClick={buildA3}>📄 Generate A3</button>
          <div style={{ fontSize: 12, color: t.labelFg, marginTop: 8 }}>Review your A3 document (printable)</div>
        </div>
      </div>
      {toast && <div style={{ position: "fixed", bottom: 20, right: 20, background: t.toastBg, border: `1px solid ${toast.type === "err" ? t.toastBorderErr : t.toastBorderOk}`, borderLeft: `4px solid ${toast.type === "err" ? t.toastBorderErr : t.toastBorderOk}`, borderRadius: 10, padding: "12px 16px", fontSize: 13, zIndex: 9999, boxShadow: "0 8px 30px rgba(0,0,0,.2)" }}>{toast.msg}</div>}
    </div>
  );

  // ── A3 VIEW ──────────────────────────────────────────────
  const r = result;
  const d = r.formData;
  const eventData = r.eventData;

  const priorityStyle = (p) => {
    if (p === "High") return { background: "#fde0e0", color: "#c0392b", borderRadius: 3, padding: "1px 4px", fontSize: 7.5, fontWeight: 700, marginLeft: 3 };
    if (p === "Medium") return { background: "#fef3c7", color: "#d97706", borderRadius: 3, padding: "1px 4px", fontSize: 7.5, fontWeight: 700, marginLeft: 3 };
    return { background: "#dcfce7", color: "#16a34a", borderRadius: 3, padding: "1px 4px", fontSize: 7.5, fontWeight: 700, marginLeft: 3 };
  };
  const statusStyle = (st) => st === "Done"
    ? { background: "#dcfce7", color: "#15803d", borderRadius: 3, padding: "1px 4px", fontSize: 7.5, fontWeight: 700 }
    : { background: "#dbeafe", color: "#1d4ed8", borderRadius: 3, padding: "1px 4px", fontSize: 7.5, fontWeight: 700 };

  const thStyle = { background: darkMode ? "#1a1a1a" : "#2ecc71", color: "#fff", padding: "3px 7px", textAlign: "left", fontSize: 8.5, fontWeight: 600 };
  const tdStyle = { padding: "3px 7px", borderBottom: "1px solid " + t.a3cellBorder, fontSize: 9.5 };
  const tdAlt = { ...tdStyle, background: darkMode ? "#f0f0f0" : "#f9f9f9" };

  return (
    <div style={s.app}>
      <style>{`@media print{@page{size:A3 landscape;margin:0}.no-print{display:none!important}.a3-wrap{background:transparent!important;padding:0!important}.a3-paper{width:100%!important;box-shadow:none!important}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`}</style>
      {/* Toolbar */}
      <div style={s.toolbar} className="no-print">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button style={s.btn("secondary", true)} onClick={() => setView("input")}>← Edit</button>
          <span style={{ fontSize: 12, color: t.labelFg }}>A3 ready — review then print</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={s.btn("secondary", true)} onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
          <button style={s.btn("primary", true)} onClick={() => window.print()}>🖨️ Print A3</button>
        </div>
      </div>
      {/* A3 Paper */}
      <div style={s.a3wrap} className="a3-wrap">
        <div style={s.a3} className="a3-paper">
          {/* Header */}
          <div style={s.a3head}>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -1 }}>A3</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{eh(d.title)}</div>
              <div style={{ fontSize: 9, opacity: .8, marginTop: 1 }}>Problem Solving A3 · {eh(d.area)} · {d.context || "General"}</div>
            </div>
            <div style={{ textAlign: "right", fontSize: 9, lineHeight: 1.7, opacity: .85 }}>
              Date: {fd(d.date)}<br />Owner: {eh(d.owner) || "—"}<br />Team: {eh(d.team) || "—"}
            </div>
          </div>
          {/* Strip */}
          <div style={s.strip}>
            {[["Title", d.title], ["Area", d.area], ["Machine / Process", d.machine], ["Current", d.currentMetric], ["Target", d.target]].map(([lbl, val]) => (
              <div key={lbl} style={s.stripCell}>
                <div style={s.stripLbl}>{lbl}</div>
                <div style={s.stripVal}>{val || "—"}</div>
              </div>
            ))}
          </div>
          {/* Body */}
          <div style={s.a3body}>
            {/* LEFT */}
            <div style={s.a3col()}>
              <div style={s.a3cell()}>
                <div style={s.cellTitle}><span style={s.cn}>1</span> Background &amp; Problem Statement</div>
                <p style={s.a3text}>{d.statement || "—"}</p>
                {d.currentDesc && <p style={{ ...s.a3text, marginTop: 4, color: "#555" }}>{d.currentDesc}</p>}
              </div>
              <div style={s.a3cell()}>
                <div style={s.cellTitle}><span style={s.cn}>2</span> {eventData.length ? "Current Condition — Pareto Analysis" : "Current Condition"}</div>
                {eventData.length
                  ? <ParetoChart data={eventData} />
                  : <><p style={s.a3text}>{d.currentDesc || "—"}</p><p style={{ ...s.a3text, marginTop: 4 }}><strong>Current:</strong> {d.currentMetric || "—"} | <strong>Target:</strong> {d.target || "—"}</p></>
                }
              </div>
              <div style={s.a3cell()}>
                <div style={s.cellTitle}><span style={s.cn}>3</span> Root Cause Summary</div>
                <p style={s.a3text}>{r.rootCauseSummary}</p>
              </div>
              <div style={s.a3cell(true)}>
                <div style={s.cellTitle}><span style={s.cn}>4</span> Fishbone Diagram (Ishikawa)</div>
                <Fishbone fishbone={r.fishbone} title={d.title} darkMode={darkMode} />
              </div>
            </div>
            {/* RIGHT */}
            <div style={s.a3col(true)}>
              <div style={s.a3cell()}>
                <div style={s.cellTitle}><span style={s.cn}>5</span> 5-Why Root Cause Analysis</div>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 3 }}>
                  <thead><tr><th style={{ ...thStyle, width: 24 }}>#</th><th style={thStyle}>Why?</th><th style={thStyle}>Because...</th></tr></thead>
                  <tbody>{r.fiveWhys.map((w, i) => (
                    <tr key={i}>
                      <td style={i % 2 ? tdAlt : tdStyle}><span style={{ background: "#2ecc71", color: "#000", borderRadius: "50%", width: 14, height: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700 }}>{i + 1}</span></td>
                      <td style={i % 2 ? tdAlt : tdStyle}>{w.why}</td>
                      <td style={i % 2 ? tdAlt : tdStyle}>{w.because}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div style={s.a3cell()}>
                <div style={s.cellTitle}><span style={s.cn}>6</span> Countermeasures</div>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {r.countermeasures.map((c, i) => (
                    <li key={i} style={{ padding: "2px 0 2px 13px", position: "relative", borderBottom: "1px solid #eee", fontSize: 10 }}>
                      <span style={{ position: "absolute", left: 0, color: "#2ecc71", fontWeight: 700 }}>→</span>
                      {c.action}<span style={priorityStyle(c.priority)}>{c.priority}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div style={s.a3cell(true)}>
                <div style={s.cellTitle}><span style={s.cn}>7</span> Implementation Plan</div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><th style={thStyle}>Action</th><th style={thStyle}>Responsible</th><th style={thStyle}>Due</th><th style={thStyle}>Status</th></tr></thead>
                  <tbody>{r.actionPlan.map((a, i) => (
                    <tr key={i}>
                      <td style={i % 2 ? tdAlt : tdStyle}>{a.action}</td>
                      <td style={i % 2 ? tdAlt : tdStyle}>{a.responsible}</td>
                      <td style={i % 2 ? tdAlt : tdStyle}>{a.dueDate}</td>
                      <td style={i % 2 ? tdAlt : tdStyle}><span style={statusStyle(a.status)}>{a.status}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div style={s.a3cell()}>
                <div style={s.cellTitle}><span style={s.cn}>8</span> Standardisation &amp; Follow-up</div>
                <p style={s.a3text}>{r.standardisation}</p>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div style={{ background: t.footerBg, borderTop: "2px solid " + t.footerBorder, padding: "4px 15px", display: "flex", justifyContent: "space-between", fontSize: 8.5, color: t.footerFg }}>
            <span>A3 Problem Solver · Clamason Industries</span>
            <span>Generated: {new Date().toLocaleString()}</span>
            <span>Confidential — Internal Use Only</span>
          </div>
        </div>
      </div>
      {toast && <div style={{ position: "fixed", bottom: 20, right: 20, background: t.toastBg, border: `4px solid ${toast.type === "err" ? t.toastBorderErr : t.toastBorderOk}`, borderRadius: 10, padding: "12px 16px", fontSize: 13, zIndex: 9999 }}>{toast.msg}</div>}
    </div>
  );
}