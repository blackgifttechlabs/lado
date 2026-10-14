import { guided, warn, lesson, PETS, SHOP, CLASS } from './sql-common.js?v=20261014-cs-11';

// Topic 2: asking a table questions with SELECT.
const allItems = [
  guided('Look at the whole table', 'SELECT * means "every column". FROM says which table. A robot walks to the table and copies all of it onto the screen.',
    ['* means all the columns.', 'FROM pets names the table to read.', 'The whole table is copied and sent to the screen. The original stays where it is.'],
    `SELECT * FROM pets;`, PETS),
  guided('Another table', 'SELECT works the same on any table. Only the table name changes.',
    ['The products table has five columns.', 'SELECT * brings back every row and every column.', 'The screen shows the same grid you see on the desk.'],
    `SELECT * FROM products;`, SHOP),
  warn('A table that is not there', 'If you spell the table name wrong, SQL cannot find it. It tells you which tables do exist.',
    ['We wrote pet, but the table is called pets.', 'The robot searches and finds nothing.', 'SQL says: no such table. Check the spelling.'],
    `SELECT * FROM pet;`, PETS),
];
const colsItems = [
  guided('Pick some columns', 'Instead of *, list the columns you want, separated by commas. The robot takes only those columns.',
    ['name and age are the columns we want.', 'A beam highlights those two columns.', 'Only they are copied to the screen. The others stay behind.'],
    `SELECT name, age FROM pets;`, PETS),
  guided('Just one column', 'You can pick a single column. The screen then shows a list of one kind of thing.',
    ['name is the only column we want.', 'Its cells are copied one after another.', 'The screen shows a list of product names.'],
    `SELECT name FROM products;`, SHOP),
  warn('A column that is not there', 'A column name must match exactly. If it does not exist, SQL lists the real columns for you.',
    ['We wrote nam instead of name.', 'The robot cannot find a column with that name.', 'SQL says: no such column, and shows the columns that do exist.'],
    `SELECT nam FROM pets;`, PETS),
];
const whereItems = [
  guided('Only the dogs', 'WHERE keeps only the rows that match. The robot checks every row, one by one, and takes only the matching ones.',
    ['kind = \'dog\' is the rule.', 'A bar scans the rows. Matches get a tick, the others a cross.', 'Only the dog rows are copied to the screen.'],
    `SELECT name, age FROM pets
WHERE kind = 'dog';`, PETS),
  guided('Numbers need no quotes', 'Comparing numbers uses > (bigger), < (smaller), >= , <= , = and <> (not equal). Numbers do not need quotes.',
    ['price > 10 is the rule.', 'Three products cost more than 10.', 'Only those rows go to the screen.'],
    `SELECT name, price FROM products
WHERE price > 10;`, SHOP),
  warn('Forgetting the quotes', 'Text values need single quotes. Without them SQL thinks dog is the name of a column.',
    ['We wrote dog without quotes.', 'SQL looks for a column called dog.', 'It finds none and tells you to put quotes around text.'],
    `SELECT name FROM pets
WHERE kind = dog;`, PETS),
];
const logicItems = [
  guided('AND: both must be true', 'AND keeps a row only when both rules are true.',
    ['The animal must be a dog.', 'And it must be older than 2.', 'Only Rex passes both rules.'],
    `SELECT name, kind, age FROM pets
WHERE kind = 'dog' AND age > 2;`, PETS),
  guided('OR: one is enough', 'OR keeps a row when at least one rule is true.',
    ['The animal can be a cat.', 'Or it can be a bird.', 'Tom and Bo pass.'],
    `SELECT name, kind FROM pets
WHERE kind = 'cat' OR kind = 'bird';`, PETS),
  warn('Brackets decide the order', 'AND is worked out before OR. Use brackets to say what you really mean.',
    ['Without brackets, AND happens first.', 'So this means: a dog, or (a cat that is older than 4).', 'Rex, Ann and Tom come back. Brackets would change the answer.'],
    `SELECT name, kind, age FROM pets
WHERE kind = 'dog' OR kind = 'cat' AND age > 4;`, PETS),
];
const patternItems = [
  guided('LIKE: match a pattern', 'LIKE finds text by pattern. % means "any letters", and _ means "exactly one letter".',
    ['\'B%\' means: starts with B.', 'Only Bo starts with B.', 'Use \'%o\' for "ends with o".'],
    `SELECT name FROM pets
WHERE name LIKE 'B%';`, PETS),
  guided('IN: one of a list', 'IN checks if a value is in a list. It is a short way to write many ORs.',
    ['The list is in brackets.', 'kind IN (\'cat\', \'bird\') means cat or bird.', 'Tom and Bo pass.'],
    `SELECT name, kind FROM pets
WHERE kind IN ('cat', 'bird');`, PETS),
  guided('BETWEEN: a range', 'BETWEEN a AND b keeps values from a to b, including both ends.',
    ['price from 5 to 20.', 'Book, Lamp and Mug fit.', 'The ends count too.'],
    `SELECT name, price FROM products
WHERE price BETWEEN 5 AND 20;`, SHOP),
];
const sortItems = [
  guided('Smallest first', 'ORDER BY sorts the answer. By default it goes from smallest to biggest.',
    ['ORDER BY age sorts by the age column.', 'The tiles slide into the right order in the tray.', 'The youngest pet is first.'],
    `SELECT name, age FROM pets
ORDER BY age;`, PETS),
  guided('Biggest first', 'Add DESC to flip the order. ASC means smallest first and is the default.',
    ['DESC means descending: biggest first.', 'The tiles swap places.', 'The dearest product is on top.'],
    `SELECT name, price FROM products
ORDER BY price DESC;`, SHOP),
  guided('Sort by two things', 'You can sort by more than one column. The second one is used when the first is the same.',
    ['First sort by kind, A to Z.', 'Pets of the same kind are sorted by age, biggest first.', 'Both dogs are together, oldest first.'],
    `SELECT name, kind, age FROM pets
ORDER BY kind, age DESC;`, PETS),
];
const limitItems = [
  guided('Only the first few', 'LIMIT cuts the answer after a number of rows. With ORDER BY it gives you "the top 3".',
    ['Sort the products by price, dearest first.', 'LIMIT 3 keeps only the first three.', 'The other rows fall away before the answer is sent.'],
    `SELECT name, price FROM products
ORDER BY price DESC
LIMIT 3;`, SHOP),
  guided('Skip some rows', 'OFFSET skips rows at the start. LIMIT 2 OFFSET 2 means "skip 2, then take 2". It is how pages work.',
    ['OFFSET 2 skips the first two.', 'LIMIT 2 takes the next two.', 'This is page 2 of a list with 2 per page.'],
    `SELECT name FROM products
ORDER BY name
LIMIT 2 OFFSET 2;`, SHOP),
  guided('Each value once', 'DISTINCT removes repeated rows from the answer. Each different value appears only once.',
    ['Many students live in the same city.', 'DISTINCT keeps one of each.', 'Repeated tiles are removed.'],
    `SELECT DISTINCT city FROM students;`, CLASS),
];
const calcItems = [
  guided('Do maths on a column', 'A column can be a calculation. AS gives the new column a name of your choice.',
    ['price * 2 doubles every price.', 'AS double_price names the new column.', 'The result is a new column that was never in the table.'],
    `SELECT name, price * 2 AS double_price
FROM products;`, SHOP),
  guided('Change the letters', 'SQL has functions. UPPER makes letters capital, LOWER makes them small and LENGTH counts them.',
    ['UPPER(name) shouts the name.', 'The table itself does not change.', 'Only the answer is different.'],
    `SELECT UPPER(name) AS loud_name FROM pets;`, PETS),
  guided('Use two columns together', 'A calculation can use several columns of the same row.',
    ['stock * price is the value of the goods on the shelf.', 'It is worked out for each row on its own.', 'Mug has no stock, so its value is 0.'],
    `SELECT name, stock * price AS shelf_value
FROM products;`, SHOP),
];

