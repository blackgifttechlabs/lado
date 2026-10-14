import "./three/typing-flow.js?v=20261014-cs-18";
import "./topics/branching-scene.js?v=20261014-cs-18";
import "./topics/switch-scene.js?v=20261014-cs-18";
import "./topics/loop-scene.js?v=20261014-cs-18";
import "./topics/operator-scenes.js?v=20261014-cs-18";
// cpp.js — C++ sandbox exercise environment for LADO
import { createWorkspace, applyTheme } from "../../shared-theme.js?v=20261014-cs-18";
import variablesTypes from "./topics/variables-types.js?v=20261014-cs-18";
import operators from "./topics/operators.js?v=20261014-cs-18";
import controlFlow from "./topics/control-flow.js?v=20261014-cs-18";
import arraysStrings from "./topics/arrays-strings.js?v=20261014-cs-18";
import functions from "./topics/functions.js?v=20261014-cs-18";
import structures from "./topics/structures.js?v=20261014-cs-18";
import classes from "./topics/classes.js?v=20261014-cs-18";
import files from "./topics/files.js?v=20261014-cs-18";
import { NOTES } from "./topics/notes.js?v=20261014-cs-18";
import { PRACTICE } from "./topics/practice.js?v=20261014-cs-18";
import { loopModel } from "./topics/loop-model.js?v=20261014-cs-18";

// The Do it yourself / Debug checker (in shared-theme.js) runs the student's program through this interpreter.
window.__ladoCppRun = (code) => loopModel(code);

const EXERCISES = [
  variablesTypes,
  operators,
  controlFlow,
  arraysStrings,
  functions,
  structures,
  classes,
  files,
];

// Attach the simple-English notes (what it is, definition, example, code) to every subtopic that has one.
EXERCISES.forEach((topic) => topic.lesson.subtopics.forEach((subtopic) => {
  const notes = NOTES[subtopic.content?.heading];
  if (notes) subtopic.content.notes = notes;
  const practice = PRACTICE[subtopic.content?.heading];
  if (practice) subtopic.content.practice = practice;
}));

const TOPIC_ICONS = {
  "cpp-topic-1": "./environments/cpp/images/topic-icons/variables-types.png",
  "cpp-topic-2": "./environments/cpp/images/topic-icons/operators.png",
  "cpp-topic-3": "./environments/cpp/images/topic-icons/control-flow.png",
  "cpp-topic-4": "./environments/cpp/images/topic-icons/arrays-strings.png",
  "cpp-topic-5": "./environments/cpp/images/topic-icons/functions.png",
  "cpp-topic-6": "./environments/cpp/images/topic-icons/structures.png",
  "cpp-topic-7": "./environments/cpp/images/topic-icons/classes.png",
  "cpp-topic-8": "./environments/cpp/images/topic-icons/files.png",
};

const TREE = EXERCISES.map((topic) => ({
  id: topic.id,
  label: topic.title,
  icon: TOPIC_ICONS[topic.id],
  children: topic.lesson.subtopics.map((subtopic, index) => ({
    id: `${topic.id}::${index}`,
    label: subtopic.title,
  })),
}));

export function initCppEnvironment(container, options = {}) {
  if (options.theme) applyTheme(options.theme);

  const runEndpoint = options.runEndpoint || '/api/cpp/run';
  const tutorEndpoint = options.tutorEndpoint || '/api/tutor/ask';

  return createWorkspace(container, {
    id: 'cpp',
    title: 'C++',
    subtitle: 'Sandboxed C++ practice environment',
    crumbs: ['Choose what you need to learn today'],
    crumbTitle: true,
    lesson: {
      title: 'Basics',
      description: 'Build a strong C++ foundation, from variables through file handling.',
    },
    onBack: options.onBack,
    tree: options.tree || TREE,
    exercises: options.exercises || EXERCISES,
    editorTabs: ['main.cpp', 'solution.cpp', 'tests.cpp', 'Output', 'Notes'],
    versions: [
      { value: 'c++17', label: 'C++17' },
      { value: 'c++20', label: 'C++20' },
      { value: 'c++23', label: 'C++23' },
    ],
    greeting: 'Stuck on a template? Ask me why the compiler rejects your code.',
    placeholder: '// Write your C++ here',

    async onRun({ code, exercise, version }) {
      try {
        const response = await fetch(runEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, exerciseId: exercise.id, standard: version }),
        });
        if (!response.ok) throw new Error(`compiler service ${response.status}`);
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
          body: JSON.stringify({ language: 'cpp', code, question, exerciseId: exercise.id, output: lastOutput }),
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
  if (code.includes('// your code here')) {
    return { output: `g++ -std=${version} main.cpp\nmain.cpp: error: exercise body is still a placeholder`, isError: true };
  }
  const missing = (exercise.expects || []).filter((token) => !code.includes(token));
  if (missing.length) {
    return { output: `g++ -std=${version} main.cpp\nmain.cpp: error: expected to see ${missing.join(', ')}`, isError: true };
  }
  return { output: `g++ -std=${version} main.cpp && ./a.out\nAll checks passed for "${exercise.title}".`, isOk: true };
}

function offlineHint(exercise, code) {
  const missing = (exercise.expects || []).filter((token) => !code.includes(token));
  return missing.length
    ? `Tutor (offline): your solution for "${exercise.title}" does not use ${missing.join(', ')} yet — that is what this exercise is practising.`
    : `Tutor (offline): the shape of your solution for "${exercise.title}" looks right. Run it to compile.`;
}

export default initCppEnvironment;

/* cpp-flush-guided */
(function () {
  const root = document.documentElement;
  let until = 0;
  function sync() {
    const h = document.querySelector('.lado-ws-header');
    const s = document.querySelector('.lado-ws-sidebar');
    if (h) root.style.setProperty('--cpp-drawer-top', Math.round(h.getBoundingClientRect().bottom) + 'px');
    if (s) root.style.setProperty('--cpp-drawer-left', Math.round(s.getBoundingClientRect().right) + 'px');
  }
  function loop() { sync(); if (performance.now() < until) requestAnimationFrame(loop); }
  function kick(ms) { until = performance.now() + ms; requestAnimationFrame(loop); }
  window.addEventListener('resize', () => kick(150));
  document.addEventListener('click', () => kick(1000), true);
  new MutationObserver(() => kick(1000)).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  kick(1000);
})();
