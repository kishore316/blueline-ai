import React, { useState, useEffect, useRef } from "react";

const ACCENT = {
  defend: { main: "#3dd6f5", dim: "rgba(61,214,245,0.12)" },
  attack: { main: "#ff6b4a", dim: "rgba(255,107,74,0.12)" },
};

const TERMINAL_LINES = [
  "$ blueline monitor --target demo-app.internal",
  "[09:14:02] scanning auth logs...",
  "[09:14:04] 14 failed logins from 91.203.44.x flagged as WARN",
  "[09:14:05] cross-referencing OpenCTI threat intel...",
  "[09:14:06] recommendation: temporary IP block + MFA prompt",
];

const SAMPLE_EVENTS = [
  ["OK", "auth", "successful login — user jgupta@company.com"],
  ["OK", "net", "routine health check from internal monitor"],
  ["WARN", "auth", "3 failed logins — user kaggarwal"],
  ["ALERT", "net", "unusual outbound traffic to known C2 range"],
  ["OK", "auth", "successful login — user kishore.k"],
  ["WARN", "file", "unexpected write to /etc/cron.d"],
  ["ALERT", "auth", "14 failed logins from single IP — 91.203.44.x"],
  ["OK", "net", "TLS handshake completed normally"],
  ["WARN", "email", "attachment with double extension detected"],
  ["OK", "auth", "MFA challenge passed"],
];

const QUICK_QUESTIONS = [
  { key: "why", q: "Why did I get 14 failed logins from one IP?", a: "Those 14 attempts came from a single IP outside your usual login regions, all within 40 seconds — that pattern matches a credential-stuffing attempt, not a typo-prone user. I'd suggest a temporary block on that IP and enabling MFA for the account it targeted." },
  { key: "patch", q: "What should I patch first this week?", a: "Based on this week's scan, prioritize the outdated TLS config on port 443 first — it's rated Critical and is the easiest entry point. The exposed admin panel with default credentials should be next." },
  { key: "phish", q: "Is this email a phishing attempt?", a: "Looking at the sender domain and the urgency language in the message, this matches common phishing patterns — mismatched reply-to address, a lookalike domain, and a request to act within the hour. I'd recommend quarantining it and warning the recipient." },
];

const SCAN_RESULTS = [
  { label: "CVE-2024-31XX · Outdated TLS config on port 443", sev: "Critical" },
  { label: "Exposed admin panel with default credentials", sev: "High" },
  { label: "Missing rate limiting on /api/login", sev: "Medium" },
  { label: "Verbose error messages leak stack traces", sev: "Low" },
];

const SEV_COLORS = {
  Critical: { bg: "rgba(255,107,74,0.15)", fg: "#ff6b4a" },
  High: { bg: "rgba(251,191,36,0.15)", fg: "#fbbf24" },
  Medium: { bg: "rgba(61,214,245,0.15)", fg: "#3dd6f5" },
  Low: { bg: "rgba(148,163,184,0.15)", fg: "#94a3b8" },
};

const SERVICES = [
  { icon: "💬", title: "AI Security Assistant", desc: "Ask plain-language questions about your security posture and get grounded, sourced answers via RAG.", tag: "Chat · API", jump: "chat" },
  { icon: "🛰️", title: "Threat Detection", desc: "Streams and classifies live log activity, flagging anomalies as OK, Warning, or Alert in real time.", tag: "Dashboard", jump: "feed" },
  { icon: "🧪", title: "Vulnerability Scanning", desc: "Runs a lightweight pentest sweep and returns ranked findings by severity, mapped to CVEs.", tag: "Dashboard · API", jump: "scan" },
  { icon: "🎣", title: "Phishing Detection", desc: "Screens inbound messages for phishing indicators and explains why something was flagged.", tag: "API · Email", jump: "chat" },
  { icon: "🚑", title: "Incident Response", desc: "Suggests concrete next steps when an alert fires — contain, isolate, escalate, or dismiss.", tag: "Dashboard", jump: "feed" },
  { icon: "📚", title: "Threat Intelligence", desc: "Pulls current threat intel from OpenCTI to keep detections and recommendations up to date.", tag: "API", jump: "access" },
];

