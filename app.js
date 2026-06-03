const ASSET_BASE = new URL('./', import.meta.url);

const USE_MODES = [
  { id: 'maintenance', label: 'After code change', note: 'Paste git diff into the prompt.' },
  { id: 'architecture-work-query', label: 'Answer question', note: 'Set your question in the prompt.' },
  { id: 'architecture-work-analysis', label: 'Analyze', note: 'Set topic, scope, and focus.' },
  { id: 'architecture-work-design', label: 'Design proposal', note: 'Set goal and constraints.' },
  { id: 'architecture-work-continue', label: 'Open work items', note: 'Continues WRK entries in blueprint.md.' },
  { id: 'refinement', label: 'Deepen section', note: 'Scoped arc42 refinement.' },
  { id: 'review-maintenance', label: 'Review docs', note: 'New chat. Report-only.' },
];

function checkoutCmd(id) {
  return `./scripts/bp-workflow.sh checkout ${id}`;
}

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

function initTabs() {
  const tabs = document.querySelectorAll('.phase-tab');
  const panels = {
    create: document.getElementById('phase-create'),
    use: document.getElementById('phase-use'),
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

function initStaticCopy() {
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const el = document.querySelector(btn.dataset.copy);
      if (el) copy(el.textContent.trim());
    });
  });
}

function bindStep(stepEl, workflow) {
  const code = stepEl.querySelector('.checkout');
  code.textContent = checkoutCmd(workflow.id);

  stepEl.querySelector('.btn-checkout').addEventListener('click', () => {
    copy(checkoutCmd(workflow.id));
  });
  stepEl.querySelector('.btn-prompt').addEventListener('click', () => {
    copy(workflow.prompt);
  });
}

function initCreatePhase(workflows) {
  document.querySelectorAll('.step[data-workflow]').forEach((step) => {
    const w = byId(workflows, step.dataset.workflow);
    if (w) bindStep(step, w);
  });
}

function initUsePhase(workflows) {
  const grid = document.getElementById('mode-grid');
  const panel = document.getElementById('mode-panel');
  let current = null;

  for (const mode of USE_MODES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mode-btn';
    btn.textContent = mode.label;
    btn.addEventListener('click', () => {
      grid.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const w = byId(workflows, mode.id);
      if (!w) return;
      current = w;
      panel.hidden = false;

      document.getElementById('mode-label').textContent = w.when;
      document.getElementById('mode-checkout').textContent = checkoutCmd(w.id);

      const note = document.getElementById('mode-note');
      const text = mode.note || (w.freshChat ? 'New chat required.' : '');
      note.textContent = text;
      note.hidden = !text;
    });
    grid.appendChild(btn);
  }

  document.getElementById('mode-copy-checkout').addEventListener('click', () => {
    if (current) copy(checkoutCmd(current.id));
  });
  document.getElementById('mode-copy-prompt').addEventListener('click', () => {
    if (current) copy(current.prompt);
  });
}

async function loadAdoptPrompt() {
  const res = await fetch(new URL('adopt-prompt.txt', ASSET_BASE));
  if (!res.ok) throw new Error('adopt-prompt.txt');
  return res.text();
}

async function main() {
  initTabs();
  initStaticCopy();

  let workflows;
  let adoptPrompt = '';

  try {
    [workflows, adoptPrompt] = await Promise.all([
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

  document.getElementById('copy-adopt')?.addEventListener('click', () => copy(adoptPrompt));

  initCreatePhase(workflows);
  initUsePhase(workflows);
}

main();
