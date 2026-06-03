const ASSET_BASE = new URL('./', import.meta.url);
const STORAGE_KEY = 'bp-adopt-params';

const EVOLVE_MODES = [
  { id: 'refinement', label: 'Deepen section', note: 'Scoped refinement of one template section.' },
  { id: 'maintenance', label: 'After code change', note: 'Paste git diff — update only impacted docs.' },
];

const WORK_MODES = [
  { id: 'architecture-work-query', label: 'Answer question', note: 'Set your question in the prompt.' },
  { id: 'architecture-work-analysis', label: 'Analyze', note: 'Set topic, scope, and focus.' },
  { id: 'architecture-work-design', label: 'Design proposal', note: 'Set goal and constraints.' },
  { id: 'architecture-work-continue', label: 'Open work items', note: 'Continues WRK entries in blueprint.md.' },
];

const REVIEW_MODES = [
  { id: 'review-phase', label: 'Review one phase' },
  { id: 'review-maintenance', label: 'Review all docs' },
];

const panelState = { evolve: null, work: null, review: null };

async function loadWorkflows() {
  const res = await fetch(new URL('workflows.json', ASSET_BASE));
  if (!res.ok) throw new Error('workflows.json');
  return res.json();
}

function showToast() {
  const el = document.getElementById('toast');
  el.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { el.hidden = true; }, 1400);
}

async function copy(text) {
  await navigator.clipboard.writeText(text);
  showToast();
}

function byId(workflows, id) {
  return workflows.find((w) => w.id === id);
}

function readForm(form) {
  const data = new FormData(form);
  const template = String(data.get('template') || 'arc42');
  return {
    appName: String(data.get('appName') || '').trim(),
    template,
    customTemplate: String(data.get('customTemplate') || '').trim(),
    purpose: String(data.get('purpose') || '').trim(),
    stack: String(data.get('stack') || '').trim(),
    docRoot: String(data.get('docRoot') || 'docs/architecture/').trim().replace(/\/?$/, '/'),
    sourceRoot: String(data.get('sourceRoot') || '').trim(),
    externalSystems: String(data.get('externalSystems') || '').trim(),
  };
}

function resolvedTemplate(params) {
  if (params.template === 'custom') {
    return params.customTemplate || 'custom';
  }
  return params.template;
}

function buildParameterBlock(params) {
  const template = resolvedTemplate(params);
  const lines = [
    '## Adoption parameters (from architect — do not re-interview if already set)',
    '',
    `- Application: ${params.appName}`,
    `- Documentation template: ${template}`,
  ];
  if (params.purpose) lines.push(`- Purpose / domain: ${params.purpose}`);
  if (params.stack) lines.push(`- Stack: ${params.stack}`);
  if (params.docRoot !== 'docs/architecture/') {
    lines.push(`- Documentation root: ${params.docRoot}`);
  }
  if (params.sourceRoot) lines.push(`- Primary source path: ${params.sourceRoot}`);
  if (params.externalSystems) lines.push(`- External systems: ${params.externalSystems}`);
  lines.push('');
  lines.push('## File roles (create all three — do not merge)');
  lines.push('- always-on.md — session context (name, stack, source map); not architecture chapters');
  lines.push('- blueprint.md — construction plan: phase rows → target files, status, WRK, reviews, session log');
  lines.push('- entry-point.md — human entry: overview, navigation, source links; no phase status or session log');
  lines.push('');
  lines.push(`Create "${template}/" with phase stubs matching blueprint rows. Keep blueprint (plan) and entry-point (navigation) in sync. Interview only for missing facts.`);
  lines.push('');
  return lines.join('\n');
}

function buildAdoptPrompt(base, params) {
  const block = buildParameterBlock(params);
  const anchor = 'Role: bootstrap\n\n';
  if (base.includes(anchor)) {
    return base.replace(anchor, `${anchor}${block}`);
  }
  return `${block}\n${base}`;
}

function saveParams(params) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
  } catch {
    /* ignore */
  }
}

function loadParams() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function applyParams(form, params) {
  if (!params) return;
  for (const [key, value] of Object.entries(params)) {
    const el = form.elements.namedItem(key);
    if (el && value != null) el.value = value;
  }
  toggleCustomField(form);
}

