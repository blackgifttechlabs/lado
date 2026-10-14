// csharp.js — C# sandbox exercise environment for LADO
import { createWorkspace, applyTheme } from '../../shared-theme.js?v=20261014-cs-11';
import basics from './topics/cs-basics.js?v=20261014-cs-11';
import core from './topics/cs-core.js?v=20261014-cs-11';
import apps from './topics/cs-apps.js?v=20261014-cs-11';
import './topics/cs-scene.js?v=20261014-cs-11';
import { runCsharp, runCsharpRaw } from './topics/cs-run.js?v=20261014-cs-11';
import { PRACTICE } from './topics/cs-practice.js?v=20261014-cs-11';

// The "Run code" button inside the lesson drawer.
window.__ladoCsConsole = (code) => runCsharp(code);
// The Do it yourself / Debug checker.
window.__ladoCsRun = (code) => runCsharpRaw(code);

const EXERCISES = [...basics, ...core, ...apps];
// Attach the practice challenges to every subtopic that has them.
EXERCISES.forEach((topic) => topic.lesson.subtopics.forEach((subtopic) => {
  const practice = PRACTICE[subtopic.content?.heading];
  if (practice) subtopic.content.practice = practice;
}));

const TREE = EXERCISES.map((topic) => ({
  id: topic.id,
  label: topic.title,
  children: topic.lesson.subtopics.map((subtopic, index) => ({ id: `${topic.id}::${index}`, label: subtopic.title })),
}));

export function initCsharpEnvironment(container, options = {}) {
  if (options.theme) applyTheme(options.theme);

  const runEndpoint = options.runEndpoint || '/api/csharp/run';
  const tutorEndpoint = options.tutorEndpoint || '/api/tutor/ask';

  return createWorkspace(container, {
    id: 'csharp',
    title: 'C#',
    subtitle: 'Sandboxed C# practice environment',
    crumbs: ['Choose what you need to learn today'],
    crumbTitle: true,
    lesson: {
      title: 'Basics',
      description: 'Build a strong C# foundation, from variables through database CRUD.',
    },
    onBack: options.onBack,
    tree: options.tree || TREE,
    exercises: options.exercises || EXERCISES,
    editorTabs: ['Program.cs', 'Solution.cs', 'Tests.cs', 'Output', 'Notes'],
    versions: [
      { value: 'net6.0', label: '.NET 6' },
      { value: 'net8.0', label: '.NET 8' },
      { value: 'net9.0', label: '.NET 9' },
    ],
    greeting: 'Ask me about type parameters, constraints or LINQ in this lesson.',
    placeholder: '// Write your C# here',

    async onRun({ code, exercise, version }) {
      try {
        const response = await fetch(runEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, exerciseId: exercise.id, framework: version }),
        });
        if (!response.ok) throw new Error(`runtime service ${response.status}`);
        const result = await response.json();
        return { output: result.stderr || result.stdout || '(no output)', isError: Boolean(result.stderr) };
      } catch {
        return localCheck(code, exercise, version);
      }
    },

    async onAsk({ code, question, exercise, lastOutput }) {
      try {
        const response = await fetch(tutorEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: 'csharp', code, question, exerciseId: exercise.id, output: lastOutput }),
        });
        if (!response.ok) throw new Error(`tutor service ${response.status}`);
        return (await response.json()).answer;
      } catch {
        return offlineHint(exercise, code);
      }
    },
  });
}

function localCheck(code, exercise, version) {
  if (code.includes('your code here')) {
    return { output: `dotnet run -f ${version}\nerror CS0000: exercise body is still a placeholder`, isError: true };
  }
  const missing = (exercise.expects || []).filter((token) => !code.includes(token));
  if (missing.length) {
    return { output: `dotnet run -f ${version}\nerror CS0000: expected to see ${missing.join(', ')}`, isError: true };
  }
  return { output: `dotnet run -f ${version}\nAll checks passed for "${exercise.title}".`, isOk: true };
}

function offlineHint(exercise, code) {
  const missing = (exercise.expects || []).filter((token) => !code.includes(token));
  return missing.length
    ? `Tutor (offline): "${exercise.title}" expects you to use ${missing.join(', ')}.`
    : `Tutor (offline): looks reasonable — run it to compile against the exercise tests.`;
}

export default initCsharpEnvironment;
