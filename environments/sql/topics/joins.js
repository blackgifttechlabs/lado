import { guided, warn, lesson, OWNERS } from './sql-common.js?v=20261015-m-1';

// Topic 4: two tables that belong together.
const keyItems = [
  guided('A key that points to another table', 'owner_id in the dogs table holds an id from the owners table. It is a link, called a foreign key. The purple tag shows where it points.',
    ['REFERENCES owners(id) says: this column points to owners.id.', 'The new cats table appears beside the owners table.', 'Its owner_id heading carries the purple link tag.'],
    `CREATE TABLE cats (
  id INTEGER PRIMARY KEY,
  name TEXT,
  owner_id INTEGER REFERENCES owners(id)
);`, OWNERS),
  guided('Add a row that uses the link', 'A dog with owner_id 2 belongs to the owner whose id is 2: Lee. The number is the link.',
    ['We add a dog called Max.', 'Its owner_id is 2.', 'That points to Lee in the owners table.'],
    `INSERT INTO dogs (name, owner_id)
VALUES ('Max', 2);`, OWNERS),
  guided('Follow the link by hand', 'Without a join you can follow a link yourself: ask the dogs table for owner_id 1. Then you must look up who owner 1 is.',
    ['owner_id = 1 matches two dogs.', 'The number 1 is Sam in the owners table.', 'A JOIN does this lookup for you.'],
    `SELECT name FROM dogs
WHERE owner_id = 1;`, OWNERS),
];
const innerItems = [
  guided('Match the keys', 'INNER JOIN glues two tables together. ON says which columns must match. Matching rows are linked by lines and become one row.',
    ['Both tables are named: owners and dogs.', 'ON dogs.owner_id = owners.id links the matching rows.', 'Each linked pair becomes one row of the answer.'],
    `SELECT owners.name AS owner, dogs.name AS dog
FROM owners
INNER JOIN dogs ON dogs.owner_id = owners.id;`, OWNERS),
  guided('Short names for tables', 'A table can have a short nickname right after its name. It makes long questions easier to read.',
    ['owners AS o gives owners the nickname o.', 'dogs AS d gives dogs the nickname d.', 'Now o.name and d.name tell the two name columns apart.'],
    `SELECT o.name AS owner, d.name AS dog
FROM owners AS o
INNER JOIN dogs AS d ON d.owner_id = o.id;`, OWNERS),
  guided('Join, then filter', 'WHERE works on the joined rows. Here we only keep Sam\'s dogs.',
    ['The tables are joined first.', 'WHERE o.name = \'Sam\' keeps two rows.', 'Rex and Bo go to the screen.'],
    `SELECT d.name AS dog
FROM owners AS o
INNER JOIN dogs AS d ON d.owner_id = o.id
WHERE o.name = 'Sam';`, OWNERS),
];
const leftItems = [
  guided('Keep every owner', 'LEFT JOIN keeps every row of the left table, even when nothing matches. The missing side becomes NULL.',
    ['owners is the left table.', 'Zed has no dog, so no line reaches him.', 'Zed is still in the answer, with NULL for the dog.'],
    `SELECT o.name AS owner, d.name AS dog
FROM owners AS o
LEFT JOIN dogs AS d ON d.owner_id = o.id;`, OWNERS),
  guided('Count with a LEFT JOIN', 'Combine LEFT JOIN with GROUP BY to count. Owners with no dogs get 0.',
    ['COUNT(d.id) counts only real dogs.', 'Zed has no dog, so his count is 0.', 'An INNER JOIN would have left Zed out.'],
    `SELECT o.name AS owner, COUNT(d.id) AS dogs
FROM owners AS o
LEFT JOIN dogs AS d ON d.owner_id = o.id
GROUP BY o.name;`, OWNERS),
  guided('Find the ones with nothing', 'After a LEFT JOIN, rows with nothing on the right have NULL there. IS NULL finds them.',
    ['Run the LEFT JOIN.', 'WHERE d.id IS NULL keeps the owners with no dog.', 'Only Zed is left.'],
    `SELECT o.name AS owner
FROM owners AS o
LEFT JOIN dogs AS d ON d.owner_id = o.id
WHERE d.id IS NULL;`, OWNERS),
];

export default { id: 'sql-topic-4', title: 'Joins', image: './environments/sql/images/joins.png', prompt: 'Bring two tables together into one answer.', lesson: { title: 'Joins', subtopics: [
  lesson('🔗', 'Keys: Linking Tables Together', {
    definition: 'A **primary key** is a column that is different in every row. A **foreign key** is a column that holds the primary key of a row in **another table**.',
    points: [
      { term: 'In simple words', text: 'Instead of writing an owner\'s name again and again, store the owner once and point to them with a number.' },
      { term: 'Real-life example', text: 'A library card number. The loan list shows only the number, and the member list tells you who it is.' },
      { term: 'Good to know', text: 'REFERENCES owners(id) tells SQL that a column points to owners.id.' },
    ],
    code: 'CREATE TABLE dogs (\n  id INTEGER PRIMARY KEY,\n  name TEXT,\n  owner_id INTEGER REFERENCES owners(id)\n);',
  }, keyItems, 'Type the command and watch the link appear'),
  lesson('🤝', 'INNER JOIN', {
    definition: '**INNER JOIN** combines rows from two tables when the **ON** rule is true. Rows with no match are left out.',
    points: [
      { term: 'In simple words', text: 'SQL lines up the two tables, draws a line between the rows that match, and makes one wide row from each pair.' },
      { term: 'Real-life example', text: 'Matching each child with their own parent by looking at a family number.' },
      { term: 'Careful', text: 'If both tables have a column with the same name, write the table name first: owners.name.' },
    ],
    code: 'SELECT owners.name AS owner, dogs.name AS dog\nFROM owners\nINNER JOIN dogs ON dogs.owner_id = owners.id;',
  }, innerItems, 'Type the question and watch the lines connect'),
  lesson('🫶', 'LEFT JOIN', {
    definition: '**LEFT JOIN** keeps **every** row of the left table. When nothing matches on the right, the right side is **NULL**.',
    points: [
      { term: 'In simple words', text: 'Like INNER JOIN, but nobody on the left is forgotten. If they have no partner, they get an empty cell.' },
      { term: 'Real-life example', text: 'A class list that shows every child, and shows an empty box next to those who handed in no homework.' },
      { term: 'Good to know', text: 'Use IS NULL to find the rows that had no match.' },
    ],
    code: 'SELECT o.name AS owner, d.name AS dog\nFROM owners AS o\nLEFT JOIN dogs AS d ON d.owner_id = o.id;',
  }, leftItems, 'Type the question and watch nobody get left out'),
] } };
