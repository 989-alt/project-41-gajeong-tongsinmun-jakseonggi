// Letter Studio — 가정통신문 자동 작성기
// 단일 HTML + vanilla JS + ES modules.

import { TEMPLATES, findTemplate } from "./templates.js";
import { gemini, GeminiError } from "./gemini.js";

const LS_KEYS = {
  school: "gtm.school.v1",
  recent: "gtm.recent.v1",
  lastTpl: "gtm.lastTemplate.v1",
  theme: "gtm.theme.v1",
};
const MAX_RECENT = 5;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = {
  schoolHeader: { schoolName: "", grade: "", classNo: "", teacherName: "" },
  activeTemplateId: null,
  values: {},
  recent: [],
  aiBusy: false,
  pdfBusy: false,
};

// ── persistence ──────────────────────────────────────────
function loadFromStorage() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEYS.school) || "null");
    if (s && typeof s === "object") state.schoolHeader = { ...state.schoolHeader, ...s };
  } catch {}
  try {
    const r = JSON.parse(localStorage.getItem(LS_KEYS.recent) || "[]");
    if (Array.isArray(r)) state.recent = r.slice(0, MAX_RECENT);
  } catch {}
  const lastId = localStorage.getItem(LS_KEYS.lastTpl);
  if (lastId && findTemplate(lastId)) state.activeTemplateId = lastId;
  const theme = localStorage.getItem(LS_KEYS.theme);
  if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
}
function saveSchool() {
  try { localStorage.setItem(LS_KEYS.school, JSON.stringify(state.schoolHeader)); } catch {}
}
function saveRecent() {
  try { localStorage.setItem(LS_KEYS.recent, JSON.stringify(state.recent.slice(0, MAX_RECENT))); } catch {}
}
function saveLastTemplate() {
  if (state.activeTemplateId) {
    try { localStorage.setItem(LS_KEYS.lastTpl, state.activeTemplateId); } catch {}
  }
}

// ── toast ────────────────────────────────────────────────
let toastTimer = null;
function toast(msg, { error = false } = {}) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.toggle("error", !!error);
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}

// ── school header form ──────────────────────────────────
function bindSchoolForm() {
  const map = {
    schoolName: $("#schoolName"),
    grade: $("#grade"),
    classNo: $("#classNo"),
    teacherName: $("#teacherName"),
  };
  for (const [key, input] of Object.entries(map)) {
    input.value = state.schoolHeader[key] || "";
    input.addEventListener("input", () => {
      state.schoolHeader[key] = input.value;
      saveSchool();
      renderPreview();
    });
  }
  $("#reset-school").addEventListener("click", () => {
    state.schoolHeader = { schoolName: "", grade: "", classNo: "", teacherName: "" };
    for (const [key, input] of Object.entries(map)) input.value = "";
    saveSchool();
    renderPreview();
    toast("학교 정보를 초기화했습니다.");
  });
}

// ── template list ───────────────────────────────────────
function renderTemplateList() {
  const list = $("#tpl-list");
  list.innerHTML = "";
  for (const t of TEMPLATES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tpl-card";
    btn.setAttribute("role", "option");
    btn.dataset.id = t.id;
    btn.setAttribute("aria-selected", t.id === state.activeTemplateId ? "true" : "false");
    btn.innerHTML = `
      <span class="tpl-icon" aria-hidden="true">${t.icon}</span>
      <span class="tpl-body">
        <span class="tpl-title"></span>
        <span class="tpl-sub"></span>
      </span>
    `;
    btn.querySelector(".tpl-title").textContent = t.label;
    btn.querySelector(".tpl-sub").textContent = t.sub;
    btn.addEventListener("click", () => selectTemplate(t.id));
    list.appendChild(btn);
  }
}

function selectTemplate(id) {
  const tpl = findTemplate(id);
  if (!tpl) return;
  const switching = state.activeTemplateId !== id;
  state.activeTemplateId = id;
  saveLastTemplate();
  if (switching) {
    // initialise default values, prefer today's date for required date fields
    const today = new Date().toISOString().slice(0, 10);
    const initial = { body: tpl.defaults?.body || "" };
    for (const sec of tpl.sections) {
      for (const f of sec.fields) {
        if (initial[f.name] !== undefined) continue;
        if (f.type === "date" && f.required) initial[f.name] = today;
        else initial[f.name] = "";
      }
    }
    state.values = initial;
  }
  renderTemplateList();
  renderForm();
  renderPreview();
  $("#download-pdf").disabled = false;
  $("#print-btn").disabled = false;
}

