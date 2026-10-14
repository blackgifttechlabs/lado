import { guided, warn, lesson, PETS, SHOP, CLASS } from './sql-common.js?v=20261014-cs-11';

// Topic 3: adding things up. Many rows become one answer.
const PETS_NULL = PETS + `\nINSERT INTO pets (name, kind, age) VALUES ('Zed', NULL, 4);`;
const countItems = [
  guided('How many rows?', 'COUNT(*) counts rows. The rows are poured into a hopper, and one number comes out.',
    ['COUNT(*) means "count the rows".', 'Each row drops into the hopper.', 'The hopper gives back one number.'],
    `SELECT COUNT(*) FROM pets;`, PETS),
  guided('Count only some rows', 'WHERE works before COUNT. Only the rows that match are counted.',
    ['WHERE keeps the dogs.', 'Only they go into the hopper.', 'The answer is 2.'],
    `SELECT COUNT(*) AS dogs FROM pets
WHERE kind = 'dog';`, PETS),
  warn('COUNT(column) skips NULL', 'COUNT(*) counts every row. COUNT(kind) counts only rows where kind is not empty (NULL).',
    ['Zed has no kind: it is NULL.', 'COUNT(*) counts all 5 rows.', 'COUNT(kind) counts only the 4 that have a kind.'],
    `SELECT COUNT(*) AS rows_total, COUNT(kind) AS with_kind
FROM pets;`, PETS_NULL),
];
const mathItems = [
  guided('Add them up', 'SUM adds all the numbers in a column.',
    ['SUM(stock) adds every stock number.', 'The numbers fall into the hopper.', 'One total comes out.'],
    `SELECT SUM(stock) AS total_stock FROM products;`, SHOP),
  guided('The average', 'AVG gives the average: the sum divided by how many.',
    ['AVG(age) adds the ages and divides.', '3 + 5 + 2 + 1 = 11, and 11 / 4 = 2.75.', 'Use ROUND to shorten long answers.'],
    `SELECT AVG(age) AS average_age FROM pets;`, PETS),
  guided('Smallest and biggest', 'MIN gives the smallest value and MAX gives the biggest. You can use many in one SELECT.',
    ['MIN(age) is the youngest.', 'MAX(age) is the oldest.', 'One row comes out with both answers.'],
    `SELECT MIN(age) AS youngest, MAX(age) AS oldest
FROM pets;`, PETS),
];
const groupItems = [
  guided('One bucket for each kind', 'GROUP BY sorts the rows into buckets, one for each different value. The summary is then worked out for each bucket.',
    ['GROUP BY kind makes a bucket for every kind.', 'Each row goes into its own bucket.', 'Each bucket gives one answer: how many it holds.'],
    `SELECT kind, COUNT(*) AS how_many
FROM pets
GROUP BY kind;`, PETS),
  guided('Average for each group', 'Any summary works with GROUP BY: SUM, AVG, MIN, MAX.',
    ['One bucket for each category.', 'AVG(price) is worked out inside each bucket.', 'You get one row for each category.'],
    `SELECT category, AVG(price) AS average_price
FROM products
GROUP BY category;`, SHOP),
  guided('Sort the groups', 'You can sort the finished groups with ORDER BY, just like any other answer.',
    ['SUM(stock) is the total for each category.', 'ORDER BY puts the biggest total first.', 'The buckets are sorted before they reach the screen.'],
    `SELECT category, SUM(stock) AS total
FROM products
GROUP BY category
ORDER BY total DESC;`, SHOP),
];
const havingItems = [
  guided('Keep only big groups', 'HAVING filters the groups after they are made. WHERE filters rows before.',
    ['The buckets are made first.', 'HAVING COUNT(*) > 1 keeps buckets with more than one row.', 'Small buckets are thrown away.'],
    `SELECT category, COUNT(*) AS how_many
FROM products
GROUP BY category
HAVING COUNT(*) > 1;`, SHOP),
  guided('Filter on an average', 'HAVING can use any summary, such as AVG.',
    ['The average grade is worked out for each city.', 'HAVING keeps the cities above 70.', 'Mutare is below 70, so it is left out.'],
    `SELECT city, AVG(grade) AS average
FROM students
GROUP BY city
HAVING AVG(grade) > 70;`, CLASS),
  guided('WHERE and HAVING together', 'WHERE removes rows first. HAVING removes groups after. Both can be used in the same question.',
    ['WHERE removes the cheap products.', 'The rest are grouped.', 'HAVING removes groups with less than 2.'],
    `SELECT category, COUNT(*) AS how_many
FROM products
WHERE price > 5
GROUP BY category
HAVING COUNT(*) >= 2;`, SHOP),
];

export default { id: 'sql-topic-3', title: 'Summaries', image: './environments/sql/images/summaries.png', prompt: 'Turn many rows into one answer: counts, totals and averages.', lesson: { title: 'Summaries', subtopics: [
  lesson('🔢', 'Counting with COUNT', {
    definition: '**COUNT** counts how many rows there are. **COUNT(*)** counts all rows, and **COUNT(column)** counts the rows where that column is not empty.',
    points: [
      { term: 'In simple words', text: 'COUNT squeezes many rows into one number.' },
      { term: 'Real-life example', text: 'Counting how many students are in the class.' },
      { term: 'Good to know', text: 'Functions like COUNT, SUM and AVG are called aggregate functions.' },
    ],
    code: 'SELECT COUNT(*) FROM pets;',
  }, countItems, 'Type the question and watch the hopper count'),
  lesson('➗', 'SUM, AVG, MIN and MAX', {
    definition: '**SUM** adds numbers, **AVG** finds the average, **MIN** finds the smallest and **MAX** finds the biggest.',
    points: [
      { term: 'In simple words', text: 'Each one squeezes a whole column of numbers into one answer.' },
      { term: 'Real-life example', text: 'The total on a shopping bill, or the highest mark in a test.' },
      { term: 'Careful', text: 'SUM and AVG only work on numbers. NULL values are ignored.' },
    ],
    code: 'SELECT SUM(stock) AS total_stock\nFROM products;',
  }, mathItems, 'Type the question and watch the numbers pour in'),
  lesson('🪣', 'Grouping with GROUP BY', {
    definition: '**GROUP BY** puts rows with the same value into the same group. A summary is then worked out for each group.',
    points: [
      { term: 'In simple words', text: 'Sort the rows into buckets, one bucket for each different value. Then count, add or average inside each bucket.' },
      { term: 'Real-life example', text: 'Sorting the class into rows by city, then counting each row.' },
      { term: 'Careful', text: 'Every column in SELECT must be either in GROUP BY or inside a summary like COUNT.' },
    ],
    code: 'SELECT kind, COUNT(*) AS how_many\nFROM pets\nGROUP BY kind;',
  }, groupItems, 'Type the question and watch the buckets fill'),
  lesson('🚧', 'Filtering Groups with HAVING', {
    definition: '**HAVING** filters the groups after GROUP BY has made them. **WHERE** filters single rows before the groups are made.',
    points: [
      { term: 'In simple words', text: 'WHERE looks at one row at a time. HAVING looks at a whole bucket and asks "is this bucket big enough?".' },
      { term: 'Real-life example', text: 'Only keep the classes that have more than 20 students.' },
      { term: 'Careful', text: 'You cannot use COUNT or SUM in WHERE. Use HAVING.' },
    ],
    code: 'SELECT category, COUNT(*) AS how_many\nFROM products\nGROUP BY category\nHAVING COUNT(*) > 1;',
  }, havingItems, 'Type the question and watch small buckets get thrown away'),
] } };
