const ASSET_BASE = new URL('./', import.meta.url);

const GROUP_ORDER = ['Bootstrap', 'Maintenance', 'Architecture work', 'Review'];

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
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function groupWorkflows(workflows, roleFilter, query) {
  const q = query.trim().toLowerCase();
  const filtered = workflows.filter((w) => {
    if (roleFilter && w.role !== roleFilter) return false;
    if (!q) return true;
    const hay = [
      w.id,
      w.role,
      w.group,
      w.when,
      w.prerequisite,
      w.prompt,
      ...(w.steps || []),
      ...(w.placeholders || []),
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });

  const groups = new Map();
  for (const w of filtered) {
    const key = w.group || w.role;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(w);
  }

  const ordered = [];
  for (const name of GROUP_ORDER) {
    if (groups.has(name)) {
      ordered.push([name, groups.get(name)]);
      groups.delete(name);
    }
  }
  for (const [name, items] of groups) {
    ordered.push([name, items]);
  }
  return ordered;
}

function renderContract(w) {
  const article = document.createElement('article');
  article.className = 'contract';
  article.id = w.id;

  const freshBadge = w.freshChat
    ? '<span class="tag tag-warn">Neuer Chat Pflicht</span>'
    : w.freshNote
      ? `<span class="tag tag-muted">${escapeHtml(w.freshNote)}</span>`
      : '';

  const prereq = w.prerequisite
    ? `<p class="contract-prereq"><strong>Voraussetzung:</strong> ${escapeHtml(w.prerequisite)}</p>`
    : '';

  const steps = (w.steps || [])
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join('');

  const placeholders = (w.placeholders || []).length
    ? `<p class="contract-placeholders"><strong>Platzhalter im Prompt:</strong> ${w.placeholders
        .map((p) => `<code>&lt;${escapeHtml(p)}&gt;</code>`)
        .join(' · ')}</p>`
    : '';

  const anchorTags = w.anchors
    .map((a) => `<span class="tag tag-anchor">${anchorLabel(a)}</span>`)
    .join('');

  article.innerHTML = `
    <header class="contract-head">
      <div>
        <h3>${escapeHtml(w.id)}</h3>
        <p class="contract-when">${escapeHtml(w.when)}</p>
      </div>
      <div class="contract-actions">
        <button type="button" class="copy primary" data-copy="prompt">Session-Prompt kopieren</button>
        <button type="button" class="copy secondary" data-copy="checkout">Checkout kopieren</button>
        <button type="button" class="copy secondary" data-copy="anchors">Anchors-Zeile kopieren</button>
      </div>
    </header>
    ${prereq}
    ${placeholders}
    <p class="contract-intro">In dieser Session soll der Agent:</p>
    <ul class="contract-steps">${steps || '<li>Session-Prompt lesen und Rolle befolgen.</li>'}</ul>
    <details class="contract-prompt">
      <summary>Vollständiger Session-Prompt</summary>
      <pre>${escapeHtml(w.prompt)}</pre>
    </details>
    <footer class="contract-tags">
      <span class="tag tag-role">${escapeHtml(w.role)}</span>
      ${freshBadge}
      ${anchorTags}
    </footer>
  `;

  article.querySelector('[data-copy="prompt"]').addEventListener('click', () => copyText(w.prompt));
  article.querySelector('[data-copy="checkout"]').addEventListener('click', () =>
    copyText(`./scripts/bp-workflow.sh checkout ${w.id}`)
  );
  const anchorLine = w.anchors.map((a) => anchorLabel(a)).join(', ');
  article.querySelector('[data-copy="anchors"]').addEventListener('click', () =>
    copyText(`Output ${anchorLine} before stop.`)
  );

  return article;
}

function renderContracts(workflows, roleFilter, query) {
  const list = document.getElementById('contract-list');
  list.innerHTML = '';
  const grouped = groupWorkflows(workflows, roleFilter, query);

  if (!grouped.length) {
    list.innerHTML = '<p class="panel-intro">Keine Workflows passen zum Filter.</p>';
    return;
  }

  for (const [groupName, items] of grouped) {
    const section = document.createElement('section');
    section.className = 'contract-group';
    section.innerHTML = `<h2 class="group-title">${escapeHtml(groupName)}</h2>`;
    const inner = document.createElement('div');
    inner.className = 'contract-group-inner';
    for (const w of items) {
      inner.appendChild(renderContract(w));
    }
    section.appendChild(inner);
    list.appendChild(section);
  }
}

function renderAnchors(anchors, query) {
  const q = query.trim().toLowerCase();
  const body = document.getElementById('anchor-body');
  body.innerHTML = '';

  for (const a of anchors) {
    if (q && !a.id.toLowerCase().includes(q) && !a.meaning.toLowerCase().includes(q)) {
      continue;
    }
    const tr = document.createElement('tr');
    const wf = Array.isArray(a.workflows) ? a.workflows.join(', ') : a.workflows;
    tr.innerHTML = `
      <td><code>${anchorLabel(a.id)}</code></td>
      <td>${escapeHtml(a.meaning)}</td>
      <td>${escapeHtml(wf)}</td>
      <td></td>
    `;
    const btn = document.createElement('button');
    btn.className = 'copy secondary';
    btn.type = 'button';
    btn.textContent = 'Kopieren';
    btn.addEventListener('click', () => copyText(anchorLabel(a.id)));
    tr.lastElementChild.appendChild(btn);
    body.appendChild(tr);
  }
}

function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  const panels = {
    contracts: document.getElementById('panel-contracts'),
    anchors: document.getElementById('panel-anchors'),
    start: document.getElementById('panel-start'),
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
      Object.entries(panels).forEach(([key, panel]) => {
        const on = tab.dataset.tab === key;
        panel.hidden = !on;
        panel.classList.toggle('active', on);
      });
    });
  });
}

async function main() {
  initTabs();

  let workflows;
  let anchors;
  try {
    [workflows, anchors] = await Promise.all([
      loadJson('workflows.json'),
      loadJson('anchors.json'),
    ]);
  } catch (err) {
    document.getElementById('contract-list').innerHTML = `
      <p class="panel-intro">
        Daten konnten nicht geladen werden. Lokalen Server starten:<br>
        <code>python3 -m http.server 8765</code> in <code>docs/assistant/</code><br>
        Oder: <code>./scripts/open-assistant.sh</code> im Repo-Root.
      </p>`;
    console.error(err);
    return;
  }

  const roleFilter = document.getElementById('filter-role');
  const searchWf = document.getElementById('search-workflows');
  const searchAn = document.getElementById('search-anchors');

  const refresh = () => renderContracts(workflows, roleFilter.value, searchWf.value);
  roleFilter.addEventListener('change', refresh);
  searchWf.addEventListener('input', refresh);
  searchAn.addEventListener('input', () => renderAnchors(anchors, searchAn.value));

  refresh();
  renderAnchors(anchors, '');
}

main();