// ── form renderer ────────────────────────────────────────
function renderForm() {
  const tpl = findTemplate(state.activeTemplateId);
  const eyebrow = $("#active-eyebrow");
  const title = $("#active-title");
  const wrap = $("#dynamic-fields");
  wrap.innerHTML = "";
  if (!tpl) {
    eyebrow.textContent = "템플릿을 선택해 주세요";
    title.textContent = "가정통신문 자동 작성기";
    return;
  }
  eyebrow.textContent = `템플릿 · ${tpl.sub}`;
  title.textContent = tpl.label;

  for (const sec of tpl.sections) {
    const card = document.createElement("section");
    card.className = "section-card";
    const h = document.createElement("div");
    h.className = "section-card-title";
    h.textContent = sec.title;
    card.appendChild(h);
    for (const f of sec.fields) {
      card.appendChild(renderField(f, tpl));
    }
    wrap.appendChild(card);
  }
}

function renderField(f, tpl) {
  const block = document.createElement("div");
  block.className = "field-row " + (f.layout === "double" ? "" : f.layout === "triple" ? "triple" : "single");
  const inner = document.createElement("div");
  inner.className = "field-block" + (f.name === "body" ? " body-block" : "");
  const label = document.createElement("label");
  label.setAttribute("for", `f-${f.name}`);

  const labelText = document.createElement("span");
  labelText.textContent = f.label + (f.required ? " *" : "");
  label.appendChild(labelText);

  if (f.name === "body") {
    const aiBtn = document.createElement("button");
    aiBtn.type = "button";
    aiBtn.className = "ai-btn";
    aiBtn.id = "ai-body";
    aiBtn.innerHTML = `<span aria-hidden="true">✨</span><span>AI 본문 초안</span>`;
    aiBtn.addEventListener("click", () => onAiDraft(tpl));
    label.appendChild(aiBtn);
  }
  inner.appendChild(label);

  let input;
  if (f.type === "textarea") {
    input = document.createElement("textarea");
    input.rows = f.rows || 4;
  } else {
    input = document.createElement("input");
    input.type = f.type || "text";
  }
  input.id = `f-${f.name}`;
  input.name = f.name;
  input.value = state.values[f.name] ?? "";
  if (f.placeholder) input.placeholder = f.placeholder;
  if (f.required) input.setAttribute("aria-required", "true");
  input.addEventListener("input", () => {
    state.values[f.name] = input.value;
    renderPreview();
  });
  inner.appendChild(input);

  if (f.hint) {
    const hint = document.createElement("div");
    hint.className = "field-hint";
    hint.textContent = f.hint;
    inner.appendChild(hint);
  }
  block.appendChild(inner);

  // double layout: pack two consecutive doubles into a single row via wrapper if needed.
  // simpler approach: use single column but with 2-up grid only at the row level.
  // We'll just use "single" row that holds one block — visual two-column comes from CSS field-row not set here.
  return inner;
}

// Two-column packing for double layout fields — group consecutive doubles per section.
// Simpler: regroup after initial render.
function groupDoubles() {
  $$("section.section-card").forEach((card) => {
    // gather direct .field-block children for grouping
    const blocks = Array.from(card.children).filter((c) => c.classList?.contains("field-block"));
    if (!blocks.length) return;
    // For each pair of consecutive blocks where both fields are "double" layout, wrap in row.
    // Determine layout via input's id mapping to field defs — easier: we never pushed .single/.double wrappers,
    // so just keep as-is; CSS already stacks them vertically. Doubles are aesthetic-only and we already constrain via fields-row.
  });
}

// ── preview ──────────────────────────────────────────────
function renderPreview() {
  const tpl = findTemplate(state.activeTemplateId);
  const empty = $("#paper-empty");
  const doc = $("#paper-doc");
  if (!tpl) {
    empty.hidden = false;
    doc.hidden = true;
    return;
  }
  empty.hidden = true;
  doc.hidden = false;

  const out = tpl.render(state.values, state.schoolHeader);
  $("#doc-school").textContent = state.schoolHeader.schoolName || "학교명을 입력해 주세요";
  const metaParts = [];
  if (state.schoolHeader.grade) metaParts.push(`${state.schoolHeader.grade}학년`);
  if (state.schoolHeader.classNo) metaParts.push(`${state.schoolHeader.classNo}반`);
  if (state.schoolHeader.teacherName) metaParts.push(`담임 ${state.schoolHeader.teacherName}`);
  $("#doc-meta").textContent = metaParts.join(" · ");

  $("#doc-title").textContent = out.title || tpl.label;
  $("#doc-summary").textContent = out.summary || "";

  const dl = $("#doc-fields");
  dl.innerHTML = "";
  const visible = (out.fields || []).filter(([_, v]) => v && String(v).trim());
  if (!visible.length) {
    dl.style.display = "none";
  } else {
    dl.style.display = "";
    for (const [k, v] of visible) {
      const dt = document.createElement("dt");
      dt.textContent = k;
      const dd = document.createElement("dd");
      dd.textContent = v;
      dl.appendChild(dt);
      dl.appendChild(dd);
    }
  }

  $("#doc-body").textContent = out.body || "본문을 입력해 주세요.";
  const today = out.dateLabel || new Date().toISOString().slice(0, 10).replace(/-/g, ".");
  $("#doc-date").textContent = today;
  const sigLabel = tpl.signatureLabel || "담임 교사";
  const sigName = sigLabel === "교장"
    ? (state.schoolHeader.schoolName ? `${state.schoolHeader.schoolName} 교장` : "교장")
    : (state.schoolHeader.teacherName ? `${state.schoolHeader.teacherName} ${sigLabel}` : sigLabel);
  $("#doc-sig-label").textContent = sigName;
}

