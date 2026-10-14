import { PETS, SHOP, CLASS, OWNERS } from './sql-common.js?v=20261014-cs-11';
import { sqlModel, assemble } from './sql-model.js?v=20261014-cs-11';

// Challenges for Reading Data, Summaries and Joins. The expected answer is worked out by running the model solution.
const expectOf = (solution, setup, check) => { const r = sqlModel(assemble(setup, '-- YOUR TURN\n' + solution), { check }); return r.error ? `!! ${r.error}` : r.output; };
const diy = (task, solution, hint, goals, why, setup, check) => ({ kind: 'diy', task, expect: expectOf(solution, setup, check), solution, hint, goals, why, setup, check });
const debug = (task, code, solution, hint, goals, why, setup, check) => ({ kind: 'debug', task, code, expect: expectOf(solution, setup, check), solution, hint, goals, why, setup, check });

export const PRACTICE2 = {
  'Selecting Everything with SELECT *': [
    diy('The products table is ready. Show everything in it.', 'SELECT * FROM products;', 'SELECT * FROM products;', [{ label: 'Uses SELECT *', re: 'select\\s+\\*\\s+from\\s+products' }], '* means every column.', SHOP),
    diy('The students table is ready. Show every row and every column.', 'SELECT * FROM students;', 'SELECT * FROM students;', [{ label: 'Uses SELECT *', re: 'select\\s+\\*' }], 'SELECT * FROM table copies the whole table to the screen.', CLASS),
    debug('FROM is spelled wrong, so SQL stops. Fix it.', 'SELECT * FORM pets;', 'SELECT * FROM pets;', 'The word is FROM, not FORM.', [{ label: 'Has FROM', re: '\\bfrom\\b' }], 'SQL words must be spelled right.', PETS),
  ],
  'Choosing Columns with SELECT': [
    diy('Show only the name and price of every product.', 'SELECT name, price FROM products;', 'SELECT name, price FROM products; The columns are separated by a comma.', [{ label: 'Lists name and price', re: 'select\\s+name\\s*,\\s*price' }], 'You pick the columns you want.', SHOP),
    diy('Show only the city column of the students.', 'SELECT city FROM students;', 'SELECT city FROM students;', [{ label: 'Selects only city', re: 'select\\s+city\\s+from' }], 'One column gives a simple list.', CLASS),
    debug('There is a comma missing, so SQL thinks age is a new name for the name column. Fix it so both columns show.', 'SELECT name age FROM pets;', 'SELECT name, age FROM pets;', 'Put a comma between name and age.', [{ label: 'Has a comma', re: 'name\\s*,\\s*age' }], 'Columns are separated by commas.', PETS),
  ],
  'Filtering Rows with WHERE': [
    diy('Show the name of every student with a grade above 70.', 'SELECT name FROM students\nWHERE grade > 70;', 'WHERE grade > 70', [{ label: 'Uses WHERE grade > 70', re: 'where\\s+grade\\s*>\\s*70' }], 'WHERE keeps only the rows that match.', CLASS),
    diy('Show the name and stock of the products that are sold out (stock is 0).', 'SELECT name, stock FROM products\nWHERE stock = 0;', 'WHERE stock = 0', [{ label: 'Uses WHERE stock = 0', re: 'where\\s+stock\\s*=\\s*0' }], 'A single = compares in SQL.', SHOP),
    debug('Text needs quotes. Fix the WHERE so it shows the students from Harare.', 'SELECT name FROM students\nWHERE city = Harare;', "SELECT name FROM students\nWHERE city = 'Harare';", "Put 'Harare' in single quotes.", [{ label: 'Quotes Harare', re: "'harare'" }], 'Without quotes SQL looks for a column.', CLASS),
  ],
  'Combining Conditions: AND, OR, NOT': [
    diy('Show the name and price of the products in the school category that cost less than 20.', "SELECT name, price FROM products\nWHERE category = 'school' AND price < 20;", "category = 'school' AND price < 20", [{ label: 'Uses AND', re: '\\band\\b' }], 'AND needs both rules to be true.', SHOP),
    diy('Show the names of the students who live in Bulawayo OR have a grade below 60.', "SELECT name FROM students\nWHERE city = 'Bulawayo' OR grade < 60;", "city = 'Bulawayo' OR grade < 60", [{ label: 'Uses OR', re: '\\bor\\b' }], 'OR needs only one rule to be true.', CLASS),
    debug('This should show only Cara (from Harare AND a grade above 85), but OR lets too many in. Fix it.', "SELECT name FROM students\nWHERE city = 'Harare' OR grade > 85;", "SELECT name FROM students\nWHERE city = 'Harare' AND grade > 85;", 'Change OR to AND.', [{ label: 'Uses AND', re: '\\band\\b' }], 'AND is stricter than OR.', CLASS),
  ],
  'Patterns and Ranges: LIKE, IN, BETWEEN': [
    diy('Show the names of the pets whose name starts with the letter B.', "SELECT name FROM pets\nWHERE name LIKE 'B%';", "WHERE name LIKE 'B%'", [{ label: 'Uses LIKE', re: 'like' }], '% means any letters.', PETS),
    diy('Show the name and price of the products that cost between 5 and 20.', 'SELECT name, price FROM products\nWHERE price BETWEEN 5 AND 20;', 'WHERE price BETWEEN 5 AND 20', [{ label: 'Uses BETWEEN', re: 'between' }], 'BETWEEN includes both ends.', SHOP),
    debug('IN needs a list inside brackets. Fix it so it shows the cats and birds.', "SELECT name FROM pets\nWHERE kind IN 'cat', 'bird';", "SELECT name FROM pets\nWHERE kind IN ('cat', 'bird');", 'Put ( ) around the list.', [{ label: 'Uses IN ( )', re: "in\\s*\\(" }], 'IN takes a list in brackets.', PETS),
  ],
  'Sorting Results with ORDER BY': [
    diy('Show the product names and prices from the cheapest to the most expensive.', 'SELECT name, price FROM products\nORDER BY price;', 'ORDER BY price', [{ label: 'Uses ORDER BY', re: 'order\\s+by\\s+price' }], 'The default order is smallest first.', SHOP),
    diy('Show the student names and grades, with the highest grade first.', 'SELECT name, grade FROM students\nORDER BY grade DESC;', 'ORDER BY grade DESC', [{ label: 'Uses DESC', re: 'desc' }], 'DESC puts the biggest first.', CLASS),
    debug('The word BY is missing from ORDER BY. Fix it.', 'SELECT name, age FROM pets\nORDER age;', 'SELECT name, age FROM pets\nORDER BY age;', 'It is ORDER BY.', [{ label: 'Uses ORDER BY', re: 'order\\s+by' }], 'ORDER is always followed by BY.', PETS),
  ],
  'Limiting Results: LIMIT, OFFSET, DISTINCT': [
    diy('Show the name and price of the 3 most expensive products.', 'SELECT name, price FROM products\nORDER BY price DESC\nLIMIT 3;', 'ORDER BY price DESC, then LIMIT 3', [{ label: 'Uses LIMIT 3', re: 'limit\\s+3' }], 'Sort first, then LIMIT.', SHOP),
    diy('Show each city only once.', 'SELECT DISTINCT city FROM students;', 'SELECT DISTINCT city FROM students;', [{ label: 'Uses DISTINCT', re: 'distinct' }], 'DISTINCT removes repeats.', CLASS),
    debug('LIMIT must come after ORDER BY. Fix the order of the lines.', 'SELECT name FROM pets\nLIMIT 2\nORDER BY age;', 'SELECT name FROM pets\nORDER BY age\nLIMIT 2;', 'Move LIMIT to the end.', [{ label: 'Still uses LIMIT', re: 'limit\\s+2' }], 'LIMIT always goes last.', PETS),
  ],
  'Calculated Columns and Aliases': [
    diy('Show each product name and its price doubled. Call the new column double_price.', 'SELECT name, price * 2 AS double_price\nFROM products;', 'price * 2 AS double_price', [{ label: 'Uses AS double_price', re: 'as\\s+double_price' }], 'AS names the new column.', SHOP),
    diy('Show each pet name in capital letters. Call the column loud_name.', 'SELECT UPPER(name) AS loud_name FROM pets;', 'UPPER(name) AS loud_name', [{ label: 'Uses UPPER', re: 'upper\\s*\\(' }], 'UPPER makes capital letters.', PETS),
    debug('A function needs brackets round its input. Fix UPPER.', 'SELECT UPPER name FROM pets;', 'SELECT UPPER(name) FROM pets;', 'Write UPPER(name).', [{ label: 'Uses UPPER( )', re: 'upper\\s*\\(\\s*name\\s*\\)' }], 'Functions use ( ).', PETS),
  ],
  'Counting with COUNT': [
    diy('Show how many products there are.', 'SELECT COUNT(*) FROM products;', 'SELECT COUNT(*) FROM products;', [{ label: 'Uses COUNT(*)', re: 'count\\s*\\(\\s*\\*\\s*\\)' }], 'COUNT(*) counts rows.', SHOP),
    diy('Count the students who live in Harare.', "SELECT COUNT(*) FROM students\nWHERE city = 'Harare';", "WHERE city = 'Harare'", [{ label: 'Uses COUNT and WHERE', re: 'count[\\s\\S]*where' }], 'WHERE works before COUNT.', CLASS),
    debug('COUNT needs brackets. Fix it.', 'SELECT COUNT * FROM students;', 'SELECT COUNT(*) FROM students;', 'Write COUNT(*).', [{ label: 'Uses COUNT(*)', re: 'count\\s*\\(\\s*\\*\\s*\\)' }], 'Functions use ( ).', CLASS),
  ],
  'SUM, AVG, MIN and MAX': [
    diy('Show the total stock of all products. Call it total_stock.', 'SELECT SUM(stock) AS total_stock FROM products;', 'SUM(stock)', [{ label: 'Uses SUM', re: 'sum\\s*\\(' }], 'SUM adds a column.', SHOP),
    diy('Show the lowest and highest grade as lowest and highest.', 'SELECT MIN(grade) AS lowest, MAX(grade) AS highest\nFROM students;', 'MIN(grade) AS lowest, MAX(grade) AS highest', [{ label: 'Uses MIN and MAX', re: 'min[\\s\\S]*max' }], 'MIN and MAX give the ends.', CLASS),
    debug('AVG cannot average words. Average the age instead.', 'SELECT AVG(name) FROM pets;', 'SELECT AVG(age) FROM pets;', 'Use the age column.', [{ label: 'Uses AVG(age)', re: 'avg\\s*\\(\\s*age\\s*\\)' }], 'AVG only works on numbers.', PETS),
  ],
  'Grouping with GROUP BY': [
    diy('Show each category and how many products it has. Call the count how_many.', 'SELECT category, COUNT(*) AS how_many\nFROM products\nGROUP BY category;', 'GROUP BY category', [{ label: 'Uses GROUP BY', re: 'group\\s+by\\s+category' }], 'GROUP BY makes one bucket for each value.', SHOP),
    diy('Show each city and the average grade of its students. Call it average.', 'SELECT city, AVG(grade) AS average\nFROM students\nGROUP BY city;', 'AVG(grade) with GROUP BY city', [{ label: 'Uses GROUP BY city', re: 'group\\s+by\\s+city' }], 'Summaries work inside each bucket.', CLASS),
    debug('Without GROUP BY, everything lands in one bucket. Add GROUP BY kind so each kind is counted.', 'SELECT kind, COUNT(*) AS how_many\nFROM pets;', 'SELECT kind, COUNT(*) AS how_many\nFROM pets\nGROUP BY kind;', 'Add GROUP BY kind at the end.', [{ label: 'Uses GROUP BY', re: 'group\\s+by\\s+kind' }], 'GROUP BY makes the buckets.', PETS),
  ],
  'Filtering Groups with HAVING': [
    diy('Show the categories that have more than one product, with how_many.', 'SELECT category, COUNT(*) AS how_many\nFROM products\nGROUP BY category\nHAVING COUNT(*) > 1;', 'HAVING COUNT(*) > 1', [{ label: 'Uses HAVING', re: 'having' }], 'HAVING filters groups.', SHOP),
    diy('Show the cities where the average grade is above 75. Call it average.', 'SELECT city, AVG(grade) AS average\nFROM students\nGROUP BY city\nHAVING AVG(grade) > 75;', 'HAVING AVG(grade) > 75', [{ label: 'Uses HAVING AVG', re: 'having\\s+avg' }], 'HAVING can use any summary.', CLASS),
    debug('WHERE cannot use COUNT. Use HAVING after GROUP BY.', 'SELECT category, COUNT(*) AS how_many\nFROM products\nWHERE COUNT(*) > 1\nGROUP BY category;', 'SELECT category, COUNT(*) AS how_many\nFROM products\nGROUP BY category\nHAVING COUNT(*) > 1;', 'Move the rule after GROUP BY and use HAVING.', [{ label: 'Uses HAVING', re: 'having' }], 'WHERE is for rows, HAVING is for groups.', SHOP),
  ],
  'Keys: Linking Tables Together': [
    diy('Show the names of the dogs that belong to owner 2 (their owner_id is 2).', 'SELECT name FROM dogs\nWHERE owner_id = 2;', 'WHERE owner_id = 2', [{ label: 'Uses owner_id', re: 'owner_id\\s*=\\s*2' }], 'The number in owner_id is the link.', OWNERS),
    diy('Add a dog called Max (id 5) that belongs to owner 3. Then show all dogs.', "INSERT INTO dogs (id, name, owner_id)\nVALUES (5, 'Max', 3);\nSELECT * FROM dogs;", 'INSERT INTO dogs (id, name, owner_id) VALUES (5, ...); then SELECT * FROM dogs;', [{ label: 'Inserts into dogs', re: 'insert\\s+into\\s+dogs' }], 'owner_id 3 points to Zed.', OWNERS),
    debug('The dogs table has no column called owner. The link column is owner_id. Fix it.', 'SELECT name FROM dogs\nWHERE owner = 1;', 'SELECT name FROM dogs\nWHERE owner_id = 1;', 'Use owner_id.', [{ label: 'Uses owner_id', re: 'owner_id' }], 'Use the exact column name.', OWNERS),
  ],
  'INNER JOIN': [
    diy('Show each dog together with its owner. The columns must be called dog and owner.', 'SELECT dogs.name AS dog, owners.name AS owner\nFROM dogs\nINNER JOIN owners ON dogs.owner_id = owners.id;', 'JOIN owners ON dogs.owner_id = owners.id', [{ label: 'Uses INNER JOIN', re: 'join\\s+owners\\s+on' }], 'ON says which columns match.', OWNERS),
    diy("Show only the names of Sam's dogs. The column is called dog.", "SELECT d.name AS dog\nFROM owners AS o\nINNER JOIN dogs AS d ON d.owner_id = o.id\nWHERE o.name = 'Sam';", "JOIN first, then WHERE o.name = 'Sam'", [{ label: 'Uses a WHERE after the join', re: "join[\\s\\S]*where" }], 'Join first, filter after.', OWNERS),
    debug('A JOIN needs an ON rule. Add ON dogs.owner_id = owners.id.', 'SELECT dogs.name AS dog, owners.name AS owner\nFROM dogs\nINNER JOIN owners;', 'SELECT dogs.name AS dog, owners.name AS owner\nFROM dogs\nINNER JOIN owners ON dogs.owner_id = owners.id;', 'Add ON ... after the second table.', [{ label: 'Has ON', re: '\\bon\\b' }], 'ON says which rows belong together.', OWNERS),
  ],
  'LEFT JOIN': [
    diy('Show every owner and their dog. Owners without a dog must still show. Call the columns owner and dog, and sort by owner.', 'SELECT o.name AS owner, d.name AS dog\nFROM owners AS o\nLEFT JOIN dogs AS d ON d.owner_id = o.id\nORDER BY o.name;', 'Use LEFT JOIN so no owner is lost.', [{ label: 'Uses LEFT JOIN', re: 'left\\s+join' }], 'LEFT JOIN keeps every row on the left.', OWNERS),
    diy('Show the names of the owners who have no dog. Call the column owner.', 'SELECT o.name AS owner\nFROM owners AS o\nLEFT JOIN dogs AS d ON d.owner_id = o.id\nWHERE d.id IS NULL;', 'LEFT JOIN then WHERE d.id IS NULL', [{ label: 'Uses IS NULL', re: 'is\\s+null' }], 'IS NULL finds the rows with no match.', OWNERS),
    debug('This should list every owner, even Zed who has no dog. An INNER JOIN leaves him out. Fix it.', 'SELECT o.name AS owner, d.name AS dog\nFROM owners AS o\nINNER JOIN dogs AS d ON d.owner_id = o.id\nORDER BY o.name;', 'SELECT o.name AS owner, d.name AS dog\nFROM owners AS o\nLEFT JOIN dogs AS d ON d.owner_id = o.id\nORDER BY o.name;', 'Change INNER JOIN to LEFT JOIN.', [{ label: 'Uses LEFT JOIN', re: 'left\\s+join' }], 'LEFT JOIN never forgets the left side.', OWNERS),
  ],
};
