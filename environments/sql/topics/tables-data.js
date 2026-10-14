import { guided, warn, lesson, PETS, PETS_EMPTY } from './sql-common.js?v=20261014-cs-11';

// Topic 1: building tables and changing the data inside them.
const createItems = [
  guided('Build a pets table', 'CREATE TABLE builds a new empty table. Inside the brackets you list the columns: a name, then a type.',
    ['CREATE TABLE pets starts a new table called pets.', 'Each line inside ( ) is one column: its name and its type.', 'Watch each column heading drop onto the table as you type it.'],
    `CREATE TABLE pets (
  id INTEGER,
  name TEXT,
  age INTEGER
);`),
  guided('A table for books', 'The type tells the column what it can hold: TEXT for words, INTEGER for whole numbers, REAL for numbers with decimals.',
    ['title and author hold words, so they are TEXT.', 'year is a whole number, so it is INTEGER.', 'price can have cents, so it is REAL.'],
    `CREATE TABLE books (
  title TEXT,
  author TEXT,
  year INTEGER,
  price REAL
);`),
  warn('A name that is already taken', 'Two tables cannot have the same name. SQL stops with an error and your old table stays safe.',
    ['The pets table already exists on the desk.', 'We try to build another one with the same name.', 'SQL says the table already exists. Pick a different name.'],
    `CREATE TABLE pets (
  id INTEGER,
  name TEXT
);`, PETS_EMPTY),
];
const typesItems = [
  guided('Three kinds of values', 'Each column holds one kind of value. After the table is built, INSERT puts a row in and every value lands in its own column.',
    ['name is TEXT, price is REAL and stock is INTEGER.', 'INSERT adds one row of values.', 'Text goes inside single quotes. Numbers do not.'],
    `CREATE TABLE products (name TEXT, price REAL, stock INTEGER);
INSERT INTO products VALUES ('Pen', 1.5, 100);`),
  guided('Rules for a column', 'A constraint is a rule. PRIMARY KEY gives every row its own number, NOT NULL forbids empty, UNIQUE forbids repeats, DEFAULT fills in a value for you.',
    ['The column headings show tags: KEY, NOT NULL and UNIQUE.', 'We insert only the name. SQL fills in the rest.', 'The id counts up by itself and points starts at its DEFAULT of 0.'],
    `CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  points INTEGER DEFAULT 0
);
INSERT INTO users (name) VALUES ('Zoe');`),
  warn('Breaking a rule', 'When a row breaks a rule, SQL rejects the whole row. Nothing is saved.',
    ['name is NOT NULL, so every row must have a name.', 'This INSERT only gives the email.', 'SQL throws the row back with a NOT NULL error.'],
    `INSERT INTO pets (kind, age) VALUES ('cat', 4);`, PETS),
];
const insertItems = [
  guided('Add one row', 'INSERT INTO adds a row. First the table and the columns you want to fill, then VALUES with the data in the same order.',
    ['INSERT INTO pets (name, kind, age) says which columns we fill.', 'VALUES holds the data in the same order.', 'The row drops in and each value fills its cell. The id is made for you.'],
    `INSERT INTO pets (name, kind, age)
VALUES ('Zed', 'fish', 4);`, PETS),
  guided('Add many rows at once', 'One INSERT can add several rows. Separate each row with a comma.',
    ['Each ( ) is one row.', 'Rows are separated by commas.', 'All the rows drop in one after the other.'],
    `INSERT INTO pets (name, kind, age) VALUES
  ('Kit', 'cat', 1),
  ('Max', 'dog', 6);`, PETS),
  warn('The wrong number of values', 'The number of values must match the number of columns you listed.',
    ['We list three columns: name, kind and age.', 'But we give only two values.', 'SQL stops: it says how many values it expected.'],
    `INSERT INTO pets (name, kind, age)
VALUES ('Kit', 'cat');`, PETS),
];
const updateItems = [
  guided('Change one row', 'UPDATE changes values that are already in the table. WHERE decides which row.',
    ['SET says the new value for a column.', 'WHERE id = 2 picks only one row.', 'Only that cell flips to the new value.'],
    `UPDATE pets
SET age = 6
WHERE id = 2;`, PETS),
  guided('Change many rows', 'WHERE can match more than one row. Every matching row gets the change.',
    ['kind = \'dog\' matches two rows.', 'age = age + 1 uses the old value to make the new one.', 'Both dogs get one year older.'],
    `UPDATE pets
SET age = age + 1
WHERE kind = 'dog';`, PETS),
  warn('Forgetting WHERE', 'Without WHERE, UPDATE changes every single row. This is a very common mistake.',
    ['There is no WHERE here.', 'So every row matches.', 'All the pets are changed to cats.'],
    `UPDATE pets
SET kind = 'cat';`, PETS),
];
const deleteItems = [
  guided('Remove one row', 'DELETE FROM removes rows. WHERE picks which ones. A bin walks over and takes the row away.',
    ['WHERE id = 4 matches one row.', 'The row turns red.', 'The row breaks into pieces and goes in the bin.'],
    `DELETE FROM pets
WHERE id = 4;`, PETS),
  guided('Remove by a rule', 'Any WHERE rule works. Here every pet younger than 3 is removed.',
    ['age < 3 matches Ann and Bo.', 'Both rows turn red.', 'The bin takes them one after the other and the rest move up.'],
    `DELETE FROM pets
WHERE age < 3;`, PETS),
  warn('Forgetting WHERE again', 'DELETE with no WHERE removes every row. The empty table is still there, only the rows are gone.',
    ['No WHERE means every row matches.', 'The bin takes all the rows.', 'The table stays, with its headings, but it is empty.'],
    `DELETE FROM pets;`, PETS),
];
const alterItems = [
  guided('Add a column', 'ALTER TABLE changes the shape of a table. ADD COLUMN adds a new heading. Old rows get NULL (empty) in it.',
    ['ALTER TABLE pets says which table to change.', 'ADD COLUMN owner TEXT adds one more heading.', 'Every old row gets an empty owner cell.'],
    `ALTER TABLE pets
ADD COLUMN owner TEXT;`, PETS),
  guided('Rename a table', 'RENAME TO gives the table a new name. All the rows stay exactly as they are.',
    ['The sign on the table flips.', 'The new name appears.', 'The rows are untouched.'],
    `ALTER TABLE pets
RENAME TO animals;`, PETS),
  guided('Throw a table away', 'DROP TABLE deletes the whole table: the headings and every row. This cannot be undone.',
    ['DROP TABLE pets names the table to destroy.', 'A big bin walks over.', 'The whole table breaks apart and goes in the bin.'],
    `DROP TABLE pets;`, PETS),
];

