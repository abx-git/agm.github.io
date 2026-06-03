const ASSET_BASE = new URL('./', import.meta.url);

const GROUP_ORDER = ['Bootstrap', 'Maintenance', 'Architecture work', 'Review'];

const GOAL_HINTS = {
  maintenance: 'Git-Diff in den Session-Prompt einfügen, bevor du den Chat startest.',
  'architecture-work-query': 'Platzhalter <your question here> durch deine Frage ersetzen.',
  'architecture-work-analysis': 'Topic, Scope und Focus im Prompt anpassen.',
  'architecture-work-design': 'Goal und Constraints im Prompt ausfüllen.',
  'review-maintenance': 'Immer einen neuen Chat — der Agent darf nichts reparieren, nur berichten.',
  'review-phase': 'Immer einen neuen Chat — Report-only.',
  'review-milestone': 'Immer einen neuen Chat — prüft den gesamten docs/architecture/-Graphen.',
};

async function loadJson(filename) {
  const res = await fetch(new URL(filename, ASSET_BASE));
  if (!res.ok) throw new Error(`Failed to load ${filename}`);
  return res.json();
}

function showToast(message = 'In Zwischenablage kopiert') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { el.hidden = true; }, 1800);
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
  showToast();
}

function anchorLabel(id) {
  return `[[ANCHOR:${id}]]`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function workflowById(workflows, id) {
  return workflows.find((w) => w.id === id);
}

function initCopyButtons() {
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sel = btn.getAttribute('data-copy');
      const el = document.querySelector(sel);
      if (el) copyText(el.textContent.trim());
    });
  });

  document.querySelectorAll('[data-copy-text]').forEach((btn) => {
    btn.addEventListener('click', () => {
      copyText(btn.getAttribute('data-copy-text'));
    });
  });
}

function initBootstrapFirstSession(workflows) {
  const w = workflowById(workflows, 'bootstrap-init');
  const box = document.getElementById('first-session-prompt');
  const btn = document.getElementById('copy-bootstrap-prompt');
  if (!w || !box || !btn) return;

  box.textContent = w.prompt;
  btn.disabled = false;
  btn.addEventListener('click', () => copyText(w.prompt));
}

function initGoalPicker(workflows) {
  const picker = document.getElementById('goal-picker');
  const detail = document.getElementById('goal-detail');
  if (!picker || !detail) return;

  let current = null;

  const showGoal = (id) => {
    const w = workflowById(workflows, id);
    if (!w) {
      detail.hidden = true;
      current = null;
      return;
    }
    current = w;
    detail.hidden = false;

    document.getElementById('goal-id').textContent = w.id;
    document.getElementById('goal-when').textContent = w.when;

    const freshEl = document.getElementById('goal-fresh');
    freshEl.hidden = !w.freshChat;

    const checkout = `./scripts/bp-workflow.sh checkout ${w.id}`;
    document.getElementById('goal-checkout').textContent = checkout;
    document.getElementById('goal-prompt').textContent = w.prompt;

    const hint = GOAL_HINTS[w.id] || (w.prerequisite ? `Voraussetzung: ${w.prerequisite}` : '');
    document.getElementById('goal-hint').textContent = hint;
  };

  picker.addEventListener('change', () => showGoal(picker.value));

  document.getElementById('copy-goal-checkout')?.addEventListener('click', () => {
    if (current) copyText(`./scripts/bp-workflow.sh checkout ${current.id}`);
  });

  document.getElementById('copy-goal-prompt')?.addEventListener('click', () => {
    if (current) copyText(current.prompt);
  });
}

function renderWorkflowItem(w) {
  const details = document.createElement('details');
  details.className = 'wf-item';
  details.id = w.id;

  const fresh = w.freshChat ? ' · Neuer Chat Pflicht' : '';
  const steps = (w.steps || [])
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join('');

  details.innerHTML = `
    <summary>${escapeHtml(w.id)}<span class="wf-when">— ${escapeHtml(w.when)}${fresh}</span></summary>
    <div class="wf-item-body">
      ${w.prerequisite ? `<p class="cell-note"><strong>Voraussetzung:</strong> ${escapeHtml(w.prerequisite)}</p>` : ''}
      ${steps ? `<ul class="wf-steps">${steps}</ul>` : ''}
      <div class="wf-actions">
        <button type="button" class="copy-btn primary wf-copy-prompt">Prompt kopieren</button>
        <button type="button" class="copy-btn wf-copy-checkout">Checkout kopieren</button>
      </div>
    </div>
  `;

  details.querySelector('.wf-copy-prompt').addEventListener('click', (e) => {
    e.preventDefault();
    copyText(w.prompt);
  });
  details.querySelector('.wf-copy-checkout').addEventListener('click', (e) => {
    e.preventDefault();
    copyText(`./scripts/bp-workflow.sh checkout ${w.id}`);
  });

  return details;
}

