const ASSET_BASE = new URL('./', import.meta.url);
const STORAGE_KEY = 'bp-adopt-params';
const BP_INSTALL_URL =
  'https://raw.githubusercontent.com/abx-git/blueprint-pattern/main/scripts/bp-install.sh';

const EVOLVE_MODES = [
  { id: 'refinement', label: 'Deepen section', note: 'Scoped refinement of one template section.' },
  { id: 'maintenance', label: 'Paste git diff', note: 'You supply the diff text.' },
  {
    id: 'maintenance-diff-range',
    label: 'Git range (MCP/shell)',
    note: 'Agent fetches diff between start and end ref — pipeline-friendly.',
  },
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

/** Evolve workflows that receive the documentation focus block. */
const EVOLVE_WORKFLOW_IDS = new Set(['refinement', 'maintenance', 'maintenance-diff-range']);

/** Documentation focus — extends blueprint.md from bootstrap (see prompts/reference/doc-extensions.md). */
const DOC_EXTENSIONS = [
  {
    id: 'onboarding',
    label: 'Onboarding & navigation',
    hint: 'Reading paths in entry-point for developers and architects',
    bootstrap: [
      'entry-point.md: add ## Onboarding with recommended reading order by role (developer, architect, ops).',
      'always-on.md: link to entry-point ## Onboarding.',
    ],
    evolve: [
      'After structural doc changes: update ## Onboarding paths and role-based reading order in entry-point.md.',
      'Ensure always-on.md still points to the onboarding section.',
    ],
  },
  {
    id: 'operations',
    label: 'Operations & incidents',
    hint: 'ops/: runbooks, pitfalls, troubleshooting, environments',
    bootstrap: [
      'blueprint.md: phase row for ops/ ([ ] open) if not already present (arc42 phase 13).',
      'entry-point.md: ## Operations linking ops/pitfalls.md, ops/troubleshooting.md, ops/runbooks/.',
    ],
    evolve: [
      'Maintenance: if diff touches runtime, deploy, config, or incidents — update ops/pitfalls.md, ops/troubleshooting.md, ops/runbooks/ as needed.',
      'Refinement: prefer scoped updates under ops/ when deepening operational knowledge.',
    ],
  },
  {
    id: 'persistence',
    label: 'Persistence & data',
    hint: 'Data stores, schema, migrations',
    bootstrap: [
      'Prioritize template sections for data model (runtime, concepts, overview — per template).',
      'context/on-demand.md: ## Data stores table (technology, ownership, links to code).',
      'blueprint.md: note persistence as elevated priority in session log / phase rationale.',
    ],
    evolve: [
      'Maintenance: update data model sections and context/on-demand.md when migrations, entities, or repositories change.',
      'Refinement: deepen persistence-related template sections with evidence from source.',
    ],
  },
  {
    id: 'interfaces',
    label: 'Integration contracts',
    hint: 'interfaces/exports.md and imports.md',
    bootstrap: [
      'blueprint.md: early priority for interfaces/ phase (after context or in phase 3).',
      'Populate interfaces/ stubs with first known APIs/events; link from building blocks / runtime.',
    ],
    evolve: [
      'Maintenance: always classify API/event/schema diffs; update interfaces/exports.md and imports.md and cross-links.',
    ],
  },
  {
    id: 'security',
    label: 'Security & compliance',
    hint: 'Constraints, quality, risks',
    bootstrap: [
      'Elevate constraints, quality, and risks phases in blueprint.md ordering notes.',
      'context/on-demand.md: ## Security & compliance assumptions (short, evidence-linked).',
    ],
    evolve: [
      'Maintenance: update constraints, quality, risks, and on-demand security notes when auth, crypto, or policy code changes.',
    ],
  },
  {
    id: 'deployment',
    label: 'Deployment & environments',
    hint: 'Deployment view + environment map',
    bootstrap: [
      'Template deployment section + ops/environments.md (if installed).',
      'entry-point.md: link environments and deployment docs.',
    ],
    evolve: [
      'Maintenance: sync deployment template sections and ops/environments.md with infra/config diffs.',
    ],
  },
  {
    id: 'observability',
    label: 'Observability',
    hint: 'Logs, metrics, traces',
    bootstrap: [
      'Template runtime section: observability subsection stub.',
      'ops/troubleshooting.md (if installed): link dashboards/runbooks.',
      'entry-point.md: ## Observability links.',
    ],
    evolve: [
      'Maintenance: update runtime observability notes and ops/troubleshooting.md when logging, metrics, or tracing changes.',
    ],
  },
  {
    id: 'decisions',
    label: 'Architecture decisions (ADRs)',
    hint: '<template>/decisions/',
    bootstrap: [
      'blueprint.md: dedicated phase row for <template>/decisions/ near top of plan.',
      'entry-point.md: ## Decisions index linking decisions/README.md and 001-template.md.',
    ],
    evolve: [
      'Maintenance/refinement: draft or update ADRs in <template>/decisions/ when the change implies an architectural decision.',
    ],
  },
  {
    id: 'ecosystem',
    label: 'Multi-service ecosystem',
    hint: 'Partner services and cross-repo links',
    bootstrap: [
      'interfaces/imports.md: partner export links as primary work.',
      'ecosystem-index.md (if installed): table of services, entry-point, exports.',
      'entry-point.md: ## Ecosystem links.',
    ],
    evolve: [
      'Maintenance: update imports.md partner links and ecosystem-index.md when integration boundaries change.',
    ],
  },
  {
    id: 'domain-glossary',
    label: 'Domain language & glossary',
    hint: 'Ubiquitous language, glossary phase',
    bootstrap: [
      'context/on-demand.md: ## Key domain concepts table.',
      'blueprint.md: prioritize glossary / context terminology phase.',
      'entry-point.md: link glossary and domain terms.',
    ],
    evolve: [
      'Maintenance/refinement: update glossary, on-demand concepts, and ubiquitous language when domain terms change in code or APIs.',
    ],
  },
];

/** Per-workflow user fields (name → placeholder in workflow prompt). */
const WORKFLOW_INPUTS = {
  'architecture-work-query': [
    { name: 'question', label: 'Your question', placeholder: 'e.g. How does order-service call payment-service?', required: true },
    { name: 'slug', label: 'Work file slug', placeholder: 'e.g. order-payment-flow', required: true },
  ],
  'architecture-work-analysis': [
    { name: 'topic', label: 'Topic', placeholder: 'e.g. payment integration resilience', required: true },
    { name: 'scope', label: 'Scope', placeholder: 'modules, services, or template sections', required: true },
    { name: 'focus', label: 'Focus', placeholder: 'e.g. coupling, failure modes, security', required: true },
    { name: 'slug', label: 'Work file slug', placeholder: 'e.g. payment-resilience', required: true },
  ],
  'architecture-work-design': [
    { name: 'goal', label: 'Goal', placeholder: 'e.g. add circuit breaker between services', required: true },
    { name: 'constraints', label: 'Constraints (optional)', placeholder: 'latency, no new infra, …', required: false },
    { name: 'slug', label: 'Work file slug', placeholder: 'e.g. payment-circuit-breaker', required: true },
  ],
  refinement: [
    { name: 'goal', label: 'Goal', placeholder: 'e.g. extend runtime.md with retry behavior', required: true },
    { name: 'scope', label: 'Scope', placeholder: 'template paths or blueprint phase numbers', required: true },
  ],
  maintenance: [
    { name: 'gitDiff', label: 'Git diff or PR summary', placeholder: 'paste git diff …', required: true, multiline: true },
  ],
  'maintenance-diff-range': [
    {
      name: 'diffFrom',
      label: 'Start ref (DIFF_FROM)',
      placeholder: 'e.g. origin/main or abc1234',
      required: true,
    },
    {
      name: 'diffTo',
      label: 'End ref (DIFF_TO)',
      placeholder: 'HEAD',
      required: false,
    },
  ],
  'review-phase': [
    { name: 'slug', label: 'Review report slug', placeholder: 'e.g. phase-3-context', required: true },
  ],
};

const panelState = { evolve: null, work: null, review: null };
const inputState = { evolve: {}, work: {}, review: {} };

async function loadWorkflows() {
  const res = await fetch(new URL('workflows.json', ASSET_BASE));
  if (!res.ok) throw new Error('workflows.json');
  return res.json();
}

function showToast() {
  const el = document.getElementById('toast');
  el.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    el.hidden = true;
  }, 1400);
}