// ── recent letters ───────────────────────────────────────
function renderRecentList() {
  const wrap = $("#recent-list");
  wrap.innerHTML = "";
  if (!state.recent.length) {
    const e = document.createElement("div");
    e.className = "recent-empty";
    e.textContent = "저장된 통신문이 아직 없습니다.";
    wrap.appendChild(e);
    return;
  }
  for (const item of state.recent) {
    const tpl = findTemplate(item.templateId);
    const b = document.createElement("button");
    b.type = "button";
    b.className = "recent-item";
    const title = document.createElement("span");
    title.className = "recent-title";
    title.textContent = item.title || tpl?.label || "통신문";
    const meta = document.createElement("span");
    meta.className = "recent-meta";
    meta.textContent = `${tpl?.label || ""} · ${item.savedAtLabel}`;
    b.appendChild(title);
    b.appendChild(meta);
    b.addEventListener("click", () => {
      state.activeTemplateId = item.templateId;
      state.values = { ...item.values };
      saveLastTemplate();
      renderTemplateList();
      renderForm();
      renderPreview();
      $("#download-pdf").disabled = false;
      $("#print-btn").disabled = false;
      toast("저장된 통신문을 불러왔습니다.");
    });
    wrap.appendChild(b);
  }
}

function rememberCurrent() {
  const tpl = findTemplate(state.activeTemplateId);
  if (!tpl) return;
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const entry = {
    id: `${tpl.id}-${now.getTime()}`,
    templateId: tpl.id,
    title: state.values.title || tpl.label,
    values: { ...state.values },
    savedAt: now.toISOString(),
    savedAtLabel: `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
  };
  state.recent.unshift(entry);
  state.recent = state.recent.slice(0, MAX_RECENT);
  saveRecent();
  renderRecentList();
}

// ── PDF / print ──────────────────────────────────────────
function buildSafeFilename() {
  const tpl = findTemplate(state.activeTemplateId);
  const title = (state.values.title || tpl?.label || "letter").replace(/[\\/:*?"<>|]/g, "_").slice(0, 60);
  const d = new Date().toISOString().slice(0, 10);
  return `${d}-${title}.pdf`;
}
async function downloadPdf() {
  const tpl = findTemplate(state.activeTemplateId);
  if (!tpl) return;
  if (state.pdfBusy) return;
  state.pdfBusy = true;
  const btn = $("#download-pdf");
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = "생성 중…";
  try {
    const node = $("#paper");
    if (typeof window.html2pdf === "function") {
      await window.html2pdf()
        .set({
          margin: 10,
          filename: buildSafeFilename(),
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(node)
        .save();
      rememberCurrent();
      toast("PDF를 저장했습니다.");
    } else {
      toast("PDF 라이브러리를 불러오지 못해 인쇄 대화창을 엽니다.", { error: true });
      window.print();
      rememberCurrent();
    }
  } catch (e) {
    console.error(e);
    toast("PDF 생성에 실패했어요. 인쇄로 대체합니다.", { error: true });
    window.print();
  } finally {
    btn.disabled = false;
    btn.textContent = original;
    state.pdfBusy = false;
  }
}

function printDoc() {
  if (!state.activeTemplateId) return;
  window.print();
  rememberCurrent();
}

// ── Gemini draft ─────────────────────────────────────────
async function onAiDraft(tpl) {
  if (state.aiBusy) return;
  const aiBtn = $("#ai-body");
  state.aiBusy = true;
  aiBtn.disabled = true;
  const orig = aiBtn.innerHTML;
  aiBtn.innerHTML = `<span class="spin" aria-hidden="true"></span><span>초안 생성 중…</span>`;
  try {
    const ctx = buildContextForAi(tpl);
    const prompt = `너는 초등학교 교사를 돕는 한국어 작성 보조 도구야. 아래 정보로 학부모님께 보내는 "${tpl.label}" 가정통신문 본문을 작성해 줘.

조건:
- 정중하고 따뜻한 어조, 존댓말.
- 3~4문장, 280자 이내.
- 학교/교사명, 날짜, 장소 등 메타 정보는 본문에 다시 나열하지 말 것 (이미 상단 표에 있음).
- 마크다운/이모지/번호 매기기 금지. 줄바꿈 없이 문단 1개로.
- 학생 이름이나 학번 같은 개인정보는 절대 언급하지 말 것.

[정보]
${ctx}

본문만 출력해.`;

    const text = await gemini(prompt, {
      model: "gemini-2.5-flash",
      thinkingBudget: 0,
    });
    const cleaned = String(text || "").trim().replace(/^["']|["']$/g, "");
    if (!cleaned) throw new Error("빈 응답이 도착했습니다.");
    state.values.body = cleaned;
    const ta = $("#f-body");
    if (ta) ta.value = cleaned;
    renderPreview();
    toast("AI 본문 초안을 넣었어요. 필요한 부분만 다듬어 주세요.");
  } catch (e) {
    console.error(e);
    if (e instanceof GeminiError) toast(e.message, { error: true });
    else toast("AI 초안을 가져오지 못했어요.", { error: true });
  } finally {
    state.aiBusy = false;
    aiBtn.disabled = false;
    aiBtn.innerHTML = orig;
  }
}

function buildContextForAi(tpl) {
  const lines = [];
  if (state.schoolHeader.schoolName) lines.push(`학교: ${state.schoolHeader.schoolName}`);
  if (state.schoolHeader.grade) lines.push(`학년: ${state.schoolHeader.grade}`);
  if (state.schoolHeader.classNo) lines.push(`반: ${state.schoolHeader.classNo}`);
  if (state.schoolHeader.teacherName) lines.push(`교사: ${state.schoolHeader.teacherName}`);
  for (const sec of tpl.sections) {
    for (const f of sec.fields) {
      if (f.name === "body") continue;
      const v = state.values[f.name];
      if (v && String(v).trim()) lines.push(`${f.label}: ${v}`);
    }
  }
  return lines.join("\n");
}

// ── JSON export / import ────────────────────────────────
function exportJson() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    schoolHeader: state.schoolHeader,
    recent: state.recent,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `letter-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("백업 파일을 저장했습니다.");
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result || "{}"));
      if (data && typeof data === "object") {
        if (data.schoolHeader && typeof data.schoolHeader === "object") {
          state.schoolHeader = { ...state.schoolHeader, ...data.schoolHeader };
          saveSchool();
          $("#schoolName").value = state.schoolHeader.schoolName || "";
          $("#grade").value = state.schoolHeader.grade || "";
          $("#classNo").value = state.schoolHeader.classNo || "";
          $("#teacherName").value = state.schoolHeader.teacherName || "";
        }
        if (Array.isArray(data.recent)) {
          state.recent = data.recent.slice(0, MAX_RECENT);
          saveRecent();
          renderRecentList();
        }
        renderPreview();
        toast("백업을 불러왔습니다.");
        return;
      }
      throw new Error("형식 오류");
    } catch (e) {
      console.error(e);
      toast("JSON 파일을 읽지 못했어요.", { error: true });
    }
  };
  reader.onerror = () => toast("파일을 읽는 중 오류가 발생했어요.", { error: true });
  reader.readAsText(file);
}

// ── theme toggle ─────────────────────────────────────────
function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  const btn = $("#theme-toggle");
  const isLight = theme === "light";
  btn.textContent = isLight ? "다크 모드" : "라이트 모드";
  btn.setAttribute("aria-pressed", isLight ? "true" : "false");
  try { localStorage.setItem(LS_KEYS.theme, theme); } catch {}
}
function bindThemeToggle() {
  $("#theme-toggle").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    applyTheme(current === "light" ? "dark" : "light");
  });
}

// ── bootstrap ────────────────────────────────────────────
function init() {
  loadFromStorage();
  bindSchoolForm();
  renderTemplateList();
  renderRecentList();
  renderForm();
  renderPreview();
  applyTheme(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");

  $("#download-pdf").addEventListener("click", downloadPdf);
  $("#print-btn").addEventListener("click", printDoc);
  $("#export-json").addEventListener("click", exportJson);
  $("#import-json").addEventListener("click", () => $("#import-file").click());
  $("#import-file").addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) importJson(f);
    e.target.value = "";
  });
  bindThemeToggle();

  if (state.activeTemplateId) {
    $("#download-pdf").disabled = false;
    $("#print-btn").disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", init);
