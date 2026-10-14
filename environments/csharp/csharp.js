// csharp.js — C# sandbox exercise environment for LADO
// The same live scenes as the C++ lessons (Blender boxes, loop machines, branching doors), fed with the C# code.
import '../cpp/three/typing-flow.js?v=20261014-cs-18';
import '../cpp/topics/branching-scene.js?v=20261014-cs-18';
import '../cpp/topics/switch-scene.js?v=20261014-cs-18';
import '../cpp/topics/loop-scene.js?v=20261014-cs-18';
import '../cpp/topics/operator-scenes.js?v=20261014-cs-18';
import { csToCpp } from './topics/cs-to-cpp.js?v=20261014-cs-18';
import { createWorkspace, applyTheme } from '../../shared-theme.js?v=20261014-cs-18';
import basics from './topics/cs-basics.js?v=20261014-cs-18';
import core from './topics/cs-core.js?v=20261014-cs-18';
import apps from './topics/cs-apps.js?v=20261014-cs-18';
import './topics/cs-scene.js?v=20261014-cs-18';
import { runCsharp, runCsharpRaw } from './topics/cs-run.js?v=20261014-cs-18';
import { PRACTICE } from './topics/cs-practice.js?v=20261014-cs-18';

window.__ladoCsToCpp = csToCpp;

// The "Run code" button inside the lesson drawer.
window.__ladoCsConsole = (code) => runCsharp(code);
// The Do it yourself / Debug checker.
window.__ladoCsRun = (code) => runCsharpRaw(code);

const EXERCISES = [...basics, ...core, ...apps];
// Which C++ lesson scene each C# topic borrows (topics without a match keep the C# pane).
const VISUAL = {
  'cs-topic-1': 'Declaring and Initializing Variables', 'cs-topic-2': 'Declaring and Initializing Variables', 'cs-topic-3': 'Logical Operators',
  'cs-topic-4': 'Conditional Branching with if, else if, and else', 'cs-topic-5': 'Traditional for Loops', 'cs-topic-6': 'Working with Nested Loops',
  'cs-topic-7': 'Declaring, Initializing, and Indexing Arrays', 'cs-topic-8': 'Working with Multidimensional Arrays', 'cs-topic-9': 'string and Its Member Functions',
  'cs-topic-10': 'Function Declaration, Definition, and Calling', 'cs-topic-11': 'Function Parameters and Return Values', 'cs-topic-12': 'Recursive Functions',
  'cs-topic-13': 'Class Data Members and Methods', 'cs-topic-18': 'Defining and Using struct Types', 'cs-topic-23': 'Class Inheritance', 'cs-topic-24': 'Static Data Members and Methods',
};
EXERCISES.forEach((topic) => topic.lesson.subtopics.forEach((subtopic) => { if (VISUAL[topic.id]) subtopic.visual = VISUAL[topic.id]; }));

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