export default { id: 'sql-topic-1', title: 'Tables and Data', image: './environments/sql/images/tables-data.png', prompt: 'Build tables, add rows, change them and remove them.', lesson: { title: 'Tables and Data', subtopics: [
  lesson('🏗️', 'Creating Tables with CREATE TABLE', {
    definition: '**CREATE TABLE** builds a new, empty table. You give it a **name** and a list of **columns**. Each column has a name and a **type**.',
    points: [
      { term: 'In simple words', text: 'A table is a grid. The columns are the headings, like name and age. CREATE TABLE only draws the empty grid. The rows come later.' },
      { term: 'Real-life example', text: 'An empty class register. The headings are printed, but no student is written in yet.' },
      { term: 'Good to know', text: 'Every command ends with a semicolon ; . SQL words are not case sensitive, but we write them in CAPITALS so they are easy to see.' },
    ],
    code: 'CREATE TABLE pets (\n  id INTEGER,\n  name TEXT,\n  age INTEGER\n);',
  }, createItems, 'Type the command and watch the table being built'),
  lesson('🔒', 'Data Types and Constraints', {
    definition: 'A **data type** says what kind of value a column holds. A **constraint** is a rule the column must follow, like **PRIMARY KEY**, **NOT NULL**, **UNIQUE** or **DEFAULT**.',
    points: [
      { term: 'In simple words', text: 'TEXT is for words, INTEGER is for whole numbers and REAL is for numbers with a decimal point. Constraints are rules written after the type.' },
      { term: 'Real-life example', text: 'A form. Some boxes must be filled in, some must be different for everyone, and some already have a value written in.' },
      { term: 'Good to know', text: 'NULL means "nothing here". It is not the same as 0 or an empty text.' },
    ],
    code: 'CREATE TABLE users (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  email TEXT UNIQUE,\n  points INTEGER DEFAULT 0\n);',
  }, typesItems, 'Type the command and watch the rules appear on the headings'),
  lesson('➕', 'Adding Rows with INSERT INTO', {
    definition: '**INSERT INTO** adds a new **row** to a table. You say which columns to fill, then give the **VALUES** in the same order.',
    points: [
      { term: 'In simple words', text: 'Each INSERT writes one more line in the table. The values go into the columns in the order you listed them.' },
      { term: 'Real-life example', text: 'Writing a new student at the bottom of the class register.' },
      { term: 'Careful', text: 'Text needs single quotes, like \'Rex\'. Numbers do not. Columns you skip become empty, or take their DEFAULT.' },
    ],
    code: "INSERT INTO pets (name, kind, age)\nVALUES ('Zed', 'fish', 4);",
  }, insertItems, 'Type the command and watch the row drop in'),
  lesson('✏️', 'Changing Rows with UPDATE', {
    definition: '**UPDATE** changes values in rows that already exist. **SET** gives the new value and **WHERE** says which rows to change.',
    points: [
      { term: 'In simple words', text: 'Find the rows that match, then write a new value in the cell. The other rows stay as they are.' },
      { term: 'Real-life example', text: 'Rubbing out a mark in the register and writing the correct one.' },
      { term: 'Careful', text: 'Always write WHERE. Without it, every row in the table is changed.' },
    ],
    code: "UPDATE pets\nSET age = 6\nWHERE id = 2;",
  }, updateItems, 'Type the command and watch the cells change'),
  lesson('🗑️', 'Removing Rows with DELETE', {
    definition: '**DELETE FROM** removes rows from a table. **WHERE** says which rows to remove.',
    points: [
      { term: 'In simple words', text: 'The rows that match are taken out and thrown away. The table itself stays.' },
      { term: 'Real-life example', text: 'Crossing a student off the register and tearing out their line.' },
      { term: 'Careful', text: 'DELETE without WHERE empties the whole table. There is no undo.' },
    ],
    code: "DELETE FROM pets\nWHERE id = 4;",
  }, deleteItems, 'Type the command and watch the bin come'),
  lesson('🛠️', 'Changing and Dropping Tables', {
    definition: '**ALTER TABLE** changes the shape of a table (add a column, rename it). **DROP TABLE** deletes the whole table.',
    points: [
      { term: 'In simple words', text: 'ALTER keeps the table but changes its headings or name. DROP removes it completely, with every row inside.' },
      { term: 'Real-life example', text: 'ALTER is adding a new column to the register. DROP is throwing the whole register away.' },
      { term: 'Careful', text: 'DROP TABLE cannot be undone. Be sure before you run it.' },
    ],
    code: "ALTER TABLE pets\nADD COLUMN owner TEXT;",
  }, alterItems, 'Type the command and watch the table change shape'),
] } };
