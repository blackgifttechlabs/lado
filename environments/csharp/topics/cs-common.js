// Helpers for the C# lessons. A snippet is wrapped in Main(); a program that starts with "using" is used as it is.
const wrap = body => (/^\s*(using|namespace)\b/.test(body) ? body : `using System;\n\nclass Program\n{\n    static void Main()\n    {\n${body.split('\n').map(l => (l ? '        ' + l : l)).join('\n')}\n    }\n}`);
const item = ([name, description, code]) => ({ name, description, full: false, code: wrap(code) });
export const topic = (n, title, icon, prompt, definition, simple, real, snippet, items, tryTitle) => ({
  id: `cs-topic-${n}`, title, prompt,
  lesson: { title, subtopics: [{
    icon, title, lang: 'csharp',
    content: { heading: title, notes: { definition, points: [{ term: 'In simple words', text: simple }, { term: 'Real-life example', text: real }], code: wrap(snippet) }, sectionTitle: 'More parts of this topic', items: items.map(item), tryTitle: tryTitle || 'Change the code and run the program' },
    starter: wrap(snippet),
  }] },
});
