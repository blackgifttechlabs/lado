const guided = (name, description, steps, code) => ({ name, description, steps, guided: true, code });
const program = code => `#include <iostream>\n#include <string>\n#include <array>\n\nusing namespace std;\n\nint main() {\n${code.split('\n').map(line => '  ' + line).join('\n')}\n  return 0;\n}`;
const lesson = (icon, title, notes, sectionTitle, items, tryTitle) => ({
  icon, title,
  content: { heading: title, notes, sectionTitle, items, tryTitle },
  starter: program(items.at(-1).code),
});

const arrayItems = [
  guided('Make an array and read one item', 'An array is a row of lockers. Each locker holds one value and has a number on its door. The numbers start at 0, not 1.',
    ['Make 5 lockers named scores. Each one gets a value.', 'scores[2] means locker number 2. That is the third locker, because we start counting at 0.', 'The locker door opens and 30 comes out. It is printed on the ticket.'],
    `int scores[5] = {10, 20, 30, 40, 50};
cout << scores[2] << endl;`),
  guided('Change one item', 'You can put a new value in a locker. The old value is thrown out and the new one goes in.',
    ['Make 3 lockers: 10, 20, 30.', 'scores[1] = 99 opens locker 1, throws out the 20 and puts 99 in.', 'Reading locker 1 again now gives 99.'],
    `int scores[3] = {10, 20, 30};
scores[1] = 99;
cout << scores[1] << endl;`),
  guided('Going past the last locker', 'An array with 5 lockers has numbers 0, 1, 2, 3, 4. There is no locker 5. Asking for it is a bug. This mistake is called off-by-one.',
    ['Make 5 lockers. The last one is number 4.', 'scores[5] asks for a locker that does not exist. The alarm rings and a red outline shows where it would be.', 'Change the 5 to a 4 and the program works again.'],
    `int scores[5] = {10, 20, 30, 40, 50};
cout << scores[5] << endl;`),
];
const gridItems = [
  guided('Read one cell of a grid', 'A 2D array is an apartment block. The first number is the floor (row). The second number is the door on that floor (column).',
    ['grid[2][3] is a block with 2 floors and 3 doors on each floor.', 'grid[1][2] means floor 1, door 2. Floors and doors also start at 0.', 'The door opens and 6 comes out.'],
    `int grid[2][3] = {{1, 2, 3}, {4, 5, 6}};
cout << grid[1][2] << endl;`),
  guided('Change one cell', 'You change a cell the same way as a locker. Say the floor, say the door, then give the new value.',
    ['Floor 0 has 1, 2, 3.', 'grid[0][1] = 9 goes to floor 0, door 1 and swaps the 2 for a 9.', 'Floor 0 is now 1, 9, 3.'],
    `int grid[2][3] = {{1, 2, 3}, {4, 5, 6}};
grid[0][1] = 9;
cout << grid[0][1] << endl;`),
  guided('Add up every cell', 'Two loops walk the whole block: the outer loop picks the floor, the inner loop visits every door on that floor.',
    ['total starts at 0 in the box on the left.', 'For each floor r and each door c, the value is added to total.', 'After all 6 doors, total is 21.'],
    `int grid[2][3] = {{1, 2, 3}, {4, 5, 6}};
int total = 0;
for (int r = 0; r < 2; r++) {
  for (int c = 0; c < 3; c++) {
    total += grid[r][c];
  }
}
cout << total << endl;`),
];
const stdArrayItems = [
  guided('An array that knows its size', 'std::array is a row of lockers with a size plate on it. You can always ask it how many lockers it has.',
    ['array<int, 4> makes 4 lockers that hold int values.', 'a.size() sends a measuring tape along the row.', 'The answer is 4.'],
    `array<int, 4> a = {5, 6, 7, 8};
cout << a.size() << endl;`),
  guided('Read safely with at()', 'a.at(2) does the same as a[2], but it sends an inspector first. The inspector checks the number is real before opening the locker.',
    ['The inspector arch scans index 2. It is valid, so the arch turns green.', 'Locker 2 opens and 7 comes out.', 'Use at() when you are not sure about the number.'],
    `array<int, 4> a = {5, 6, 7, 8};
cout << a.at(2) << endl;`),
  guided('at() stops a bad number', 'With at(), a bad index is caught. The inspector arch turns red and the program stops with an error. A plain [ ] would just misbehave quietly.',
    ['The array has lockers 0 to 3.', 'a.at(10) asks for locker 10. The inspector arch turns red.', 'The program stops with an out_of_range error. Nothing is opened.'],
    `array<int, 4> a = {5, 6, 7, 8};
cout << a.at(10) << endl;`),
];
const cstringItems = [
  guided('A word is a row of letter tiles', 'A C-style string is an array of chars. Every letter gets its own tile. The last tile is a special orange tile called the end mark.',
    ['"Hi" has 2 letters, so we need 3 tiles.', 'The third tile holds \\0. It tells the computer where the word stops.', 'cout reads tile by tile and stops at the end mark.'],
    `char word[] = "Hi";
cout << word << endl;`),
  guided('Change one letter', 'Each tile can be swapped. Give the tile number and a new letter in single quotes.',
    ['"cat" has tiles c, a, t and the end mark.', 'word[0] = \'b\' swaps the c for a b.', 'Now the word reads bat.'],
    `char word[] = "cat";
word[0] = 'b';
cout << word << endl;`),
  guided('No room for the end mark', 'The array must have one extra tile for the end mark. If you make it too small, the code does not work.',
    ['"Hi" needs 3 tiles: H, i and the end mark.', 'char word[2] only has 2 tiles.', 'Change the 2 to a 3 to fix it.'],
    `char word[2] = "Hi";
cout << word << endl;`),
];
const stringItems = [
  guided('How long is the string?', 'A string is a ribbon of letter tiles that can grow and shrink. length() measures it.',
    ['"Hello" is 5 tiles on the ribbon.', 's.length() unrolls a measuring tape along the tiles.', 'The tape stops at 5.'],
    `string s = "Hello";
cout << s.length() << endl;`),
  guided('Add letters to the end', 'append() or += adds new tiles to the end. The ribbon gets longer.',
    ['Start with "Hello".', 's.append(" World") slides 6 new tiles in at the end.', 's += "!" adds one more tile. The ribbon now reads Hello World!'],
    `string s = "Hello";
s.append(" World");
s += "!";
cout << s << endl;`),
  guided('Copy part of a string', 'substr(start, count) copies some tiles. The original string is not changed.',
    ['"Hello World" has 11 tiles.', 's.substr(0, 5) lights up the first 5 tiles: H e l l o.', 'A copy of those 5 tiles is printed.'],
    `string s = "Hello World";
cout << s.substr(0, 5) << endl;`),
];
const toolItems = [
  guided('Find a word', 'find() is a magnifying glass. It slides along the tiles and tells you where the word starts. If it cannot find the word, it says npos.',
    ['The magnifier slides along "cat and hat".', 'It finds "hat" starting at tile 8 and lights it green.', 'p holds 8 and it is printed.'],
    `string s = "cat and hat";
int p = s.find("hat");
cout << p << endl;`),
  guided('Cut out and put in', 'erase() cuts tiles out with scissors. insert() pushes the other tiles apart and drops new ones in.',
    ['"I like tea" has "tea" at tiles 7 to 9.', 'erase(7, 3) snips those 3 tiles out. They fall off the ribbon.', 'insert(7, "milk") opens a gap and drops 4 new tiles in. The string is now "I like milk".'],
    `string s = "I like tea";
s.erase(7, 3);
s.insert(7, "milk");
cout << s << endl;`),
  guided('Swap a part and check', 'replace() is a stamp. It presses new letters over old ones. find() gives npos when something is not there.',
    ['"red car": replace(0, 3, "blue") stamps "blue" over "red".', 'The string is now "blue car".', 'find("bike") finds nothing, so it gives npos and we print "no bike".'],
    `string s = "red car";
s.replace(0, 3, "blue");
cout << s << endl;
if (s.find("bike") == string::npos) {
  cout << "no bike" << endl;
}`),
];
const iterateItems = [
  guided('Visit every locker and add up', 'A loop with a counter i can visit locker 0, then 1, then 2. A pointer arrow shows which one you are on.',
    ['sum starts at 0.', 'Each round the arrow moves to locker i. The door opens and its value is added to sum.', 'The values 3, 1 and 4 give a sum of 8.'],
    `int nums[3] = {3, 1, 4};
int sum = 0;
for (int i = 0; i < 3; i++) {
  sum += nums[i];
}
cout << sum << endl;`),
  guided('Visit every letter', 'A range-based for hands you one tile at a time. You do not need a counter.',
    ['word holds the tiles h, e, y.', 'The arrow moves tile by tile. c takes a copy of each letter.', 'Each letter is printed.'],
    `string word = "hey";
for (char c : word) {
  cout << c << endl;
}`),
  guided('The off-by-one bug in a loop', 'This is the most common loop bug. The loop counts one step too far and reaches a locker that does not exist.',
    ['The array has lockers 0, 1 and 2.', 'i <= 3 lets i become 3. Locker 3 does not exist, so the alarm rings.', 'Change <= to < and the loop stops at locker 2.'],
    `int nums[3] = {1, 2, 3};
for (int i = 0; i <= 3; i++) {
  cout << nums[i] << endl;
}`),
];

