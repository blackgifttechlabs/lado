// Shared helpers and ready-made tables for the SQL lessons. A "setup" is built silently before the learner types.
export const guided = (name, description, steps, code, setup) => ({ name, description, steps, guided: true, full: true, code, ...(setup ? { setup } : {}) });
export const warn = (name, description, steps, code, setup) => ({ ...guided(name, description, steps, code, setup), warning: true });
export const lesson = (icon, title, notes, items, tryTitle) => ({
  icon, title, lang: 'sql',
  content: { heading: title, notes, sectionTitle: 'More parts of this topic', items, tryTitle },
  starter: '-- YOUR TURN: type below\n',
});
export const PETS = `CREATE TABLE pets (id INTEGER PRIMARY KEY, name TEXT NOT NULL, kind TEXT, age INTEGER);
INSERT INTO pets (name, kind, age) VALUES ('Rex', 'dog', 3), ('Tom', 'cat', 5), ('Ann', 'dog', 2), ('Bo', 'bird', 1);`;
export const PETS_EMPTY = `CREATE TABLE pets (id INTEGER PRIMARY KEY, name TEXT NOT NULL, kind TEXT, age INTEGER);`;
export const SHOP = `CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, category TEXT, price REAL, stock INTEGER);
INSERT INTO products (name, category, price, stock) VALUES ('Pen', 'office', 1.5, 100), ('Book', 'school', 12, 30), ('Bag', 'school', 25, 8), ('Lamp', 'home', 18.5, 15), ('Mug', 'home', 6, 0);`;
export const CLASS = `CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT NOT NULL, grade INTEGER, city TEXT);
INSERT INTO students (name, grade, city) VALUES ('Amy', 82, 'Harare'), ('Ben', 67, 'Bulawayo'), ('Cara', 91, 'Harare'), ('Dan', 55, 'Mutare'), ('Eve', 74, 'Bulawayo');`;
export const OWNERS = `CREATE TABLE owners (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE dogs (id INTEGER PRIMARY KEY, name TEXT, owner_id INTEGER REFERENCES owners(id));
INSERT INTO owners VALUES (1, 'Sam'), (2, 'Lee'), (3, 'Zed');
INSERT INTO dogs VALUES (1, 'Rex', 1), (2, 'Bo', 1), (3, 'Ann', 2), (4, 'Stray', NULL);`;
