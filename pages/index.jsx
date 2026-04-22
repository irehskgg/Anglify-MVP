import { useState, useRef, useEffect } from "react";

const FRAMEWORKS = [
  { id: "curiosity", label: "Curiosity Gap", color: "#F5A623", icon: "◎" },
  { id: "contrarian", label: "Contrarian Take", color: "#E8394D", icon: "↯" },
  { id: "pain", label: "Pain Amplifier", color: "#C0392B", icon: "⚡" },
  { id: "story", label: "Story Hook", color: "#27AE60", icon: "◈" },
  { id: "authority", label: "Authority Shock", color: "#2980B9", icon: "▲" },
  { id: "pattern", label: "Pattern Interrupt", color: "#8E44AD", icon: "✦" },
  { id: "result", label: "Result Lead", color: "#16A085", icon: "→" },
];

const PLATFORMS = ["TikTok", "Reels", "Shorts", "All"];
const TONES = ["Educational", "Entertaining", "Inspiring", "Controversial"];

// ── helpers ──────────────────────────────────────────────────────────────────

function parseHooks(text) {
  const hooks = [];
  const lines = text.split("\n").map(s => s.trim()).filter(Boolean);

  let currentFramework = null;
  for (const line of lines) {
    // Detect framework headers like "**CURIOSITY GAP**" or "## Curiosity Gap"
    const headerMatch = line.match(/^[#*\-\s]*([A-Z][A-Za-z\s]+)[#*:—\-]*$/);
    if (headerMatch) {
      const name = headerMatch[1].trim().toLowerCase();
      const found = FRAMEWORKS.find(f =>
        name.includes(f.id) ||
        name.includes(f.label.toLowerCase().split(" ")[0])
      );
      if (found) { currentFramework = found; continue; }
    }
    // Detect hook lines: numbered, bulleted, or quoted
    const hookMatch = line.match(/^[\d\.\-\*\"\'•›→]+\s*(.+)$/);
    if (hookMatch) {
      const hook = hookMatch[1].replace(/^["']|["']$/g, "").trim();
      if (hook.length > 10) {
        hooks.push({
          id: Math.random().toString(36).slice(2),
          framework: currentFramework || FRAMEWORKS[hooks.length % FRAMEWORKS.length],
          text: hook,
        });
      }
    } else if (line.length > 15 && !line.includes(":") && currentFramework) {
      hooks.push({
        id: Math.random().toString(36).slice(2),
        framework: currentFramework,
        text: line.replace(/^["']|["']$/g, "").trim(),
      });
    }
  }
  return hooks.length ? hooks : fallbackParseHooks(text);
}

function fallbackParseHooks(text) {
  return text.split("\n")
    .map(s => s.trim())
    .filter(s => s.length > 15 && /^[\d\.\-\*\"•]/.test(s))
    .map((s, i) => ({
      id: Math.random().toString(36).slice(2),
      framework: FRAMEWORKS[i % FRAMEWORKS.length],
      text: s.replace(/^[\d\.\-\*\"•\s]+/, "").replace(/^["']|["']$/g, "").trim(),
    }));
}

function parseAngles(text) {
  const angles = [];
  const blocks = text.split(/\n{2,}/);
  const goalMap = { retention:"🔁 Retention", views:"👁️ Views", engagement:"💬 Engagement", conversion:"🔗 Conversion" };

  for (const block of blocks) {
    if (block.length < 20) continue;
    const lines = block.split("\n").map(s => s.trim()).filter(Boolean);
    if (!lines.length) continue;
    let title = lines[0].replace(/^[#\*\d\.\-\s]+/, "").trim();
    let desc = lines.slice(1).join(" ").trim();
    let goal = "👁️ Views";
    for (const [k, v] of Object.entries(goalMap)) {
      if (block.toLowerCase().includes(k)) { goal = v; break; }
    }
    if (title.length > 5 && title.length < 100) {
      angles.push({ id: Math.random().toString(36).slice(2), title, desc, goal });
    }
  }
  return angles.slice(0, 5);
}

function parseScript(text) {
  const beats = ["THE HOOK","THE TWIST","THE PROOF BRIDGE","THE CORE","THE CLOSE"];
  const result = { beats: [], wordCount: 0, duration: "" };

  for (const beat of beats) {
    const regex = new RegExp(`${beat}[^]*?(?=BEAT|THE HOOK|THE TWIST|THE PROOF|THE CORE|THE CLOSE|$)`, "i");
    const match = text.match(regex);
    if (match) {
      result.beats.push({ label: beat, content: match[0].replace(beat,"").replace(/[:\-\*#]+/g,"").trim() });
    }
  }

  if (!result.beats.length) {
    const paragraphs = text.split(/\n{2,}/).filter(p => p.trim().length > 20);
    const labels = ["THE HOOK","THE TWIST","THE PROOF BRIDGE","THE CORE","THE CLOSE"];
    result.beats = paragraphs.slice(0,5).map((p,i) => ({
      label: labels[i] || `BEAT ${i+1}`,
      content: p.trim()
    }));
  }

  const words = text.split(/\s+/).length;
  result.wordCount = words;
  const secs = Math.round(words / 2.5);
  result.duration = `~${Math.floor(secs/60)}:${String(secs%60).padStart(2,"0")}`;
  return result;
}

// ── API call ─────────────────────────────────────────────────────────────────

async function callClaude(messages, systemPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "";
}

// ── System prompts ────────────────────────────────────────────────────────────

function buildHookPrompt(idea, niche, platform, tone, styleRef, quickMode) {
  return `You are a world-class short-form content strategist who has studied every viral video, hook, and pattern in the TikTok/Reels/Shorts era. You write hooks that stop thumbs, hold attention, and drive results. You do NOT write safe, generic, or corporate content. Every line you write has ONE job: make someone stop scrolling.

RULES:
- No "Have you ever…" openers
- No "Today I want to talk about…"
- No hedging: no "kind of", "sort of", "maybe"
- Sentences under 12 words where possible
- Active voice, present tense
- Specific over general — numbers, names, specifics beat vague claims
- Emotion before information — make them feel it first
- Every hook must open a loop, challenge a belief, or name a pain

${styleRef ? `STYLE ANCHOR — match this creator's tone, rhythm, vocabulary, and structural patterns:\n"""\n${styleRef}\n"""\n` : ""}

OUTPUT FORMAT:
Group hooks under each framework header exactly like this:

**CURIOSITY GAP**
1. [hook]
2. [hook]

**CONTRARIAN TAKE**
1. [hook]
2. [hook]

**PAIN AMPLIFIER**
1. [hook]
2. [hook]

**STORY HOOK**
1. [hook]
2. [hook]

**AUTHORITY SHOCK**
1. [hook]
2. [hook]

**PATTERN INTERRUPT**
1. [hook]
2. [hook]

**RESULT LEAD**
1. [hook]
2. [hook]

Generate ${quickMode ? "12–15" : "10–15"} total hooks. Be aggressive, specific, and scroll-stopping. No filler.`;
}

function buildAnglesPrompt(idea, niche, platform, tone, styleRef) {
  return `You are a short-form content strategist who identifies the exact angle that makes a video go viral. You don't restate ideas — you REFRAME them. Each angle you generate targets a different psychological trigger and performance outcome.

${styleRef ? `STYLE ANCHOR — match this tone and structure:\n"""\n${styleRef}\n"""\n` : ""}

For each angle provide:
- A punchy angle title (under 10 words)
- A one-sentence brief describing the reframe and target emotion
- Performance goal (one of: Retention / Views / Engagement / Conversion)

Generate 4–5 distinct angles. They must be genuinely different framings — not synonyms.`;
}

function buildScriptPrompt(idea, niche, platform, tone, hook, angle, styleRef) {
  return `You are a short-form scriptwriter. You write for the ear, not the eye. Every word earns its place or gets cut. You follow a strict beat map that maximizes retention.

${styleRef ? `STYLE ANCHOR — write in this creator's voice:\n"""\n${styleRef}\n"""\n` : ""}

BEAT MAP:
BEAT 1 — THE HOOK (0–3 sec): The chosen hook verbatim. No preamble.
BEAT 2 — THE TWIST (3–12 sec): One sentence deepening the hook or adding friction.
BEAT 3 — THE PROOF BRIDGE (12–25 sec): One sharp credibility signal or setup detail.
BEAT 4 — THE CORE (25–55 sec): The actual value. Short sentences. One idea per line.
BEAT 5 — THE CLOSE (55–75 sec): A reframe or landing statement. One CTA. Never two.

RULES:
- No "Hey guys" or any intro
- No passive voice
- No filler phrases
- Sentences under 12 words
- Write for spoken delivery

Chosen hook: "${hook}"
Chosen angle: "${angle}"

Output the script with each beat labeled clearly.`;
}

// ── Components ────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, color:"#888", fontSize:13 }}>
      <div style={{
        width:16, height:16, border:"2px solid #333", borderTop:"2px solid #F5A623",
        borderRadius:"50%", animation:"spin 0.8s linear infinite"
      }}/>
      Generating...
    </div>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),1500); }}
      style={{
        background:"transparent", border:"1px solid #333", color: copied?"#27AE60":"#888",
        borderColor: copied?"#27AE60":"#333",
        fontSize:11, padding:"3px 10px", borderRadius:4, cursor:"pointer",
        transition:"all 0.2s", fontFamily:"inherit"
      }}
    >{copied ? "✓ Copied" : "Copy"}</button>
  );
}

function HookCard({ hook, selected, onSelect }) {
  const fw = hook.framework;
  return (
    <div
      onClick={() => onSelect(hook)}
      style={{
        background: selected ? `${fw.color}15` : "#0d0d0d",
        border: `1px solid ${selected ? fw.color : "#222"}`,
        borderRadius:8, padding:"12px 14px",
        cursor:"pointer", transition:"all 0.15s",
        display:"flex", flexDirection:"column", gap:8,
      }}
    >
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{
          fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase",
          color: fw.color, fontFamily:"'Space Mono', monospace"
        }}>
          {fw.icon} {fw.label}
        </span>
        {selected && <span style={{ fontSize:10, color: fw.color }}>✓ Selected</span>}
      </div>
      <p style={{ margin:0, fontSize:14, lineHeight:1.5, color:"#e8e8e8" }}>{hook.text}</p>
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <CopyBtn text={hook.text} />
      </div>
    </div>
  );
}

function AngleCard({ angle, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(angle)}
      style={{
        background: selected ? "#1a1a1a" : "#0d0d0d",
        border: `1px solid ${selected ? "#F5A623" : "#222"}`,
        borderRadius:8, padding:"14px 16px",
        cursor:"pointer", transition:"all 0.15s",
        display:"flex", flexDirection:"column", gap:8,
      }}
    >
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
        <span style={{ fontSize:14, fontWeight:700, color:"#f0f0f0", flex:1 }}>{angle.title}</span>
        {selected && <span style={{ fontSize:10, color:"#F5A623" }}>✓ Selected</span>}
      </div>
      <p style={{ margin:0, fontSize:13, color:"#888", lineHeight:1.5 }}>{angle.desc}</p>
      <span style={{
        fontSize:11, background:"#1a1a1a", border:"1px solid #2a2a2a",
        color:"#aaa", padding:"2px 8px", borderRadius:20, alignSelf:"flex-start"
      }}>{angle.goal}</span>
    </div>
  );
}

function ScriptView({ script }) {
  const fullText = script.beats.map(b => b.content).join("\n\n");
  const beatColors = ["#F5A623","#E8394D","#2980B9","#27AE60","#8E44AD"];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", gap:16, alignItems:"center" }}>
        <span style={{ fontSize:12, color:"#888" }}>📝 {script.wordCount} words</span>
        <span style={{ fontSize:12, color:"#888" }}>⏱ {script.duration} spoken</span>
        <div style={{ marginLeft:"auto" }}><CopyBtn text={fullText} /></div>
      </div>
      {script.beats.map((beat, i) => (
        <div key={i} style={{
          borderLeft:`3px solid ${beatColors[i] || "#555"}`,
          paddingLeft:14, display:"flex", flexDirection:"column", gap:6
        }}>
          <span style={{
            fontSize:10, fontWeight:700, letterSpacing:"0.1em",
            color: beatColors[i] || "#555", fontFamily:"'Space Mono', monospace"
          }}>{beat.label}</span>
          <p style={{ margin:0, fontSize:14, lineHeight:1.7, color:"#ddd", whiteSpace:"pre-wrap" }}>
            {beat.content}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function Anglify() {
  const [mode, setMode] = useState("full"); // "quick" | "full"
  const [idea, setIdea] = useState("");
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState("All");
  const [tone, setTone] = useState("Entertaining");
  const [styleRef, setStyleRef] = useState("");
  const [styleOpen, setStyleOpen] = useState(false);
  const [styleBadge, setStyleBadge] = useState("");

  const [hooks, setHooks] = useState([]);
  const [angles, setAngles] = useState([]);
  const [script, setScript] = useState(null);

  const [selectedHook, setSelectedHook] = useState(null);
  const [selectedAngle, setSelectedAngle] = useState(null);

  const [loadingHooks, setLoadingHooks] = useState(false);
  const [loadingAngles, setLoadingAngles] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);

  const [step, setStep] = useState(0); // 0=input, 1=hooks, 2=angles, 3=script
  const [error, setError] = useState("");

  const bottomRef = useRef(null);

  useEffect(() => {
    if (step > 0) bottomRef.current?.scrollIntoView({ behavior:"smooth", block:"end" });
  }, [hooks, angles, script, step]);

  // Derive style badge from pasted ref
  useEffect(() => {
    if (!styleRef || styleRef.length < 40) { setStyleBadge(""); return; }
    const words = styleRef.toLowerCase();
    const parts = [];
    if (/\bi\b|\bmy\b/.test(words)) parts.push("Personal");
    else if (/you|your/.test(words)) parts.push("Direct");
    if (/\d+%|\d+ (days|months|years|hours)/.test(words)) parts.push("Data-driven");
    if (/never|always|every|stop|start/.test(words)) parts.push("Declarative");
    const avgLen = words.split(".").map(s=>s.split(" ").length).reduce((a,b)=>a+b,0) / (words.split(".").length||1);
    parts.push(avgLen < 8 ? "Short rhythm" : "Long rhythm");
    if (/follow|save|comment|share|subscribe/.test(words)) parts.push("Hard CTA");
    else parts.push("Soft CTA");
    setStyleBadge(parts.slice(0,3).join(" · "));
  }, [styleRef]);

  async function generate() {
    if (!idea.trim()) { setError("Add your content idea first."); return; }
    setError(""); setHooks([]); setAngles([]); setScript(null);
    setSelectedHook(null); setSelectedAngle(null); setStep(1);

    // Hooks
    setLoadingHooks(true);
    try {
      const sys = buildHookPrompt(idea, niche, platform, tone, styleRef, mode === "quick");
      const raw = await callClaude([{ role:"user", content:`Content idea: "${idea}"\nNiche: ${niche||"General"}\nPlatform: ${platform}\nTone: ${tone}` }], sys);
      setHooks(parseHooks(raw));
    } catch(e) { setError("Hook generation failed. Check API."); }
    setLoadingHooks(false);

    if (mode === "quick") return;

    // Angles
    setLoadingAngles(true);
    setStep(2);
    try {
      const sys2 = buildAnglesPrompt(idea, niche, platform, tone, styleRef);
      const raw2 = await callClaude([{ role:"user", content:`Content idea: "${idea}"\nNiche: ${niche||"General"}\nPlatform: ${platform}\nTone: ${tone}` }], sys2);
      setAngles(parseAngles(raw2));
    } catch(e) {}
    setLoadingAngles(false);
  }

  async function generateScript() {
    if (!selectedHook || !selectedAngle) return;
    setLoadingScript(true); setScript(null); setStep(3);
    try {
      const sys = buildScriptPrompt(idea, niche, platform, tone, selectedHook.text, selectedAngle.title, styleRef);
      const raw = await callClaude([{ role:"user", content:`Idea: "${idea}"\nHook: "${selectedHook.text}"\nAngle: "${selectedAngle.title} — ${selectedAngle.desc}"` }], sys);
      setScript(parseScript(raw));
    } catch(e) { setError("Script generation failed."); }
    setLoadingScript(false);
  }

  // Group hooks by framework
  const groupedHooks = FRAMEWORKS.map(fw => ({
    ...fw,
    hooks: hooks.filter(h => h.framework?.id === fw.id)
  })).filter(g => g.hooks.length);

  const canGenerateScript = selectedHook && selectedAngle && !loadingScript;

  return (
    <div style={{
      minHeight:"100vh", background:"#080808", color:"#f0f0f0",
      fontFamily:"'DM Sans', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fadein { animation: fadeUp 0.35s ease forwards; }
        textarea, input { outline:none; }
        textarea:focus, input:focus { border-color: #F5A623 !important; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:#111; }
        ::-webkit-scrollbar-thumb { background:#333; border-radius:3px; }
        .mode-btn { cursor:pointer; transition:all 0.15s; border:none; font-family:inherit; }
        .mode-btn:hover { opacity:0.85; }
        .pill { cursor:pointer; transition:all 0.15s; border:none; font-family:inherit; }
        .pill:hover { opacity:0.8; }
        .gen-btn { cursor:pointer; transition:all 0.15s; border:none; font-family:inherit; }
        .gen-btn:hover:not(:disabled) { transform:translateY(-1px); filter:brightness(1.08); }
        .gen-btn:disabled { opacity:0.4; cursor:not-allowed; }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom:"1px solid #1a1a1a", padding:"20px 32px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, background:"#080808", zIndex:100
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{
            width:32, height:32, background:"#F5A623", borderRadius:6,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, fontWeight:900, color:"#000"
          }}>A</div>
          <div>
            <div style={{ fontSize:18, fontWeight:700, letterSpacing:"-0.02em" }}>Anglify</div>
            <div style={{ fontSize:11, color:"#555", fontFamily:"'Space Mono', monospace" }}>v3 · Hook Engine</div>
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{
          background:"#111", border:"1px solid #222", borderRadius:8,
          padding:3, display:"flex", gap:2
        }}>
          {[["quick","⚡ Quick"], ["full","◈ Full Mode"]].map(([m, label]) => (
            <button key={m} className="mode-btn" onClick={() => setMode(m)} style={{
              padding:"6px 14px", borderRadius:6, fontSize:12, fontWeight:600,
              background: mode===m ? "#F5A623" : "transparent",
              color: mode===m ? "#000" : "#666",
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"32px 24px", display:"flex", flexDirection:"column", gap:32 }}>

        {/* Input Panel */}
        <div className="fadein" style={{
          background:"#0d0d0d", border:"1px solid #1e1e1e", borderRadius:12, padding:24,
          display:"flex", flexDirection:"column", gap:20
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:"#F5A623", fontFamily:"'Space Mono', monospace" }}>
              {mode === "quick" ? "⚡ QUICK MODE — HOOKS ONLY" : "◈ FULL MODE"}
            </span>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <label style={{ fontSize:11, color:"#666", fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>Your Idea</label>
            <textarea
              value={idea}
              onChange={e => setIdea(e.target.value)}
              placeholder="e.g. I quit my 9-5 after 6 months of side hustling…"
              rows={3}
              style={{
                background:"#111", border:"1px solid #222", borderRadius:8,
                color:"#f0f0f0", fontSize:15, padding:"12px 14px",
                resize:"vertical", lineHeight:1.6, fontFamily:"inherit", width:"100%"
              }}
            />
          </div>

          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <div style={{ flex:"1 1 160px", display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:11, color:"#666", fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>Niche</label>
              <input
                value={niche} onChange={e => setNiche(e.target.value)}
                placeholder="Finance, Fitness, Travel…"
                style={{
                  background:"#111", border:"1px solid #222", borderRadius:8,
                  color:"#f0f0f0", fontSize:13, padding:"10px 12px", fontFamily:"inherit"
                }}
              />
            </div>
            <div style={{ flex:"1 1 120px", display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:11, color:"#666", fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>Platform</label>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                {PLATFORMS.map(p => (
                  <button key={p} className="pill" onClick={() => setPlatform(p)} style={{
                    padding:"7px 12px", borderRadius:6, fontSize:12, fontWeight:600,
                    background: platform===p ? "#1a1a1a" : "transparent",
                    color: platform===p ? "#F5A623" : "#555",
                    border: `1px solid ${platform===p ? "#F5A623" : "#222"}`
                  }}>{p}</button>
                ))}
              </div>
            </div>
            <div style={{ flex:"1 1 240px", display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:11, color:"#666", fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>Tone</label>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                {TONES.map(t => (
                  <button key={t} className="pill" onClick={() => setTone(t)} style={{
                    padding:"7px 12px", borderRadius:6, fontSize:12, fontWeight:600,
                    background: tone===t ? "#1a1a1a" : "transparent",
                    color: tone===t ? "#F5A623" : "#555",
                    border: `1px solid ${tone===t ? "#F5A623" : "#222"}`
                  }}>{t}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Style Replication */}
          <div style={{ border:"1px solid #1a1a1a", borderRadius:8, overflow:"hidden" }}>
            <button
              className="mode-btn"
              onClick={() => setStyleOpen(!styleOpen)}
              style={{
                width:"100%", padding:"12px 16px", background:"#111",
                color:"#888", fontSize:12, fontWeight:600,
                display:"flex", alignItems:"center", justifyContent:"space-between"
              }}
            >
              <span>✦ Style Replication {styleRef && <span style={{ color:"#F5A623" }}>· Active</span>}</span>
              <span style={{ fontSize:10 }}>{styleOpen ? "▲" : "▼"}</span>
            </button>
            {styleOpen && (
              <div style={{ padding:16, background:"#0a0a0a", display:"flex", flexDirection:"column", gap:10 }}>
                <p style={{ margin:0, fontSize:12, color:"#666", lineHeight:1.6 }}>
                  Paste a viral post, hook, or script. Anglify will match its tone, rhythm, vocabulary, and structure.
                </p>
                <textarea
                  value={styleRef} onChange={e => setStyleRef(e.target.value)}
                  placeholder="Paste viral content here…"
                  rows={5}
                  style={{
                    background:"#111", border:"1px solid #222", borderRadius:8,
                    color:"#f0f0f0", fontSize:13, padding:"12px 14px",
                    resize:"vertical", lineHeight:1.6, fontFamily:"inherit", width:"100%"
                  }}
                />
                {styleBadge && (
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:10, color:"#555", fontFamily:"'Space Mono', monospace" }}>DETECTED STYLE</span>
                    <span style={{
                      fontSize:11, fontWeight:600, color:"#F5A623",
                      background:"#1a1200", border:"1px solid #3a2800",
                      padding:"3px 10px", borderRadius:20
                    }}>{styleBadge}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <p style={{ margin:0, color:"#E8394D", fontSize:13 }}>{error}</p>}

          <button
            className="gen-btn"
            onClick={generate}
            disabled={loadingHooks || loadingAngles}
            style={{
              background:"#F5A623", color:"#000", fontWeight:800, fontSize:15,
              padding:"14px 28px", borderRadius:8, letterSpacing:"-0.01em",
              alignSelf:"flex-start"
            }}
          >
            {loadingHooks ? "Generating…" : mode === "quick" ? "⚡ Generate Hooks" : "◈ Generate Content Package"}
          </button>
        </div>

        {/* Hooks */}
        {(hooks.length > 0 || loadingHooks) && (
          <div className="fadein" style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:18, fontWeight:700 }}>Hooks</div>
                <div style={{ fontSize:12, color:"#555", fontFamily:"'Space Mono', monospace" }}>
                  {hooks.length} generated · grouped by framework
                </div>
              </div>
              {hooks.length > 0 && (
                <CopyBtn text={hooks.map(h => `[${h.framework?.label}]\n${h.text}`).join("\n\n")} />
              )}
            </div>

            {loadingHooks && <Spinner />}

            {groupedHooks.map(group => (
              <div key={group.id} style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ color: group.color, fontSize:14 }}>{group.icon}</span>
                  <span style={{
                    fontSize:11, fontWeight:700, letterSpacing:"0.1em",
                    color: group.color, fontFamily:"'Space Mono', monospace", textTransform:"uppercase"
                  }}>{group.label}</span>
                  <div style={{ flex:1, height:1, background:"#1a1a1a" }}/>
                </div>
                <div style={{ display:"grid", gap:8 }}>
                  {group.hooks.map(hook => (
                    <HookCard
                      key={hook.id} hook={hook}
                      selected={selectedHook?.id === hook.id}
                      onSelect={setSelectedHook}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Angles (Full Mode only) */}
        {mode === "full" && (angles.length > 0 || loadingAngles) && (
          <div className="fadein" style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <div style={{ fontSize:18, fontWeight:700 }}>Content Angles</div>
              <div style={{ fontSize:12, color:"#555", fontFamily:"'Space Mono', monospace" }}>
                Select one to build your script around
              </div>
            </div>
            {loadingAngles && <Spinner />}
            <div style={{ display:"grid", gap:10 }}>
              {angles.map(angle => (
                <AngleCard
                  key={angle.id} angle={angle}
                  selected={selectedAngle?.id === angle.id}
                  onSelect={setSelectedAngle}
                />
              ))}
            </div>
          </div>
        )}

        {/* Script CTA */}
        {mode === "full" && hooks.length > 0 && angles.length > 0 && (
          <div className="fadein" style={{
            background:"#0d0d0d", border:`1px solid ${canGenerateScript ? "#F5A623" : "#1e1e1e"}`,
            borderRadius:12, padding:20, display:"flex", alignItems:"center",
            justifyContent:"space-between", gap:16, flexWrap:"wrap"
          }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600 }}>
                {selectedHook && selectedAngle
                  ? "Ready to generate script →"
                  : !selectedHook && !selectedAngle
                  ? "Select a hook and angle to generate your script"
                  : !selectedHook
                  ? "Select a hook above"
                  : "Select an angle above"}
              </div>
              {selectedHook && (
                <div style={{ fontSize:12, color:"#888", marginTop:4 }}>
                  Hook: <span style={{ color:"#F5A623" }}>"{selectedHook.text.slice(0,60)}{selectedHook.text.length>60?"…":""}"</span>
                </div>
              )}
              {selectedAngle && (
                <div style={{ fontSize:12, color:"#888" }}>
                  Angle: <span style={{ color:"#F5A623" }}>{selectedAngle.title}</span>
                </div>
              )}
            </div>
            <button
              className="gen-btn"
              onClick={generateScript}
              disabled={!canGenerateScript}
              style={{
                background: canGenerateScript ? "#F5A623" : "#1a1a1a",
                color: canGenerateScript ? "#000" : "#444",
                fontWeight:800, fontSize:14,
                padding:"12px 24px", borderRadius:8, whiteSpace:"nowrap"
              }}
            >
              {loadingScript ? "Writing…" : "▶ Generate Script"}
            </button>
          </div>
        )}

        {/* Script */}
        {(script || loadingScript) && (
          <div className="fadein" style={{
            background:"#0d0d0d", border:"1px solid #1e1e1e",
            borderRadius:12, padding:24, display:"flex", flexDirection:"column", gap:20
          }}>
            <div>
              <div style={{ fontSize:18, fontWeight:700 }}>Script</div>
              <div style={{ fontSize:12, color:"#555", fontFamily:"'Space Mono', monospace" }}>
                Beat-mapped · optimized for retention
              </div>
            </div>
            {loadingScript && <Spinner />}
            {script && <ScriptView script={script} />}
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
