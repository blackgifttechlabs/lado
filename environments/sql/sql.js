// sql.js — SQL learning environment for LADO: the same lesson flow as C++, with its own 3D database scenes.
import { createWorkspace, applyTheme, escapeHtml } from '../../shared-theme.js?v=20261014-cs-18';
import './topics/sql-scene.js?v=20261014-cs-18';
import tablesData from './topics/tables-data.js?v=20261014-cs-18';
import readingData from './topics/reading-data.js?v=20261014-cs-18';
import summaries from './topics/summaries.js?v=20261014-cs-18';
import joins from './topics/joins.js?v=20261014-cs-18';
import { PRACTICE as PRACTICE1 } from './topics/sql-practice.js?v=20261014-cs-18';
import { PRACTICE2 } from './topics/sql-practice-2.js?v=20261014-cs-18';
const PRACTICE = { ...PRACTICE1, ...PRACTICE2 };
import { sqlModel, assemble, renderResult } from './topics/sql-model.js?v=20261014-cs-18';

// The Do it yourself / Debug checker (in shared-theme.js) runs the learner's SQL through this engine.
window.__ladoSqlRun = (code, challenge) => {
  const setup = document.querySelector('.cpp-lab[data-lang="sql"]')?.dataset.sqlSetup ?? challenge?.setup ?? '';
  const r = sqlModel(assemble(setup, code), { check: challenge?.check });
  return { error: r.error, hint: r.hint, incomplete: r.incomplete, output: r.output, stopped: false };
};
// The "Run code" button inside the lesson drawer.
window.__ladoSqlConsole = (code) => {
  const setup = document.querySelector('.cpp-lab[data-lang="sql"]')?.dataset.sqlSetup || '';
  const r = sqlModel(assemble(setup, code));
  const out = r.frames.slice(1).map((f) => (f.screen.type === 'rows' ? renderResult(f.screen) : f.screen.type === 'error' ? '' : `✔ ${f.screen.text}`)).filter(Boolean);
  if (r.error) out.push(`error: ${r.error}${r.hint ? `\n${r.hint}` : ''}`);
  return out.join('\n\n') || 'Nothing has run yet.';
};

const EXERCISES = [tablesData, readingData, summaries, joins];

// Attach the practice challenges to every subtopic that has them.
EXERCISES.forEach((topic) => topic.lesson.subtopics.forEach((subtopic) => {
  subtopic.lang = 'sql';
  const practice = PRACTICE[subtopic.content?.heading];
  if (practice) subtopic.content.practice = practice;
}));

const TREE = EXERCISES.map((topic) => ({
  id: topic.id,
  label: topic.title,
  children: topic.lesson.subtopics.map((subtopic, index) => ({ id: `${topic.id}::${index}`, label: subtopic.title })),
}));

export function initSqlEnvironment(container, options = {}) {
  if (options.theme) applyTheme(options.theme);

  return createWorkspace(container, {
    id: 'sql',
    title: 'SQL',
    subtitle: 'Learn databases by building them',
    crumbs: ['Choose what you need to learn today'],
    crumbTitle: true,
    lesson: {
      title: 'Databases',
      description: 'Build tables, fill them, change them and ask them questions.',
    },
    onBack: options.onBack,
    tree: options.tree || TREE,
    exercises: options.exercises || EXERCISES,
    editorTabs: ['query.sql', 'Results', 'Notes'],
    versions: [{ value: 'sqlite', label: 'SQLite style' }],
    greeting: 'Stuck on a query? Ask me why it returns nothing, or why SQL shows an error.',
    placeholder: '-- Write your SQL here',

    async onRun({ code }) {
      const r = sqlModel(code);
      if (r.error) return { output: `error: ${r.error}${r.hint ? `\n${r.hint}` : ''}`, isError: true };
      const last = [...r.frames].reverse().find((f) => f.screen?.type === 'rows');
      if (!last) return { output: r.frames.at(-1)?.screen?.text || 'Done.', isOk: true };
      return { html: renderTable(last.screen.columns, last.screen.rows), output: '' };
    },

    async onAsk({ code, exercise }) {
      const r = sqlModel(code);
      if (r.error) return `Tutor (offline): SQL says "${r.error}". ${r.hint || ''}`.trim();
      return `Tutor (offline): the SQL for "${exercise.title}" runs without an error. Check that it shows what the task asks for.`;
    },
  });
}

function renderTable(columns, rows) {
  const cell = (v) => escapeHtml(v === null || v === undefined ? 'NULL' : v);
  return `<table class="lado-table">
    <thead><tr>${columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((row) => `<tr>${row.map((v) => `<td>${cell(v)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>`;
}

export default initSqlEnvironment;