const ACCESS_CARDS = [
  { icon: "🖥️", title: "Web Dashboard", desc: "The main surface — live threat feed, scan results, and chat in one view. This page is a preview of it.", code: "app.blueline.ai/login\n→ SSO or email + passkey", badge: "Shown above in Live Demo" },
  { icon: "🔌", title: "REST API", desc: "Pull detections or trigger a scan programmatically from your own tools.", code: 'POST /v1/scan\n{ "target": "demo-app.internal" }\n\nGET /v1/threats?since=24h', badge: "Simulated endpoint · not live" },
  { icon: "💬", title: "Slack / Teams Bot", desc: "Ask Blueline questions or get alerts pushed straight into your team's channel.", code: '/blueline ask "any critical alerts today?"', badge: "Planned for post-hackathon build" },
  { icon: "⌨️", title: "CLI", desc: "For engineers who'd rather scan from the terminal during a deploy.", code: "$ blueline scan --target demo-app.internal", badge: "Planned for post-hackathon build" },
];

const STACK = ["Llama 3.1 (LLM)", "LangChain", "RAG", "OpenCTI", "Wazuh API", "Greenbone API", "React", "FastAPI", "PostgreSQL", "Docker", "NIST Framework"];

export default function BluelineAI() {
  const [mode, setMode] = useState("defend");
  const [activeTab, setActiveTab] = useState("chat");
  const [typedLines, setTypedLines] = useState([]);
  const [feed, setFeed] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    { role: "ai", text: "Hi, I'm Blueline. Ask me about your logs, a CVE, or pick a question below to see how I respond." },
  ]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanDone, setScanDone] = useState(false);

  const accent = ACCENT[mode];
  const chatLogRef = useRef(null);
  const feedRef = useRef(null);
  const feedIndex = useRef(0);
  const demoRef = useRef(null);

  // Hero typing effect
  useEffect(() => {
    let lineIdx = 0;
    let charIdx = 0;
    let timeoutId;
    const step = () => {
      if (lineIdx >= TERMINAL_LINES.length) return;
      charIdx++;
      const full = TERMINAL_LINES[lineIdx];
      setTypedLines((prev) => {
        const completed = TERMINAL_LINES.slice(0, lineIdx);
        return [...completed, full.slice(0, charIdx)];
      });
      if (charIdx < full.length) {
        timeoutId = setTimeout(step, 18);
      } else {
        lineIdx++;
        charIdx = 0;
        timeoutId = setTimeout(step, 500);
      }
    };
    step();
    return () => clearTimeout(timeoutId);
  }, []);

  // Threat feed simulation
  useEffect(() => {
    const pushLine = () => {
      const [lvl, src, msg] = SAMPLE_EVENTS[feedIndex.current % SAMPLE_EVENTS.length];
      feedIndex.current++;
      const t = new Date().toLocaleTimeString("en-US", { hour12: false });
      setFeed((prev) => {
        const next = [...prev, { lvl, src, msg, t, id: Math.random() }];
        return next.length > 40 ? next.slice(next.length - 40) : next;
      });
    };
    for (let i = 0; i < 6; i++) pushLine();
    const iv = setInterval(pushLine, 2200);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (chatLogRef.current) chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
  }, [chatMessages]);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [feed]);

  const askQuestion = (item) => {
    setChatMessages((prev) => [...prev, { role: "user", text: item.q }]);
    setTimeout(() => {
      setChatMessages((prev) => [...prev, { role: "ai", text: item.a }]);
    }, 700);
  };

  const runScan = () => {
    setScanning(true);
    setScanDone(false);
    setScanProgress(0);
    const iv = setInterval(() => {
      setScanProgress((p) => {
        const next = p + Math.random() * 14;
        if (next >= 100) {
          clearInterval(iv);
          setScanning(false);
          setScanDone(true);
          return 100;
        }
        return next;
      });
    }, 220);
  };

  const jumpToDemo = (tab) => {
    setActiveTab(tab);
    demoRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ background: "#0a0e14", color: "#e7eef5", fontFamily: "'Space Grotesk', sans-serif", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .bl-mono { font-family: 'JetBrains Mono', monospace; }
        .bl-cursor { display:inline-block;width:7px;height:14px;vertical-align:middle;animation:bl-blink 1s steps(1) infinite; }
        @keyframes bl-blink { 50% { opacity: 0; } }
        .bl-scroll::-webkit-scrollbar { width: 6px; }
        .bl-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", background: "rgba(10,14,20,0.85)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: "1.1rem" }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: accent.main, boxShadow: `0 0 12px ${accent.main}`, transition: "all .4s" }} />
          BLUELINE-AI
        </div>
        <div style={{ display: "flex", gap: 28, fontSize: "0.85rem", color: "#8a9bae" }} className="hidden md:flex">
          {["Problem", "Services", "Live Demo", "Access", "Stack"].map((l) => (
            <span key={l} style={{ cursor: "default" }}>{l}</span>
          ))}
        </div>
        <div className="bl-mono" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.72rem", color: "#8a9bae" }}>
          <span>{mode === "defend" ? "DEFENDER MODE" : "ATTACKER MODE"}</span>
          <div
            onClick={() => setMode(mode === "defend" ? "attack" : "defend")}
            style={{ position: "relative", width: 52, height: 26, borderRadius: 20, background: "#131b26", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}
          >
            <div style={{ position: "absolute", top: 2, left: mode === "defend" ? 2 : 28, width: 20, height: 20, borderRadius: "50%", background: accent.main, boxShadow: `0 0 10px ${accent.main}`, transition: "left .3s ease, background .4s ease" }} />
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header style={{ position: "relative", padding: "100px 32px 80px", borderBottom: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 20% 0%, ${accent.dim}, transparent 55%)`, transition: "background .4s ease", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div className="bl-mono" style={{ fontSize: "0.75rem", color: accent.main, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 16, height: 1, background: accent.main }} />
            Prototype · Team Kernal Panic · SS26 AI Hackathon
          </div>
          <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.6rem)", fontWeight: 700, letterSpacing: "-0.02em", maxWidth: 780, lineHeight: 1.08, margin: 0 }}>
            Thinks like a <span style={{ color: accent.main, transition: "color .4s" }}>{mode === "defend" ? "defender." : "attacker."}</span><br />
            Tests like a hacker.
          </h1>
          <p style={{ marginTop: 22, maxWidth: 600, color: "#8a9bae", fontSize: "1.05rem" }}>
            Blueline-AI is a single assistant that watches your logs for threats, explains what's happening in plain language, and runs basic penetration tests to find the holes before someone else does — built for teams too small to have a dedicated security desk.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 34, flexWrap: "wrap" }}>
            <button onClick={() => jumpToDemo("chat")} style={{ fontWeight: 600, fontSize: "0.9rem", padding: "13px 24px", borderRadius: 8, border: "none", cursor: "pointer", background: accent.main, color: "#0a0e14", transition: "background .4s" }}>
              Try the live demo
            </button>
            <a href="#bl-access" style={{ fontWeight: 600, fontSize: "0.9rem", padding: "13px 24px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", color: "#e7eef5", textDecoration: "none" }}>
              How to access it
            </a>
          </div>

          <div style={{ marginTop: 56, background: "#0e141c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, maxWidth: 700, overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 6, padding: "10px 14px", background: "#131b26", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              {[0, 1, 2].map((i) => <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a4452" }} />)}
            </div>
            <div className="bl-mono" style={{ fontSize: "0.8rem", padding: "16px 18px", color: "#a9c6d6", minHeight: 110 }}>
              {typedLines.map((l, i) => (
                <div key={i}>
                  {l}
                  {i === typedLines.length - 1 && <span className="bl-cursor" style={{ background: accent.main }} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* PROBLEM */}
      <section style={{ padding: "90px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <SectionHead tag="The problem" title="Small teams, big attack surface" lede="Security tools today are complex, disconnected, and noisy — most small and mid-sized organizations simply can't staff a team to run them." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, overflow: "hidden" }}>
          {[
            ["82%", "of SMBs have no dedicated security analyst"],
            ["200+", "alerts a day, most never triaged"],
            ["3x", "rise in reported breach attempts YoY"],
            ["1", "assistant to defend and pentest"],
          ].map(([n, l]) => (
            <div key={l} style={{ background: "#0e141c", padding: "26px 22px" }}>
              <b className="bl-mono" style={{ fontSize: "1.9rem", display: "block", color: accent.main }}>{n}</b>
              <span style={{ fontSize: "0.82rem", color: "#8a9bae" }}>{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section style={{ padding: "90px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <SectionHead tag="What it does" title="Six services, one assistant" lede="Every card below is a live capability in the prototype — click one to jump into the matching demo." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {SERVICES.map((s) => (
            <div
              key={s.title}
              onClick={() => jumpToDemo(s.jump)}
              style={{ background: "#0e141c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 24, cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent.main; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: 14 }}>{s.icon}</div>
              <h3 style={{ fontSize: "1.02rem", marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: "0.85rem", color: "#8a9bae", margin: 0 }}>{s.desc}</p>
              <span className="bl-mono" style={{ display: "inline-block", marginTop: 14, fontSize: "0.68rem", padding: "4px 9px", borderRadius: 5, background: accent.dim, color: accent.main }}>{s.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* DEMO */}
      <section ref={demoRef} style={{ padding: "90px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <SectionHead tag="Try it now" title="Live demo" lede="This is a simulated walkthrough for the pitch — responses are pre-scripted to show the intended experience, not connected to a real backend." />
        <div style={{ background: "#0e141c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            {[["chat", "Ask the Assistant"], ["feed", "Threat Feed"], ["scan", "Run a Scan"]].map(([key, label]) => (
              <div
                key={key}
                onClick={() => setActiveTab(key)}
                style={{ flex: 1, padding: 16, textAlign: "center", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", color: activeTab === key ? "#e7eef5" : "#8a9bae", borderBottom: activeTab === key ? `2px solid ${accent.main}` : "2px solid transparent", transition: "all .2s" }}
              >
                {label}
              </div>
            ))}
          </div>

          {activeTab === "chat" && (
            <div style={{ padding: 26, minHeight: 340 }}>
              <div ref={chatLogRef} className="bl-mono bl-scroll" style={{ height: 230, overflowY: "auto", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 16, fontSize: "0.83rem", background: "#0a0e14", marginBottom: 14 }}>
                {chatMessages.map((m, i) => (
                  <div key={i} style={{ marginBottom: 14, maxWidth: "85%", marginLeft: m.role === "user" ? "auto" : 0, textAlign: m.role === "user" ? "right" : "left" }}>
                    <div style={{ fontSize: "0.65rem", color: "#8a9bae", marginBottom: 4, textTransform: "uppercase" }}>{m.role === "user" ? "You" : "Blueline-AI"}</div>
                    <div style={{ background: m.role === "user" ? accent.dim : "#131b26", padding: "10px 13px", borderRadius: 8, display: "inline-block", textAlign: "left" }}>{m.text}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {QUICK_QUESTIONS.map((item) => (
                  <div
                    key={item.key}
                    onClick={() => askQuestion(item)}
                    className="bl-mono"
                    style={{ fontSize: "0.72rem", padding: "8px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", background: "#0a0e14", cursor: "pointer", color: "#8a9bae" }}
                  >
                    {item.q}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "feed" && (
            <div style={{ padding: 26, minHeight: 340 }}>
              <div ref={feedRef} className="bl-mono bl-scroll" style={{ height: 280, overflowY: "auto", fontSize: "0.78rem", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 14, background: "#0a0e14" }}>
                {feed.map((f) => (
                  <div key={f.id} style={{ padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 10 }}>
                    <span style={{ color: "#8a9bae", width: 64, flexShrink: 0 }}>{f.t}</span>
                    <span style={{ width: 64, flexShrink: 0, fontWeight: 600, color: f.lvl === "OK" ? "#4ade80" : f.lvl === "WARN" ? "#fbbf24" : "#ff6b4a" }}>{f.lvl}</span>
                    <span>[{f.src}] {f.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "scan" && (
            <div style={{ padding: 26, minHeight: 340 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <button
                  onClick={runScan}
                  disabled={scanning}
                  style={{ padding: "11px 20px", fontWeight: 600, fontSize: "0.9rem", borderRadius: 8, border: "none", cursor: scanning ? "default" : "pointer", background: accent.main, color: "#0a0e14", opacity: scanning ? 0.7 : 1 }}
                >
                  {scanning ? "Scanning..." : "Run scan on demo-app.internal"}
                </button>
                <div style={{ flex: 1, height: 8, borderRadius: 6, background: "#0a0e14", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ height: "100%", width: `${scanProgress}%`, background: accent.main, transition: "width .15s linear" }} />
                </div>
              </div>
              {scanDone && (
                <div>
                  {SCAN_RESULTS.map((v) => (
                    <div key={v.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, marginBottom: 8, fontSize: "0.85rem" }}>
                      <span>{v.label}</span>
                      <span className="bl-mono" style={{ fontSize: "0.68rem", padding: "3px 9px", borderRadius: 5, fontWeight: 600, background: SEV_COLORS[v.sev].bg, color: SEV_COLORS[v.sev].fg }}>{v.sev}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ACCESS */}
      <section id="bl-access" style={{ padding: "90px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <SectionHead tag="How to access it" title="Four ways in" lede="In production, teams would reach Blueline through whichever surface fits their workflow. The snippets below illustrate the intended interface — they're mocked for this prototype." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {ACCESS_CARDS.map((c) => (
            <div key={c.title} style={{ background: "#0e141c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 22 }}>
              <h4 style={{ fontSize: "0.95rem", marginBottom: 6 }}>{c.icon} {c.title}</h4>
              <p style={{ color: "#8a9bae", fontSize: "0.82rem", marginBottom: 14 }}>{c.desc}</p>
              <div className="bl-mono" style={{ background: "#0a0e14", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "12px 14px", fontSize: "0.75rem", color: "#a9c6d6", overflowX: "auto", whiteSpace: "pre" }}>{c.code}</div>
              <span className="bl-mono" style={{ display: "inline-block", marginTop: 12, fontSize: "0.65rem", color: "#8a9bae", border: "1px dashed rgba(255,255,255,0.08)", padding: "4px 8px", borderRadius: 5 }}>{c.badge}</span>
            </div>
          ))}
        </div>
      </section>

      {/* STACK */}
      <section style={{ padding: "90px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <SectionHead tag="Under the hood" title="Technology stack" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {STACK.map((s) => (
            <span key={s} className="bl-mono" style={{ fontSize: "0.78rem", padding: "8px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", color: "#8a9bae", background: "#0e141c" }}>{s}</span>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "40px 32px", textAlign: "center", color: "#8a9bae", fontSize: "0.82rem" }} className="bl-mono">
        <strong style={{ color: "#e7eef5" }}>Blueline-AI</strong> · Team Kernal Panic · SS26 AI-First Hackathon<br />
        Track: AI for Industry, Business &amp; Productivity — this page is a functional prototype, not the production build.
      </footer>
    </div>
  );
}

function SectionHead({ tag, title, lede }) {
  return (
    <div style={{ marginBottom: 44 }}>
      <div className="bl-mono" style={{ fontSize: "0.72rem", color: "#8a9bae", letterSpacing: "0.1em", textTransform: "uppercase" }}>{tag}</div>
      <h2 style={{ fontSize: "1.9rem", fontWeight: 700, marginTop: 8, letterSpacing: "-0.01em" }}>{title}</h2>
      {lede && <p style={{ color: "#8a9bae", maxWidth: 620, marginTop: 10 }}>{lede}</p>}
    </div>
  );
}