async function copy(text) {
  await navigator.clipboard.writeText(text);
  showToast();
}

function byId(workflows, id) {
  return workflows.find((w) => w.id === id);
}

function normDocRoot(raw) {
  let r = String(raw || 'docs/architecture/').trim();
  if (!r) r = 'docs/architecture';
  r = r.replace(/\/+$/, '');
  return `${r}/`;
}

function readDocFocus(form) {
  return Array.from(form.querySelectorAll('input[name="docFocus"]:checked')).map(
    (cb) => cb.value
  );
}

function readForm(form) {
  const data = new FormData(form);
  const template = String(data.get('template') || 'arc42');
  return {
    os: String(data.get('os') || 'macos'),
    aiTool: String(data.get('aiTool') || 'cursor'),
    appName: String(data.get('appName') || '').trim(),
    template,
    customTemplate: String(data.get('customTemplate') || '').trim(),
    purpose: String(data.get('purpose') || '').trim(),
    stack: String(data.get('stack') || '').trim(),
    docRoot: normDocRoot(data.get('docRoot')),
    sourceRoot: String(data.get('sourceRoot') || '').trim(),
    externalSystems: String(data.get('externalSystems') || '').trim(),
    docFocus: readDocFocus(form),
  };
}

function resolvedTemplate(params) {
  if (params.template === 'custom') {
    return params.customTemplate || 'custom';
  }
  return params.template || 'arc42';
}

