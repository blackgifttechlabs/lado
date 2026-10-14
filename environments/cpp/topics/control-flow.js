const examples = [
  {
    name: 'if — one question',
    description: 'Use if when something should happen only when a condition is true. The age box keeps its value while the guard reads a copy.',
    steps: ['Create age and put 20 inside.', 'The guard checks: is 20 >= 18?', 'True: touch the handle, open the door, enter and print Adult. False: leave the door closed and skip its code.', 'Continue after the if and print Next step.'],
    guided: true,
    code: `int age = 20;
if (age >= 18) {
  cout << "Adult" << endl;
}
cout << "Next step" << endl;`,
  },
  {
    name: 'if / else — choose one of two paths',
    description: 'Add else for the fallback. Exactly one room runs: the if room when the condition is true, or the else room when it is false.',
    steps: ['Create age and put 16 inside.', 'The guard checks: is 16 >= 18? No, so the first door stays closed.', 'The else door has no condition. The guard opens it, enters and prints Minor.', 'Continue after both rooms and print Next step. Try age = 20 to take the other path.'],
    guided: true,
    code: `int age = 16;
if (age >= 18) {
  cout << "Adult" << endl;
} else {
  cout << "Minor" << endl;
}
cout << "Next step" << endl;`,
  },
  {
    name: 'if / else if / else — check in order',
    description: 'Use else if for another question. Check it only if the earlier condition was false. After entering one room, skip every remaining room.',
    steps: ['Create age and put 15 inside.', 'First door: is 15 < 13? No. Keep walking.', 'Second door: is 15 < 18? Yes. Open it, enter and print Teenager. Skip else.', 'If both questions were false, else would print Adult. Try 10, 15 and 20, then check the boundaries 13 and 18.'],
    guided: true,
    code: `int age = 15;
if (age < 13) {
  cout << "Child" << endl;
} else if (age < 18) {
  cout << "Teenager" << endl;
} else {
  cout << "Adult" << endl;
}
cout << "Next step" << endl;`,
  },
];
const switchExamples = [
  {
    name: 'switch — pick one track',
    description: 'Use switch when one value decides between many fixed choices. The switch reads day once and rolls the train down the matching case track. break is the buffer stop that ends the ride.',
    steps: ['Create day and put 3 inside.', 'The switch compares 3 with case 1, then case 2, then case 3. Case 3 matches.', 'The train enters case 3 and prints Wednesday.', 'break stops the train. The yard is left and Next step prints.'],
    guided: true,
    code: `int day = 3;
switch (day) {
  case 1:
    cout << "Monday" << endl;
    break;
  case 2:
    cout << "Tuesday" << endl;
    break;
  case 3:
    cout << "Wednesday" << endl;
    break;
}
cout << "Next step" << endl;`,
  },
  {
    name: 'default — when nothing matches',
    description: 'default is the last-resort track. If no case label equals the value, the switch sends the train there. Try day = 2, then day = 9.',
    steps: ['Create day and put 9 inside.', 'Case 1 and case 2 do not match 9.', 'No case matches, so the switch sends the train down default and prints Unknown day.', 'Continue after the switch and print Next step.'],
    guided: true,
    code: `int day = 9;
switch (day) {
  case 1:
    cout << "Monday" << endl;
    break;
  case 2:
    cout << "Tuesday" << endl;
    break;
  default:
    cout << "Unknown day" << endl;
    break;
}
cout << "Next step" << endl;`,
  },
  {
    name: 'No break — fall-through',
    description: 'Without break the train does not stop. It rolls into the next track and runs that code too, even though the label does not match. This is called fall-through.',
    steps: ['Create day and put 1 inside.', 'Case 1 matches and prints Monday.', 'There is no break, so the train rolls on into case 2 and prints Tuesday, then reaches break.', 'Add break after Monday, or change day to 3, and compare the output.'],
    guided: true,
    code: `int day = 1;
switch (day) {
  case 1:
    cout << "Monday" << endl;
  case 2:
    cout << "Tuesday" << endl;
    break;
  case 3:
    cout << "Wednesday" << endl;
    break;
}
cout << "Next step" << endl;`,
  },
];
const program=code=>`#include <iostream>\n\nusing namespace std;\n\nint main() {\n${code.split('\n').map(line=>'  '+line).join('\n')}\n  return 0;\n}`;
const guided = (name, description, steps, code) => ({ name, description, steps, guided: true, code });
const forExamples = [
  guided('for — count from 1 to 5', 'A for loop packs the three loop parts into one line: where to start, when to keep going, and how to move on. Each trip around is one lap.',
    ['Start: create i and put 1 inside. This happens once.', 'Check i <= 5. If true, run the body; if false, leave the loop.', 'The body prints i. Then the update i++ moves i up by one.', 'Check again with the new i. When i reaches 6 the check is false and Done prints.'],
    `for (int i = 1; i <= 5; i++) {
  cout << i << endl;
}
cout << "Done" << endl;`),
  guided('Count down and step by 3', 'The update does not have to be ++. Any change works, such as i -= 3. The loop still stops the first time the check is false.',
    ['Start with i = 10.', 'Each lap prints i, then subtracts 3: 10, 7, 4, 1.', 'After 1 the update makes i = -2. The check i > 0 is false, so the loop ends.'],
    `for (int i = 10; i > 0; i -= 3) {
  cout << i << endl;
}`),
  guided('Add up a total', 'A variable declared before the loop keeps its value across laps, so the loop can build a running total.',
    ['sum starts at 0 outside the loop.', 'Lap 1 adds 1, lap 2 adds 2, lap 3 adds 3, lap 4 adds 4.', 'After the loop, sum holds 10 and is printed.'],
    `int sum = 0;
for (int i = 1; i <= 4; i++) {
  sum += i;
}
cout << "Sum: " << sum << endl;`),
];
const rangeExamples = [
  guided('Loop over an array', 'A range-based for visits every item for you, with no counter to manage. Read it as: for each n in nums.',
    ['nums holds three items: 2, 4, 6.', 'Lap 1: n takes a copy of 2 and prints it.', 'Lap 2 uses 4, lap 3 uses 6. When items run out, the loop ends.'],
    `int nums[] = {2, 4, 6};
for (int n : nums) {
  cout << n << endl;
}`),
  guided('Loop over the letters of a string', 'A string is a row of characters, so range-based for can walk through its letters one at a time.',
    ['word holds "cat".', 'The loop variable c is a char that takes one letter per lap.', 'It prints c, a, t on separate lines.'],
    `string word = "cat";
for (char c : word) {
  cout << c << endl;
}`),
  guided('Copy vs reference', 'Plain "int n" gives you a copy, so changes disappear. "auto& n" is a reference to the real item, so changes stick.',
    ['The first loop uses auto&, so n is the real item. n *= 2 doubles each item inside nums.', 'The second loop only reads, and prints 2, 4, 6.', 'Remove the & and watch nums stay 1, 2, 3.'],
    `int nums[] = {1, 2, 3};
for (auto& n : nums) {
  n *= 2;
}
for (int n : nums) {
  cout << n << endl;
}`),
];
const whileExamples = [
  guided('while — check first', 'while asks the question before every lap, including the first. If the condition starts false, the body never runs.',
    ['n starts at 3.', 'Check n > 0 → true, print n, then n-- lowers it.', 'The loop prints 3, 2, 1. Then n is 0, the check is false and Liftoff prints.'],
    `int n = 3;
while (n > 0) {
  cout << n << endl;
  n--;
}
cout << "Liftoff" << endl;`),
  guided('do-while — run first', 'do-while runs the body once before it asks the question. It always runs at least once, even when the condition is false from the start.',
    ['n starts at 10.', 'The body runs first and prints n = 10.', 'Only then is n < 5 checked. It is false, so the loop ends after one lap.'],
    `int n = 10;
do {
  cout << "n = " << n << endl;
  n++;
} while (n < 5);`),
  guided('Keep halving', 'A while loop is the right tool when you do not know how many laps you need. Here the loop stops when the value drops below 1.',
    ['x starts at 100.', 'Each lap prints x, then x /= 2 halves it (whole numbers).', 'It prints 100, 50, 25, 12, 6, 3, 1, then x becomes 0 and the loop ends.'],
    `int x = 100;
while (x >= 1) {
  cout << x << endl;
  x /= 2;
}`),
];
const controlExamples = [
  guided('break — leave early', 'break ends the whole loop immediately. Use it when you have found what you were looking for.',
    ['The loop counts i from 1 up to 10.', 'On each lap, if i % 7 == 0 the number is a multiple of 7.', 'At i = 7 the program prints Found 7 and break leaves the loop. Laps 8, 9 and 10 never happen.'],
    `for (int i = 1; i <= 10; i++) {
  if (i % 7 == 0) {
    cout << "Found " << i << endl;
    break;
  }
}`),
  guided('continue — skip one lap', 'continue skips the rest of the current lap and jumps to the next one. The loop keeps going.',
    ['The loop counts i from 1 to 6.', 'When i is even, continue skips the print.', 'Only the odd numbers 1, 3 and 5 are printed.'],
    `for (int i = 1; i <= 6; i++) {
  if (i % 2 == 0) {
    continue;
  }
  cout << i << endl;
}`),
  guided('Use both together', 'Skip some rounds and stop on another. Watch the cart: it takes the side track to skip a round, and leaves through the exit tunnel when break runs.',
    ['Lap 3 is skipped by continue, so 3 is never printed.', 'Laps 1, 2, 4 and 5 print normally.', 'At lap 6, break ends the loop before 6 prints.'],
    `for (int i = 1; i <= 10; i++) {
  if (i == 3) {
    continue;
  }
  if (i == 6) {
    break;
  }
  cout << i << endl;
}`),
];
const nestedExamples = [
  guided('A 3 by 3 grid of stars', 'A loop inside a loop. The inner loop runs completely for every single lap of the outer loop, like rows and columns.',
    ['The outer loop picks a row r.', 'For each row, the inner loop runs c = 1, 2, 3 and prints three stars.', 'endl then moves to the next row. 3 rows × 3 stars = 9 inner laps.'],
    `for (int r = 1; r <= 3; r++) {
  for (int c = 1; c <= 3; c++) {
    cout << "*";
  }
  cout << endl;
}`),
  guided('A times table', 'Both loop counters are available inside the inner body, so each cell can use them in a calculation.',
    ['r is the row and c is the column.', 'Each cell prints r * c followed by a space.', 'Row 2 prints 2 4 6, and row 3 prints 3 6 9.'],
    `for (int r = 1; r <= 3; r++) {
  for (int c = 1; c <= 3; c++) {
    cout << r * c << " ";
  }
  cout << endl;
}`),
  guided('A staircase of stars', 'The inner loop can depend on the outer counter. Here the inner limit is r, so each row gets one more star than the last.',
    ['Row 1 runs the inner loop once, row 2 twice, row 3 three times.', 'The grid fills only the lower-left half.', 'Change c <= r to c <= 3 and compare with the full square.'],
    `for (int r = 1; r <= 3; r++) {
  for (int c = 1; c <= r; c++) {
    cout << "*";
  }
  cout << endl;
}`),
];
const loopLesson = (icon, title, intro, sectionTitle, items, tryTitle) => ({
  icon, title,
  content: { heading: title, intro, sectionTitle, items, tryTitle },
  starter: program(items.at(-1).code),
});
export default { id: 'cpp-topic-3', title: 'Control Flow', image: './environments/cpp/images/control-flow.png', starter: '', expects: [], lesson: { title: 'Control Flow', iconPath: './environments/cpp/images/subtopic-icons/control-flow', subtopics: [
  {
    icon: '🔀', title: 'Conditional Branching with if, else if, and else',
    content: {
      heading: 'Conditional Branching with if, else if, and else',
      intro: 'Start with a box named age. A guard reads its value, checks the doors in order and walks through the selected door. Learn the three forms below, each with its own guided code and animation.',
      sectionTitle: 'Choose an age example',
      items: examples,
      tryTitle: 'Create the age box, then follow the guard',
    },
    starter: program(examples[2].code),
  },
  {
    icon: '🎛️', title: 'Multi-way Branching with switch',
    content: {
      heading: 'Multi-way Branching with switch',
      intro: 'A switch reads one value and sends a train down the matching track. Each case is a track, break is the buffer stop, and default is the last-resort track. Learn the three forms below, each with its own guided code and animation.',
      sectionTitle: 'Choose a day example',
      items: switchExamples,
      tryTitle: 'Create the day box, then follow the train',
    },
    starter: program(switchExamples[2].code),
  },
  loopLesson('🔁', 'Traditional for Loops', 'A for loop repeats code. Its header has three parts: init (start), check (keep going?) and update (move on). Each trip is one lap, replayed step by step in the scene.', 'Choose a for example', forExamples, 'Type the loop and watch each lap'),
  loopLesson('🧭', 'Range-based for Loops', 'When you just want every item, let the loop hand them to you one at a time. No counter, no off-by-one mistakes. Watch the loop variable pick items off the belt.', 'Choose a range-based example', rangeExamples, 'Type the loop and watch the items'),
  loopLesson('♻️', 'while and do-while Loops', 'Use while when you repeat until something changes. while checks before each lap; do-while checks after, so it always runs at least once. Watch the gate decide.', 'Choose a while example', whileExamples, 'Type the loop and watch the gate'),
  loopLesson('⏭️', 'Loop Control with break and continue', 'break leaves the loop; continue skips to the next lap. Each lap shows green when it ran, yellow when it was skipped and red when it ended the loop.', 'Choose a loop-control example', controlExamples, 'Type the loop and watch the laps'),
  loopLesson('🪆', 'Working with Nested Loops', 'A nested loop is a loop inside a loop. The inner loop finishes all its laps for every lap of the outer one. The grid lights up one cell per inner lap.', 'Choose a nested example', nestedExamples, 'Type both loops and watch the grid'),
] } };