export default { id: 'sql-topic-2', title: 'Reading Data', image: './environments/sql/images/reading-data.png', prompt: 'Ask a table questions and see the answers on the screen.', lesson: { title: 'Reading Data', subtopics: [
  lesson('📋', 'Selecting Everything with SELECT *', {
    definition: '**SELECT** reads data from a table. **SELECT *** means "all the columns". **FROM** says which table to read.',
    points: [
      { term: 'In simple words', text: 'SELECT is a question. It does not change the table. It only copies what you ask for and shows it on the screen.' },
      { term: 'Real-life example', text: 'Taking a photocopy of the whole class register. The original stays on the desk.' },
      { term: 'Good to know', text: 'The answer is called a result set. It is a new small table that lives only on your screen.' },
    ],
    code: 'SELECT * FROM pets;',
  }, allItems, 'Type the question and watch the robot fetch the table'),
  lesson('🧲', 'Choosing Columns with SELECT', {
    definition: 'After **SELECT** you can list the **columns** you want, separated by commas. Only those columns come back.',
    points: [
      { term: 'In simple words', text: 'Instead of copying the whole table, you pick the columns you care about.' },
      { term: 'Real-life example', text: 'Looking at only the Name and Phone columns of a contact list.' },
      { term: 'Good to know', text: 'The columns appear in the order you list them, not the order in the table.' },
    ],
    code: 'SELECT name, age FROM pets;',
  }, colsItems, 'Type the question and watch the columns come off the table'),
  lesson('🔍', 'Filtering Rows with WHERE', {
    definition: '**WHERE** keeps only the rows that match a rule. The rule is a comparison such as **=**, **>**, **<**, **>=**, **<=** or **<>**.',
    points: [
      { term: 'In simple words', text: 'SQL checks every row against your rule. Rows that pass are kept. Rows that fail are left out.' },
      { term: 'Real-life example', text: 'A teacher who asks: "Stand up if you are older than 12."' },
      { term: 'Careful', text: 'Text goes in single quotes, like \'dog\'. Numbers do not.' },
    ],
    code: "SELECT name, age FROM pets\nWHERE kind = 'dog';",
  }, whereItems, 'Type the question and watch the rows being checked'),
  lesson('🧩', 'Combining Conditions: AND, OR, NOT', {
    definition: '**AND**, **OR** and **NOT** join rules together. AND needs both true, OR needs one true, NOT flips a rule.',
    points: [
      { term: 'In simple words', text: 'AND makes the filter stricter. OR makes it looser. NOT turns "yes" into "no".' },
      { term: 'Real-life example', text: '"You may enter if you have a ticket AND you are over 12."' },
      { term: 'Careful', text: 'AND is worked out before OR. Use ( ) brackets to be sure.' },
    ],
    code: "SELECT name FROM pets\nWHERE kind = 'dog' AND age > 2;",
  }, logicItems, 'Type the question and watch the two rules work together'),
  lesson('🎯', 'Patterns and Ranges: LIKE, IN, BETWEEN', {
    definition: '**LIKE** matches text patterns, **IN** matches a list of values and **BETWEEN** matches a range of values.',
    points: [
      { term: 'In simple words', text: 'These are short ways to write rules. In a LIKE pattern, % means any letters.' },
      { term: 'Real-life example', text: 'Searching a phone book for every name that starts with B.' },
      { term: 'Good to know', text: 'BETWEEN includes both ends. BETWEEN 5 AND 20 includes 5 and 20.' },
    ],
    code: "SELECT name FROM pets\nWHERE name LIKE 'B%';",
  }, patternItems, 'Type the question and watch the rows being matched'),
  lesson('↕️', 'Sorting Results with ORDER BY', {
    definition: '**ORDER BY** sorts the answer by one or more columns. **ASC** is smallest first (the default) and **DESC** is biggest first.',
    points: [
      { term: 'In simple words', text: 'Without ORDER BY the rows come back in any order. ORDER BY puts them in the order you want.' },
      { term: 'Real-life example', text: 'A race result list: the fastest runner is first.' },
      { term: 'Good to know', text: 'Text is sorted A to Z. Numbers are sorted by size.' },
    ],
    code: 'SELECT name, age FROM pets\nORDER BY age DESC;',
  }, sortItems, 'Type the question and watch the tiles change places'),
  lesson('✂️', 'Limiting Results: LIMIT, OFFSET, DISTINCT', {
    definition: '**LIMIT** keeps only the first rows, **OFFSET** skips rows at the start and **DISTINCT** removes repeated values.',
    points: [
      { term: 'In simple words', text: 'These three shorten the answer. LIMIT takes a few, OFFSET skips a few, DISTINCT removes copies.' },
      { term: 'Real-life example', text: 'A "top 3" list, or page 2 of a long list.' },
      { term: 'Careful', text: 'LIMIT goes at the very end, after ORDER BY.' },
    ],
    code: 'SELECT name, price FROM products\nORDER BY price DESC\nLIMIT 3;',
  }, limitItems, 'Type the question and watch rows fall away'),
  lesson('🧮', 'Calculated Columns and Aliases', {
    definition: 'A selected column can be a **calculation** or a **function**. **AS** gives it a new name, called an **alias**.',
    points: [
      { term: 'In simple words', text: 'SQL can do maths and change text while it reads. The table itself is never changed.' },
      { term: 'Real-life example', text: 'A shop till that adds 15% tax to each price on the receipt.' },
      { term: 'Good to know', text: 'You can use + - * / and functions such as UPPER, LOWER, LENGTH and ROUND.' },
    ],
    code: 'SELECT name, price * 2 AS double_price\nFROM products;',
  }, calcItems, 'Type the question and watch the new column appear'),
] } };