/** Example section path per documentation template (for placeholders and hints). */
const TEMPLATE_HINTS = {
  arc42: { exampleSection: 'arc42/runtime.md' },
  'c4-light': { exampleSection: 'c4-light/components.md' },
  'adr-first': { exampleSection: 'adr-first/views.md' },
  'lean-service': { exampleSection: 'lean-service/runtime.md' },
  custom: { exampleSection: 'custom/overview.md' },
};

function templateExampleSection(templateId) {
  const t = templateId || 'arc42';
  return (TEMPLATE_HINTS[t] || { exampleSection: `${t}/overview.md` }).exampleSection;
}

/** Replace <template> tokens and legacy arc42-only wording in prompts and labels. */
function substituteTemplate(text, templateId) {
  const t = templateId || 'arc42';
  const example = templateExampleSection(t);
  let out = String(text)
    .replace(/<template-example-section>/g, example)
    .replace(/<template>/g, t);

  out = out
    .replace(/\barc42\/decisions\/?/gi, `${t}/decisions/`)
    .replace(/\barc42\//gi, `${t}/`)
    .replace(/modules, services, or arc42 sections/gi, `modules, services, or ${t} sections`)
    .replace(/relevant work\/ items and arc42 sections/gi, `relevant work/ items and ${t} sections`)
    .replace(/follow imports\/exports, arc42, and ops links/gi, `follow imports/exports, ${t}/, and ops links`)
    .replace(/specific arc42 sections/gi, `specific ${t} sections`)
    .replace(/Resume arc42 phases/gi, 'Resume blueprint phases')
    .replace(/After each arc42 phase/gi, 'After each blueprint phase')
    .replace(/arc42 paths, modules, or blueprint phase numbers/gi, `paths under ${t}/, modules, or blueprint phase numbers`)
    .replace(/e\.g\. extend arc42\/[\w.-]+[^\n]*/gi, `e.g. extend ${example} with …`);

  return out;
}

function substituteDocRoot(text, docRoot) {
  const norm = normDocRoot(docRoot);
  const noSlash = norm.replace(/\/$/, '');
  return text
    .replace(/docs\/architecture\//g, norm)
    .replace(/docs\/architecture(?![/\w])/g, noSlash)
    .replace(/<doc-root>\//g, norm)
    .replace(/<doc-root>/g, noSlash);
}

function workflowRole(workflow) {
  const r = String(workflow.role || '').trim();
  return r.split('`')[0].split('(')[0].trim() || 'bootstrap';
}

function buildDocFocusBlock(params) {
  const ids = params.docFocus || [];
  if (!ids.length) return '';
  const template = resolvedTemplate(params);
  const lines = [
    '## Documentation focus (bootstrap — extend blueprint.md)',
    '',
    'Selected orientations (implement all; see prompts/reference/doc-extensions.md):',
    '',
  ];
  for (const ext of DOC_EXTENSIONS) {
    if (!ids.includes(ext.id)) continue;
    lines.push(`### ${ext.label} (\`${ext.id}\`)`);
    lines.push(`_${ext.hint}_`);
    for (const step of ext.bootstrap) {
      lines.push(`- ${substituteTemplate(step, template)}`);
    }
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function buildDocFocusEvolveBlock(params) {
  const ids = params.docFocus || [];
  if (!ids.length) return '';
  const template = resolvedTemplate(params);
  const lines = [
    '## Documentation focus (evolve — respect selected orientations)',
    '',
    'Apply to this refinement or maintenance session (see prompts/reference/doc-extensions.md):',
    '',
  ];
  for (const ext of DOC_EXTENSIONS) {
    if (!ids.includes(ext.id)) continue;
    lines.push(`### ${ext.label} (\`${ext.id}\`)`);
    const steps = ext.evolve || ext.bootstrap;
    for (const step of steps) {
      lines.push(`- ${substituteTemplate(step, template)}`);
    }
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function buildParameterBlock(params) {
  const template = resolvedTemplate(params);
  const docRoot = normDocRoot(params.docRoot);
  const lines = [
    '## Adoption parameters (from architect — do not re-interview if already set)',
    '',
    `- Application: ${params.appName}`,
    `- Documentation template: ${template}`,
    `- Documentation root: ${docRoot}`,
    `- Install: bp-install.sh completed (prompts + scaffold present)`,
  ];
  if (params.purpose) lines.push(`- Purpose / domain: ${params.purpose}`);
  if (params.stack) lines.push(`- Stack: ${params.stack}`);
  if (params.sourceRoot) lines.push(`- Primary source path: ${params.sourceRoot}`);
  if (params.externalSystems) lines.push(`- External systems: ${params.externalSystems}`);
  if (params.docFocus?.length) {
    lines.push(`- Documentation focus: ${params.docFocus.join(', ')}`);
  }
  lines.push('');
  const focusBlock = buildDocFocusBlock(params);
  if (focusBlock) lines.push(focusBlock.trimEnd(), '');
  lines.push('## File roles (create all three under documentation root — do not merge)');
  lines.push(`- ${docRoot}context/always-on.md — session context (name, stack, source map)`);
  lines.push(`- ${docRoot}blueprint.md — construction plan: phase rows → target files, status, WRK, reviews, session log`);
  lines.push(`- ${docRoot}entry-point.md — human entry: overview, navigation, source links; no phase status`);
  lines.push('');
  lines.push(`Template folder: "${template}/" under ${docRoot}. Interview only for missing facts.`);
  lines.push('');
  return lines.join('\n');
}

function buildAdoptPrompt(base, params) {
  const block = buildParameterBlock(params);
  let prompt = substituteTemplate(substituteDocRoot(base, params.docRoot), resolvedTemplate(params));
  const anchor = 'Role: bootstrap\n\n';
  if (prompt.includes(anchor)) {
    prompt = prompt.replace(anchor, `${anchor}${block}`);
  } else {
    prompt = `${block}\n${prompt}`;
  }
  return prompt;
}

function bashAssign(name, value) {
  const s = String(value ?? '');
  const escaped = s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`');
  return `${name}="${escaped}"`;
}

function buildInstallScript(params) {
  const docRoot = normDocRoot(params.docRoot);
  const template = resolvedTemplate(params);
  const project = params.appName || 'My Application';
  const aiTool = params.aiTool;
  const os = params.os;

  if (os === 'windows') {
    return buildInstallScriptWindows({
      docRoot,
      template,
      project,
      aiTool,
      docFocus: params.docFocus || [],
    });
  }

  const lines = [
    '#!/usr/bin/env bash',
    '# Blueprint Pattern - generated install script',
    '# Run from your application repository root. No git clone required.',
    '# Save as bp-install-run.sh then: chmod +x bp-install-run.sh && ./bp-install-run.sh',
    'set -euo pipefail',
    '',
    bashAssign('PROJECT', project),
    bashAssign('DOC_ROOT', docRoot),
    bashAssign('TEMPLATE', template),
    bashAssign('AI_TOOL', aiTool),
    bashAssign('DOC_FOCUS', (params.docFocus || []).join(',')),
    '',
    'INSTALLER="$(mktemp -t bp-install.XXXXXX.sh)"',
    'cleanup_installer() { rm -f -- "${INSTALLER:-}"; }',
    'trap cleanup_installer EXIT',
    `curl -fsSL "${BP_INSTALL_URL}" -o "$INSTALLER"`,
    'chmod +x "$INSTALLER"',
    '"$INSTALLER" \\',
    '  --project "$PROJECT" \\',
    '  --doc-root "$DOC_ROOT" \\',
    '  --template "$TEMPLATE" \\',
    '  --ai-tool "$AI_TOOL" \\',
    '  --focus "$DOC_FOCUS"',
    '',
    'echo "Install finished. Open Assistant UI -> Build -> Adopt."',
    '',
  ];
  return lines.join('\n');
}

function buildInstallScriptWindows({ docRoot, template, project, aiTool, docFocus }) {
  const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const focus = (docFocus || []).join(',');
  return [
    '# Blueprint Pattern — generated install script (Windows)',
    '# Run in PowerShell from your application repository root.',
    '# Requires: curl.exe (Windows 10+) or run under Git Bash with the bash script instead.',
    '$ErrorActionPreference = "Stop"',
    '',
    `$Project = ${q(project)}`,
    `$DocRoot = ${q(docRoot)}`,
    `$Template = ${q(template)}`,
    `$AiTool = ${q(aiTool)}`,
    `$DocFocus = ${q(focus)}`,
    '',
    '$Installer = Join-Path $env:TEMP ("bp-install-" + [guid]::NewGuid().ToString("n") + ".sh")',
    `curl.exe -fsSL ${q(BP_INSTALL_URL)} -o $Installer`,
    'if (-not $?) { throw "Download failed. Use Git Bash and the macOS/Linux script from the Assistant UI." }',
    '',
    '# Git Bash (adjust path if needed)',
    '$bash = @("C:\\Program Files\\Git\\bin\\bash.exe", "C:\\Program Files (x86)\\Git\\bin\\bash.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1',
    'if (-not $bash) {',
    '  Write-Host "Install Git for Windows, then re-run — or copy the bash script and run it in Git Bash."',
    '  exit 1',
    '}',
    '',
    '& $bash $Installer `',
    '  --project $Project `',
    '  --doc-root $DocRoot `',
    '  --template $Template `',
    '  --ai-tool $AiTool `',
    '  --focus $DocFocus',
    'Remove-Item -Force $Installer -ErrorAction SilentlyContinue',
    '',
    'Write-Host "Install finished. Open Assistant UI → Build → Adopt."',
    '',
  ].join('\n');
}

function applyWorkflowInputs(prompt, workflowId, values) {
  let out = prompt;
  const map = {
    'your question here': values.question,
    'e.g. payment integration resilience': values.topic,
    'modules, services, or template sections': values.scope,
    'modules, services, or <template> sections': values.scope,
    'e.g. coupling, failure modes, security, performance': values.focus,
    'e.g. add circuit breaker between order-service and payment-service': values.goal,
    'optional: latency, no new infra, etc.': values.constraints,
    'paste git diff or PR diff summary': values.gitDiff,
    goal: values.goal,
    scope: values.scope,
    slug: values.slug,
    'diff-from': values.diffFrom,
    'diff-to': values.diffTo || 'HEAD',
  };
  for (const [placeholder, val] of Object.entries(map)) {
    if (val == null || val === '') continue;
    out = out.replace(new RegExp(`<${placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}>`, 'g'), val);
    if (placeholder.includes('e.g.') || placeholder === 'paste git diff or PR diff summary') {
      out = out.replace(placeholder, val);
    }
  }
  if (values.slug) {
    out = out.replace(/YYYY-MM-DD-<slug>/g, `YYYY-MM-DD-${values.slug}`);
    out = out.replace(/<slug>/g, values.slug);
  }
  if (values.question) {
    out = out.replace(/Question: <your question here>/, `Question: ${values.question}`);
  }
  if (values.gitDiff) {
    out = out.replace(/<paste git diff or PR diff summary>/, values.gitDiff);
    out = out.replace(
      /Git diff:\n<paste git diff or PR diff summary>/,
      `Git diff:\n${values.gitDiff}`
    );
  }
  if (values.diffFrom) {
    const to = values.diffTo || 'HEAD';
    out = out.replace(/DIFF_FROM=<diff-from>/g, `DIFF_FROM=${values.diffFrom}`);
    out = out.replace(/DIFF_TO=<diff-to>/g, `DIFF_TO=${to}`);
    out = out.replace(/<diff-from>/g, values.diffFrom);
    out = out.replace(/<diff-to>/g, to);
    out = out.replace(/\$\{DIFF_FROM\}/g, values.diffFrom);
    out = out.replace(/\$\{DIFF_TO\}/g, to);
  }
  return out;
}

function focusScopeHint(params) {
  const ids = params?.docFocus || [];
  if (!ids.length) return '';
  const labels = ids
    .map((id) => DOC_EXTENSIONS.find((e) => e.id === id)?.id || id)
    .join(', ');
  return ` — or focus areas: ${labels}`;
}

function workflowFields(workflowId, params) {
  const base = WORKFLOW_INPUTS[workflowId];
  if (!base) return [];
  const t = resolvedTemplate(params || {});
  const ex = templateExampleSection(t);
  const scopeExtra = focusScopeHint(params);
  return base.map((field) => {
    if (workflowId === 'refinement' && field.name === 'goal') {
      return { ...field, placeholder: `e.g. extend ${ex} with …` };
    }
    if (workflowId === 'refinement' && field.name === 'scope') {
      return {
        ...field,
        placeholder: `paths under ${t}/, ops/, modules, blueprint phases${scopeExtra}`,
      };
    }
    if (workflowId === 'architecture-work-analysis' && field.name === 'scope') {
      return { ...field, placeholder: `modules, services, or ${t} sections` };
    }
    return { ...field };
  });
}

function personalizeWorkflowWhen(workflow, params) {
  return substituteTemplate(
    substituteDocRoot(workflow.when || '', params.docRoot),
    resolvedTemplate(params)
  );
}

function personalizeWorkflowPrompt(workflow, params, inputValues = {}) {
  const template = resolvedTemplate(params);
  let prompt = substituteDocRoot(workflow.prompt, params.docRoot);
  prompt = substituteTemplate(prompt, template);
  prompt = applyWorkflowInputs(prompt, workflow.id, inputValues);
  const docRoot = normDocRoot(params.docRoot);
  const focusNote =
    params.docFocus?.length > 0
      ? `- Documentation focus: ${params.docFocus.join(', ')}`
      : '';
  const header = [
    '## Session context (installed prompts)',
    '',
    `- Documentation template: ${template}`,
    `- Documentation root: ${docRoot}`,
    `- Template folder: ${docRoot}${template}/`,
    focusNote,
    '- Core rules: prompts/core/system-prompt.md (installed)',
    `- Role file: ${docRoot}prompts/role-${workflowRole(workflow)}.md`,
    `- Workflow reference: prompts/workflows/${workflow.id}.md`,
    '',
  ]
    .filter(Boolean)
    .join('\n');
  const focusBlock = EVOLVE_WORKFLOW_IDS.has(workflow.id)
    ? buildDocFocusEvolveBlock(params)
    : '';
  return `${header}${focusBlock}${prompt}`;
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
    if (key === 'docFocus') continue;
    const el = form.elements.namedItem(key);
    if (el && value != null) el.value = value;
  }
  const focus = params.docFocus || [];
  form.querySelectorAll('input[name="docFocus"]').forEach((cb) => {
    cb.checked = focus.includes(cb.value);
  });
  toggleCustomField(form);
}

function toggleCustomField(form) {
  const custom = form.querySelector('.field-custom');
  const template = form.elements.namedItem('template');
  if (custom && template) {
    custom.hidden = template.value !== 'custom';
  }
}

function initDocFocusGrid(form) {
  const host = document.getElementById('doc-focus-grid');
  if (!host) return;
  host.replaceChildren();
  for (const ext of DOC_EXTENSIONS) {
    const label = document.createElement('label');
    label.className = 'focus-option';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.name = 'docFocus';
    cb.value = ext.id;
    const text = document.createElement('span');
    const strong = document.createElement('strong');
    strong.textContent = ext.label;
    const small = document.createElement('small');
    small.textContent = ext.hint;
    text.append(strong, small);
    label.append(cb, text);
    cb.addEventListener('change', () => {
      const form = document.getElementById('setup-form');
      if (form) {
        saveParams(readForm(form));
        refreshEvolveFocusSummary();
        refreshOpenWorkflowPanels();
      }
    });
    host.append(label);
  }
}

function refreshEvolveFocusSummary() {
  const el = document.getElementById('evolve-focus-summary');
  if (!el) return;
  const form = document.getElementById('setup-form');
  const ids = form ? readDocFocus(form) : loadParams()?.docFocus || [];
  if (!ids.length) {
    el.hidden = true;
    el.textContent = '';
    return;
  }
  const labels = ids.map((id) => DOC_EXTENSIONS.find((e) => e.id === id)?.label || id);
  el.hidden = false;
  el.textContent = `Active documentation focus (included in copied Evolve prompts): ${labels.join(' · ')}. Change selections above.`;
}

function initSetupForm(adoptBase) {
  const form = document.getElementById('setup-form');
  if (!form) return;

  initDocFocusGrid(form);
  applyParams(form, loadParams());
  const installPreview = document.getElementById('install-script-preview');
  const adoptPreview = document.getElementById('prompt-preview');

  function refreshInstallPreview() {
    if (!installPreview) return;
    const params = readForm(form);
    installPreview.textContent = buildInstallScript(params);
  }

  function refreshAdoptPreview() {
    if (!adoptPreview) return;
    const params = readForm(form);
    if (!params.appName) {
      adoptPreview.textContent = 'Enter a project name to preview the adoption block.';
      return;
    }
    if (params.template === 'custom' && !params.customTemplate) {
      adoptPreview.textContent = 'Enter a custom template name.';
      return;
    }
    adoptPreview.textContent = buildParameterBlock(params);
  }

  function refreshTemplateBadge() {
    const badge = document.getElementById('template-active');
    if (!badge) return;
    const params = readForm(form);
    const t = resolvedTemplate(params);
    badge.hidden = false;
    badge.textContent = `Active template for all copied prompts: ${t}/`;
  }

  form.elements.namedItem('template')?.addEventListener('change', () => {
    toggleCustomField(form);
    refreshInstallPreview();
    refreshAdoptPreview();
    refreshTemplateBadge();
    refreshEvolveFocusSummary();
    refreshOpenWorkflowPanels();
  });
  form.addEventListener('input', () => {
    refreshInstallPreview();
    refreshAdoptPreview();
    refreshTemplateBadge();
    refreshEvolveFocusSummary();
    refreshOpenWorkflowPanels();
  });
  refreshInstallPreview();
  refreshAdoptPreview();
  refreshTemplateBadge();
  refreshEvolveFocusSummary();

  document.getElementById('copy-install')?.addEventListener('click', (e) => {
    e.preventDefault();
    const params = readForm(form);
    saveParams(params);
    copy(buildInstallScript(params));
  });

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

function renderWorkflowInputs(container, workflowId, panelKey) {
  if (!container) return;
  container.innerHTML = '';
  const params = loadParams() || { docRoot: 'docs/architecture/', template: 'arc42' };
  const fields = workflowFields(workflowId, params);
  if (!fields?.length) {
    container.hidden = true;
    return;
  }
  container.hidden = false;
  const stored = inputState[panelKey][workflowId] || {};

  for (const field of fields) {
    const label = document.createElement('label');
    label.className = 'field';
    const span = document.createElement('span');
    span.textContent = field.label + (field.required ? ' *' : '');
    label.appendChild(span);

    let input;
    if (field.multiline) {
      input = document.createElement('textarea');
      input.rows = 4;
    } else {
      input = document.createElement('input');
      input.type = 'text';
    }
    input.name = `${panelKey}-${workflowId}-${field.name}`;
    input.placeholder = field.placeholder || '';
    input.value = stored[field.name] || '';
    input.addEventListener('input', () => {
      inputState[panelKey][workflowId] = inputState[panelKey][workflowId] || {};
      inputState[panelKey][workflowId][field.name] = input.value;
      updatePromptPreview(panelKey, workflowId, params);
    });
    label.appendChild(input);
    container.appendChild(label);
  }
}

function updatePromptPreview(panelKey, workflowId, params) {
  const pre = document.getElementById(`${panelKey}-prompt-preview`);
  const w = panelState[panelKey];
  if (!pre || !w || w.id !== workflowId) return;
  pre.textContent = personalizeWorkflowPrompt(
    w,
    params || loadParams() || { docRoot: 'docs/architecture/' },
    inputState[panelKey][workflowId] || {}
  );
}

function bindStep(stepEl, workflow) {
  stepEl.querySelector('.btn-prompt')?.addEventListener('click', () => {
    const params = loadParams() || { docRoot: 'docs/architecture/' };
    copy(personalizeWorkflowPrompt(workflow, params, {}));
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

  const inputsHost = document.getElementById(`${key}-inputs`);
  const previewHost = document.getElementById(`${key}-prompt-preview`);

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
      const sessionParams = loadParams() || { docRoot: 'docs/architecture/', template: 'arc42' };
      if (label) label.textContent = personalizeWorkflowWhen(w, sessionParams);

      const note = document.getElementById(noteId);
      if (note) {
        const text = mode.note || (w.freshChat ? 'New chat required.' : '');
        note.textContent = text;
        note.hidden = !text;
      }

      renderWorkflowInputs(inputsHost, w.id, key);
      if (previewHost) {
        previewHost.textContent = personalizeWorkflowPrompt(
          w,
          loadParams() || { docRoot: 'docs/architecture/' },
          inputState[key][w.id] || {}
        );
      }
    });
    grid.appendChild(btn);
  }
}

function refreshOpenWorkflowPanels() {
  const params = loadParams() || { docRoot: 'docs/architecture/', template: 'arc42' };
  for (const key of ['evolve', 'work', 'review']) {
    const w = panelState[key];
    if (!w) continue;
    const label = document.getElementById(`${key}-label`);
    if (label) label.textContent = personalizeWorkflowWhen(w, params);
    renderWorkflowInputs(document.getElementById(`${key}-inputs`), w.id, key);
    updatePromptPreview(key, w.id, params);
  }
}

function initCopyButtons() {
  document.querySelectorAll('.mode-copy').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.panel;
      const w = panelState[key];
      if (!w) return;
      copy(
        personalizeWorkflowPrompt(
          w,
          loadParams() || { docRoot: 'docs/architecture/' },
          inputState[key][w.id] || {}
        )
      );
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
    [workflows, adoptBase] = await Promise.all([loadWorkflows(), loadAdoptPrompt()]);
  } catch {
    document.querySelector('.app')?.insertAdjacentHTML(
      'beforeend',
      '<p class="cell-note" style="margin-top:1rem">Load via <code>./scripts/open-assistant.sh</code></p>'
    );
    return;
  }

  initSetupForm(adoptBase);
  initBuildPhase(workflows);
  initModeGrid(workflows, 'evolve', EVOLVE_MODES, 'evolve-grid', 'evolve-panel', 'evolve-label', 'evolve-note');
  initModeGrid(workflows, 'work', WORK_MODES, 'work-grid', 'work-panel', 'work-label', 'work-note');
  initModeGrid(workflows, 'review', REVIEW_MODES, 'review-grid', 'review-panel', 'review-label', null);
  initCopyButtons();
}

main();
