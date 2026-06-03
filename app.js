const ASSET_BASE = new URL('./', import.meta.url);

async function loadJson(filename) {
  const res = await fetch(new URL(filename, ASSET_BASE));
  if (!res.ok) throw new Error(`Failed to load ${filename}`);
  return res.json();
}

function showToast() {
  const el = document.getElementById('toast');
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

function renderWorkflows(workflows, roleFilter, query) {
  const q = query.trim().toLowerCase();
  const list = document.getElementById('workflow-list');
  list.innerHTML = '';

  const filtered = workflows.filter((w) => {
    if (roleFilter && w.role !== roleFilter) return false;
    if (!q) return true;
    return (
      w.id.includes(q) ||
      w.role.includes(q) ||
      w.when.toLowerCase().includes(q) ||
      w.prompt.toLowerCase().includes(q)
    );
  });

  for (const w of filtered) {
    const card = document.createElement('article');
    card.className = 'card';
    const fresh = w.freshChat
      ? '<span class="badge badge-fresh">new chat required</span>'
      : '';
    card.innerHTML = `
      <h2>${w.id}</h2>
      <div class="card-meta">
        <span class="badge">${w.role}</span>
        ${fresh}
        ${w.when}
      </div>
      <div class="card-actions"></div>
      <pre class="prompt-preview"></pre>
    `;
    const actions = card.querySelector('.card-actions');
    const preview = card.querySelector('.prompt-preview');
    preview.textContent = w.prompt.slice(0, 320) + (w.prompt.length > 320 ? '…' : '');

    const btnPrompt = document.createElement('button');
    btnPrompt.className = 'copy';
    btnPrompt.type = 'button';
    btnPrompt.textContent = 'Copy session prompt';
    btnPrompt.addEventListener('click', () => copyText(w.prompt));

    const btnCheckout = document.createElement('button');
    btnCheckout.className = 'copy secondary';
    btnCheckout.type = 'button';
    btnCheckout.textContent = 'Copy checkout command';
    btnCheckout.addEventListener('click', () =>
      copyText(`./scripts/bp-workflow.sh checkout ${w.id}`)
    );

    const btnAnchors = document.createElement('button');
    btnAnchors.className = 'copy secondary';
    btnAnchors.type = 'button';
    btnAnchors.textContent = 'Copy anchors line';
    const anchorLine = w.anchors.map((a) => anchorLabel(a)).join(', ');
    btnAnchors.addEventListener('click', () => copyText(`Output ${anchorLine} before stop.`));

    actions.append(btnPrompt, btnCheckout, btnAnchors);
    list.appendChild(card);
  }

  if (!filtered.length) {
    list.innerHTML = '<p class="panel-intro">No workflows match.</p>';
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
      <td>${a.meaning}</td>
      <td>${wf}</td>
      <td></td>
    `;
    const btn = document.createElement('button');
    btn.className = 'copy secondary';
    btn.type = 'button';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => copyText(anchorLabel(a.id)));
    tr.lastElementChild.appendChild(btn);
    body.appendChild(tr);
  }
}

function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  const panels = {
    workflows: document.getElementById('panel-workflows'),
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
    document.getElementById('workflow-list').innerHTML = `
      <p class="panel-intro">
        Could not load data. Start a local server from this folder:<br>
        <code>python3 -m http.server 8765</code><br>
        Then open <code>http://localhost:8765</code><br>
        Or run <code>./scripts/open-assistant.sh</code> from the repo root.
      </p>`;
    console.error(err);
    return;
  }

  const roleFilter = document.getElementById('filter-role');
  const searchWf = document.getElementById('search-workflows');
  const searchAn = document.getElementById('search-anchors');

  const refresh = () =>
    renderWorkflows(workflows, roleFilter.value, searchWf.value);
  roleFilter.addEventListener('change', refresh);
  searchWf.addEventListener('input', refresh);
  searchAn.addEventListener('input', () => renderAnchors(anchors, searchAn.value));

  refresh();
  renderAnchors(anchors, '');
}

main();