function toggleCustomField(form) {
  const custom = form.querySelector('.field-custom');
  const template = form.elements.namedItem('template');
  if (custom && template) {
    custom.hidden = template.value !== 'custom';
  }
}

function initAdoptForm(adoptBase) {
  const form = document.getElementById('adopt-form');
  if (!form) return;

  applyParams(form, loadParams());
  const previewEl = document.getElementById('prompt-preview');

  function refreshPreview() {
    if (!previewEl) return;
    const params = readForm(form);
    if (!params.appName) {
      previewEl.textContent = 'Enter an application name to preview.';
      return;
    }
    if (params.template === 'custom' && !params.customTemplate) {
      previewEl.textContent = 'Enter a custom template name.';
      return;
    }
    previewEl.textContent = buildParameterBlock(params);
  }

  form.elements.namedItem('template')?.addEventListener('change', () => {
    toggleCustomField(form);
    refreshPreview();
  });
  form.addEventListener('input', refreshPreview);
  refreshPreview();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const params = readForm(form);
    if (!params.appName) {
      form.elements.namedItem('appName')?.focus();
      return;
    }
    if (params.template === 'custom' && !params.customTemplate) {
      form.elements.namedItem('customTemplate')?.focus();
      return;
    }
    saveParams(params);
    copy(buildAdoptPrompt(adoptBase, params));
  });
}

function initTabs() {
  const tabs = document.querySelectorAll('.phase-tab');
  const panels = {
    build: document.getElementById('phase-build'),
    evolve: document.getElementById('phase-evolve'),
    work: document.getElementById('phase-work'),
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      Object.entries(panels).forEach(([key, panel]) => {
        const on = tab.dataset.phase === key;
        panel.hidden = !on;
        panel.classList.toggle('active', on);
      });
    });
  });
}

function bindStep(stepEl, workflow) {
  stepEl.querySelector('.btn-prompt').addEventListener('click', () => {
    copy(workflow.prompt);
  });
}

function initBuildPhase(workflows) {
  document.querySelectorAll('.step[data-workflow]').forEach((step) => {
    const w = byId(workflows, step.dataset.workflow);
    if (w) bindStep(step, w);
  });
}

function initModeGrid(workflows, key, modes, gridId, panelId, labelId, noteId) {
  const grid = document.getElementById(gridId);
  const panel = document.getElementById(panelId);
  if (!grid || !panel) return;

  for (const mode of modes) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mode-btn';
    btn.textContent = mode.label;
    btn.addEventListener('click', () => {
      grid.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const w = byId(workflows, mode.id);
      if (!w) return;
      panelState[key] = w;
      panel.hidden = false;

      const label = document.getElementById(labelId);
      if (label) label.textContent = w.when;

      const note = document.getElementById(noteId);
      if (note) {
        const text = mode.note || (w.freshChat ? 'New chat required.' : '');
        note.textContent = text;
        note.hidden = !text;
      }
    });
    grid.appendChild(btn);
  }
}

function initCopyButtons() {
  document.querySelectorAll('.mode-copy').forEach((btn) => {
    btn.addEventListener('click', () => {
      const w = panelState[btn.dataset.panel];
      if (w) copy(w.prompt);
    });
  });
}

async function loadAdoptPrompt() {
  const res = await fetch(new URL('adopt-prompt.txt', ASSET_BASE));
  if (!res.ok) throw new Error('adopt-prompt.txt');
  return res.text();
}

async function main() {
  initTabs();

  let workflows;
  let adoptBase = '';

  try {
    [workflows, adoptBase] = await Promise.all([
      loadWorkflows(),
      loadAdoptPrompt(),
    ]);
  } catch {
    document.querySelector('.app')?.insertAdjacentHTML(
      'beforeend',
      '<p class="cell-note" style="margin-top:1rem">Load via <code>./scripts/open-assistant.sh</code></p>'
    );
    return;
  }

  initAdoptForm(adoptBase);
  initBuildPhase(workflows);
  initModeGrid(workflows, 'evolve', EVOLVE_MODES, 'evolve-grid', 'evolve-panel', 'evolve-label', 'evolve-note');
  initModeGrid(workflows, 'work', WORK_MODES, 'work-grid', 'work-panel', 'work-label', 'work-note');
  initModeGrid(workflows, 'review', REVIEW_MODES, 'review-grid', 'review-panel', 'review-label', null);
  initCopyButtons();
}

main();