function renderWorkflowList(workflows, roleFilter, query) {
  const q = query.trim().toLowerCase();
  const list = document.getElementById('workflow-list');
  if (!list) return;
  list.innerHTML = '';

  const filtered = workflows.filter((w) => {
    if (roleFilter && w.role !== roleFilter) return false;
    if (!q) return true;
    return [w.id, w.role, w.when, w.prompt, ...(w.steps || [])].join(' ').toLowerCase().includes(q);
  });

  if (!filtered.length) {
    list.innerHTML = '<p class="cell-note">Keine Treffer.</p>';
    return;
  }

  const groups = new Map();
  for (const w of filtered) {
    const key = w.group || w.role;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(w);
  }

  for (const name of GROUP_ORDER) {
    if (!groups.has(name)) continue;
    const heading = document.createElement('h3');
    heading.textContent = name;
    heading.style.fontSize = '0.85rem';
    heading.style.textTransform = 'uppercase';
    heading.style.letterSpacing = '0.05em';
    heading.style.color = 'var(--muted)';
    list.appendChild(heading);
    for (const w of groups.get(name)) {
      list.appendChild(renderWorkflowItem(w));
    }
    groups.delete(name);
  }
  for (const [, items] of groups) {
    for (const w of items) list.appendChild(renderWorkflowItem(w));
  }
}

function renderAnchors(anchors, query) {
  const q = query.trim().toLowerCase();
  const body = document.getElementById('anchor-body');
  if (!body) return;
  body.innerHTML = '';

  for (const a of anchors) {
    if (q && !a.id.toLowerCase().includes(q) && !a.meaning.toLowerCase().includes(q)) continue;
    const tr = document.createElement('tr');
    const wf = Array.isArray(a.workflows) ? a.workflows.join(', ') : a.workflows;
    tr.innerHTML = `
      <td><code>${anchorLabel(a.id)}</code></td>
      <td>${escapeHtml(a.meaning)}</td>
      <td>${escapeHtml(wf)}</td>
      <td></td>
    `;
    const btn = document.createElement('button');
    btn.className = 'copy-btn small';
    btn.type = 'button';
    btn.textContent = 'Kopieren';
    btn.addEventListener('click', () => copyText(anchorLabel(a.id)));
    tr.lastElementChild.appendChild(btn);
    body.appendChild(tr);
  }
}

function initTocHighlight() {
  const links = document.querySelectorAll('.toc a');
  const sections = [...links].map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === `#${entry.target.id}`));
      }
    },
    { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
  );

  sections.forEach((s) => observer.observe(s));
}

async function main() {
  initCopyButtons();
  initTocHighlight();

  let workflows;
  let anchors;
  try {
    [workflows, anchors] = await Promise.all([
      loadJson('workflows.json'),
      loadJson('anchors.json'),
    ]);
  } catch (err) {
    const list = document.getElementById('workflow-list');
    if (list) {
      list.innerHTML = `
        <p class="cell-note">
          Daten nicht geladen — lokalen Server starten:<br>
          <code>./scripts/open-assistant.sh</code>
        </p>`;
    }
    console.error(err);
    return;
  }

  initBootstrapFirstSession(workflows);
  initGoalPicker(workflows);

  const roleFilter = document.getElementById('filter-role');
  const searchWf = document.getElementById('search-workflows');
  const searchAn = document.getElementById('search-anchors');

  const refresh = () => renderWorkflowList(workflows, roleFilter?.value || '', searchWf?.value || '');
  roleFilter?.addEventListener('change', refresh);
  searchWf?.addEventListener('input', refresh);
  searchAn?.addEventListener('input', () => renderAnchors(anchors, searchAn.value));

  refresh();
  renderAnchors(anchors, '');
}

main();