export default { id: 'cpp-topic-4', title: 'Arrays & Strings', image: './environments/cpp/images/arrays-strings.png', starter: '', expects: [], lesson: { title: 'Arrays & Strings', iconPath: './environments/cpp/images/subtopic-icons/arrays-strings', subtopics: [
  lesson('🗃️', 'Declaring, Initializing, and Indexing Arrays', {
    definition: 'An **array** is a row of boxes that all hold the same kind of value. Each box has a number called an **index**. The first box is index **0**.',
    points: [
      { term: 'In simple words', text: 'Think of a row of lockers. Each locker holds one value and has a number on its door. You open a locker by its number.' },
      { term: 'Real-life example', text: 'A school has lockers numbered 0 to 4. To get Tom\'s book you go to his locker number, not to every locker.' },
      { term: 'Careful', text: 'With 5 lockers the last number is 4, not 5. Asking for a locker that is not there is a bug.' },
    ],
    code: 'int scores[5] = {10, 20, 30, 40, 50};\ncout << scores[0] << endl;   // first item\ncout << scores[4] << endl;   // last item',
  }, 'More parts of this topic', arrayItems, 'Type the lockers and watch them open'),
  lesson('🧊', 'Working with Multidimensional Arrays', {
    definition: 'A **multidimensional array** is an array of arrays. A 2D array has **rows** and **columns**, like a table.',
    points: [
      { term: 'In simple words', text: 'Picture an apartment block. The first number is the floor. The second number is the door on that floor.' },
      { term: 'Real-life example', text: 'A cinema seat is found by two numbers: the row and the seat in that row.' },
      { term: 'Remember', text: 'Both numbers start at 0. A block with 2 floors and 3 doors uses floors 0 to 1 and doors 0 to 2.' },
    ],
    code: 'int grid[2][3] = {{1, 2, 3}, {4, 5, 6}};\ncout << grid[0][2] << endl;   // 3\ncout << grid[1][0] << endl;   // 4',
  }, 'More parts of this topic', gridItems, 'Type the block and watch the doors open'),
  lesson('📦', 'Fixed-size Containers with array', {
    definition: '**std::array** is a fixed-size array that knows its own **size**. Its **at()** function checks the index before it opens a box.',
    points: [
      { term: 'In simple words', text: 'It is the same row of lockers, but with a size plate. You can ask it how many lockers it has, and it can check a number before opening.' },
      { term: 'Real-life example', text: 'A hotel with a front desk. The desk knows how many rooms there are and will tell you if room 99 does not exist.' },
      { term: 'Good to know', text: 'Use at() when you are not sure the index is valid. A bad index stops the program with a clear error.' },
    ],
    code: 'array<int, 4> a = {5, 6, 7, 8};\ncout << a.size() << endl;\ncout << a.at(1) << endl;',
  }, 'More parts of this topic', stdArrayItems, 'Type the array and watch the inspector'),
  lesson('🔤', 'Character Arrays and C-style Strings', {
    definition: 'A **C-style string** is an array of **char** that ends with a special end mark, **\\0** (the null character).',
    points: [
      { term: 'In simple words', text: 'A word is a row of letter tiles. After the last letter comes one more tile, the end mark. It tells the computer where the word stops.' },
      { term: 'Real-life example', text: 'A train with a red last carriage. When the driver sees the red carriage he knows the train has ended.' },
      { term: 'Careful', text: 'Always make room for the end mark. A 2-letter word needs 3 tiles.' },
    ],
    code: 'char word[] = "Hi";\ncout << word << endl;\nword[0] = \'J\';\ncout << word << endl;',
  }, 'More parts of this topic', cstringItems, 'Type the word and watch the tiles'),
  lesson('💬', 'string and Its Member Functions', {
    definition: 'A **string** holds text and can grow or shrink. It comes with ready-made tools called **member functions**, such as **length()**, **append()** and **substr()**.',
    points: [
      { term: 'In simple words', text: 'A string is a stretchy ribbon of letter tiles. You do not worry about the end mark or the size. The tools do the work for you.' },
      { term: 'Real-life example', text: 'A text message. You can add words to it, count its letters, or copy part of it.' },
      { term: 'Remember', text: 'Letters are counted from 0, just like lockers in an array.' },
    ],
    code: 'string s = "Hello";\ncout << s.length() << endl;   // 5\ns += " there";\ncout << s << endl;',
  }, 'More parts of this topic', stringItems, 'Type the string and watch the ribbon'),
  lesson('🔎', 'String Manipulation and Searching', {
    definition: 'String tools like **find()**, **erase()**, **insert()** and **replace()** search for text and change a string. When **find()** finds nothing it gives **npos**.',
    points: [
      { term: 'In simple words', text: 'find is a magnifying glass, erase is scissors, insert pushes tiles apart to make room, and replace is a stamp.' },
      { term: 'Real-life example', text: 'Editing a sentence on paper: you look for a word, cut it out, and write a new one in its place.' },
      { term: 'Careful', text: 'Always check for npos before you use the result of find().' },
    ],
    code: 'string s = "cat and hat";\nint p = s.find("hat");   // 8\ns.replace(p, 3, "dog");\ncout << s << endl;',
  }, 'More parts of this topic', toolItems, 'Type the edits and watch the tools'),
  lesson('🚶', 'Iterating over Arrays and Strings', {
    definition: '**Iterating** means visiting every item one by one, usually with a **loop**. The loop counter says which item you are on.',
    points: [
      { term: 'In simple words', text: 'A pointer arrow walks along the row. At each box it stops, looks at the value, and does some work with it.' },
      { term: 'Real-life example', text: 'A teacher walking along a row of desks, checking each child\'s homework one by one.' },
      { term: 'Careful', text: 'Stop at the last box. Going one step too far is the off-by-one bug.' },
    ],
    code: 'int nums[3] = {3, 1, 4};\nfor (int i = 0; i < 3; i++) {\n  cout << nums[i] << endl;\n}',
  }, 'More parts of this topic', iterateItems, 'Type the loop and watch the arrow'),
] } };
