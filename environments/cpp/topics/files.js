// Files. Every example is a whole program. The library has three ready-made files: numbers.txt, names.txt and scores.csv.
const guided = (name, description, steps, code) => ({ name, description, steps, guided: true, full: true, code });
const warn = (name, description, steps, code) => ({ ...guided(name, description, steps, code), warning: true });
const HEAD = '#include <iostream>\n#include <string>\n\nusing namespace std;\n\n';
const lesson = (icon, title, notes, items, tryTitle) => ({
  icon, title,
  content: { heading: title, notes, sectionTitle: 'More parts of this topic', items, tryTitle },
  starter: HEAD + 'int main() {\n  \n  return 0;\n}\n',
});

const includeItems = [
  guided('Open the library door', 'File tools live in a separate header. #include <fstream> opens the library door so you can use them.',
    ['#include <fstream> unlocks ifstream, ofstream and fstream.', 'ofstream out("hello.txt") makes a writer for the file hello.txt.', 'We write one line, close the file and print saved.'],
    `#include <fstream>

int main() {
  ofstream out("hello.txt");
  out << "Hi" << endl;
  out.close();
  cout << "saved" << endl;
  return 0;
}`),
  guided('Three keys', 'ifstream reads, ofstream writes, and fstream can do both. All three come from the same header.',
    ['ofstream writes 42 into n.txt, then we close it.', 'ifstream opens the same file for reading.', 'We read the 42 back into a number and print it.'],
    `#include <fstream>

int main() {
  ofstream out("n.txt");
  out << 42;
  out.close();
  ifstream in("n.txt");
  int v;
  in >> v;
  cout << v << endl;
  return 0;
}`),
  warn('Forgetting the include', 'Without the header, C++ has never heard of ofstream. The library door stays locked.',
    ['The program uses ofstream, but there is no #include <fstream>.', 'C++ does not know the word, so it stops with an error.', 'Add #include <fstream> at the top.'],
    `int main() {
  ofstream out("hello.txt");
  out << "Hi" << endl;
  return 0;
}`),
];
const openItems = [
  guided('Check out a book and return it', 'Opening a file is like checking a book out. Closing it returns the book and saves what you wrote.',
    ['ofstream out("note.txt") checks out the book note.txt.', 'We write a line, then out.close() returns the book.', 'Closing saves anything still waiting in the buffer.'],
    `#include <fstream>

int main() {
  ofstream out("note.txt");
  out << "Hi" << endl;
  out.close();
  cout << "closed" << endl;
  return 0;
}`),
  guided('Did it open?', 'is_open() tells you whether the book was really checked out.',
    ['ifstream in("numbers.txt") opens the ready-made file.', 'in.is_open() is true, so we print open.', 'in.close() puts the book back.'],
    `#include <fstream>

int main() {
  ifstream in("numbers.txt");
  if (in.is_open()) {
    cout << "open" << endl;
  }
  in.close();
  return 0;
}`),
  guided('Reading before closing', 'Text you write waits in a small tray (the buffer). It is only saved to the file when you close it. Reading too early finds an empty page.',
    ['out writes X to the buffer. The tray holds it but the file is still empty.', 'We read the file before closing, so the page is empty.', 'The program prints [] . Add out.close() before reading to fix it.'],
    `#include <fstream>

int main() {
  ofstream out("b.txt");
  out << "X\\n";
  ifstream in("b.txt");
  string s;
  getline(in, s);
  cout << "[" << s << "]" << endl;
  return 0;
}`),
];
const readItems = [
  guided('Read numbers until the end', 'in >> x reads the next number. The loop keeps going until there is nothing left to read.',
    ['numbers.txt holds 10 20 30.', 'while (in >> x) reads one number each round and stops at the end.', 'sum adds them up: 60.'],
    `#include <fstream>

int main() {
  ifstream in("numbers.txt");
  int x;
  int sum = 0;
  while (in >> x) {
    sum += x;
  }
  cout << sum << endl;
  return 0;
}`),
  guided('Read words', 'The same >> works for words. It skips spaces and new lines for you.',
    ['names.txt holds three names, one per line.', 'in >> s reads one name each round.', 'Each name is printed on its own line.'],
    `#include <fstream>

int main() {
  ifstream in("names.txt");
  string s;
  while (in >> s) {
    cout << s << endl;
  }
  return 0;
}`),
  guided('Reading the wrong type', 'If the file has a word but you read into an int, the read fails. The int becomes 0 and the stream is marked as failed.',
    ['We write the word abc into w.txt.', 'in >> x tries to read a whole number, but finds letters.', 'x becomes 0 and in.fail() is true: it prints 0 1.'],
    `#include <fstream>

int main() {
  ofstream o("w.txt");
  o << "abc";
  o.close();
  ifstream in("w.txt");
  int x = 99;
  in >> x;
  cout << x << " " << in.fail() << endl;
  return 0;
}`),
];
const writeItems = [
  guided('Write a line and read it back', 'out << works just like cout <<, but it sends the text to a file. endl moves to the next line and saves the buffer.',
    ['out << "Hello" << endl; puts Hello in the buffer and saves it.', 'We open the file again for reading.', 'getline reads the first line back and we print it.'],
    `#include <fstream>

int main() {
  ofstream out("notes.txt");
  out << "Hello" << endl;
  out << "World" << endl;
  out.close();
  ifstream in("notes.txt");
  string line;
  getline(in, line);
  cout << line << endl;
  return 0;
}`),
  guided('Write numbers with a loop', 'A loop can write many values. Put a space between them so they can be read back one by one.',
    ['The loop writes 1 2 3 into nums.txt.', 'We close the file, then read the numbers back.', 'Their sum is 6.'],
    `#include <fstream>

int main() {
  ofstream out("nums.txt");
  for (int i = 1; i <= 3; i++) {
    out << i << " ";
  }
  out.close();
  ifstream in("nums.txt");
  int x;
  int sum = 0;
  while (in >> x) {
    sum += x;
  }
  cout << sum << endl;
  return 0;
}`),
  guided('A file that cannot open', 'If the file cannot be opened, for example because its folder does not exist, writing quietly does nothing. Always check.',
    ['"bad/x.txt" is in a folder that does not exist.', 'The writer fails to open, and its fail lamp lights.', 'if (!out) catches this and prints failed.'],
    `#include <fstream>

int main() {
  ofstream out("bad/x.txt");
  out << "x";
  if (!out) {
    cout << "failed" << endl;
  }
  return 0;
}`),
];
const modeItems = [
  guided('The default wipes the file', 'Opening an ofstream normally starts with an empty file. Old content is thrown away.',
    ['The first writer saves A.', 'The second writer opens the same file. The old A is wiped.', 'Only B is left.'],
    `#include <fstream>

int main() {
  ofstream a("l.txt");
  a << "A\\n";
  a.close();
  ofstream b("l.txt");
  b << "B\\n";
  b.close();
  ifstream in("l.txt");
  string s;
  while (getline(in, s)) {
    cout << s;
  }
  cout << endl;
  return 0;
}`),
  guided('ios::app adds to the end', 'The append mode keeps the old content and writes after it.',
    ['The first writer saves A.', 'The second writer uses ios::app, so the old A stays.', 'B is added after it. Reading gives A then B.'],
    `#include <fstream>

int main() {
  ofstream a("l.txt");
  a << "A\\n";
  a.close();
  ofstream b("l.txt", ios::app);
  b << "B\\n";
  b.close();
  ifstream in("l.txt");
  string s;
  while (getline(in, s)) {
    cout << s;
  }
  cout << endl;
  return 0;
}`),
  guided('Binary mode stores raw bytes', 'In binary mode a number is saved as its raw bytes instead of as text. The int 258 takes exactly 4 bytes.',
    ['write((char*)&n, sizeof(n)) sends the 4 bytes of n into the file.', 'The book shows the bytes: 02 01 00 00.', 'read puts the 4 bytes back into m. It prints 258.'],
    `#include <fstream>

int main() {
  int n = 258;
  ofstream f("d.bin", ios::binary);
  f.write((char*)&n, sizeof(n));
  f.close();
  ifstream g("d.bin", ios::binary);
  int m = 0;
  g.read((char*)&m, sizeof(m));
  cout << m << endl;
  return 0;
}`),
];
const errorItems = [
  guided('A book that is not there', 'If the file does not exist, the stream fails to open. if (!in) lets you handle that.',
    ['missing.txt is not on the shelf.', 'The fail lamp lights up.', 'if (!in) is true, so we print no file.'],
    `#include <fstream>

int main() {
  ifstream in("missing.txt");
  if (!in) {
    cout << "no file" << endl;
  }
  return 0;
}`),
  guided('The right way to loop', 'while (in >> x) stops as soon as a read fails. Every number is printed once.',
    ['The read happens inside the loop condition.', 'The last read fails, so the loop ends before printing again.', 'You see 10 20 30 once each.'],
    `#include <fstream>

int main() {
  ifstream in("numbers.txt");
  int x;
  while (in >> x) {
    cout << x << " ";
  }
  cout << endl;
  return 0;
}`),
  guided('The eof trap', 'eof() only becomes true after a read has tried to go past the end. A loop that checks eof() first does one read too many.',
    ['After reading 30 the file is not yet "at the end".', 'The loop runs once more. The read fails and x keeps its old value, 30.', '30 is printed twice. Use while (in >> x) instead.'],
    `#include <fstream>

int main() {
  ifstream in("numbers.txt");
  int x;
  while (!in.eof()) {
    in >> x;
    cout << x << " ";
  }
  cout << endl;
  return 0;
}`),
];
const lineItems = [
  guided('One line at a time', 'getline reads a whole line, spaces included. It returns false at the end, so it works as a loop condition.',
    ['names.txt has three lines.', 'getline(in, line) peels one line off the page.', 'We number each line and print it.'],
    `#include <fstream>

int main() {
  ifstream in("names.txt");
  string line;
  int n = 1;
  while (getline(in, line)) {
    cout << n << ": " << line << endl;
    n++;
  }
  return 0;
}`),
  guided('Counting lines', 'Counting lines is just reading them and adding 1 each time.',
    ['count starts at 0.', 'Every successful getline adds 1.', 'names.txt has 3 lines.'],
    `#include <fstream>

int main() {
  ifstream in("names.txt");
  string line;
  int count = 0;
  while (getline(in, line)) {
    count++;
  }
  cout << count << endl;
  return 0;
}`),
  guided('Mixing >> and getline', 'After reading a number with >>, the new line after it is still waiting. The next getline reads that empty rest of the line.',
    ['The file holds 5, a new line, then hello.', 'in >> n reads 5 but leaves the new line behind.', 'getline then reads the empty rest of that line, so it prints []. Call getline twice to skip it.'],
    `#include <fstream>

int main() {
  ofstream o("m.txt");
  o << "5\\nhello\\n";
  o.close();
  ifstream in("m.txt");
  int n;
  string s;
  in >> n;
  getline(in, s);
  cout << "[" << s << "]" << endl;
  return 0;
}`),
];
const csvItems = [
  guided('Cut a line at the comma', 'A CSV line holds values separated by commas. A stringstream lets you cut the line with getline and a comma.',
    ['getline reads the first line of scores.csv: Ann,90.', 'stringstream ss(line) turns the line into a small stream.', 'getline(ss, name, \',\') cuts at the comma. First the name, then the score.'],
    `#include <fstream>
#include <sstream>

int main() {
  ifstream in("scores.csv");
  string line;
  getline(in, line);
  stringstream ss(line);
  string name;
  string score;
  getline(ss, name, ',');
  getline(ss, score, ',');
  cout << name << " scored " << score << endl;
  return 0;
}`),
  guided('Add up a column', 'stoi turns text such as "90" into the number 90. Then you can add the whole column.',
    ['Each line is cut at the comma.', 'stoi(score) turns the score text into a number.', 'The total of 90, 85 and 70 is 245.'],
    `#include <fstream>
#include <sstream>

int main() {
  ifstream in("scores.csv");
  string line;
  int total = 0;
  while (getline(in, line)) {
    stringstream ss(line);
    string name;
    string score;
    getline(ss, name, ',');
    getline(ss, score, ',');
    total += stoi(score);
  }
  cout << total << endl;
  return 0;
}`),
  warn('Turning a name into a number', 'stoi only works on text that looks like a number. A name cannot become a number.',
    ['The first field of each line is the name.', 'stoi("Ann") tries to turn the name into a number.', 'It stops with an error. Use the second field instead.'],
    `#include <fstream>
#include <sstream>

int main() {
  ifstream in("scores.csv");
  string line;
  getline(in, line);
  stringstream ss(line);
  string name;
  getline(ss, name, ',');
  cout << stoi(name) << endl;
  return 0;
}`),
];

export default { id: 'cpp-topic-8', title: 'Files', image: './environments/cpp/images/files.png', starter: '', expects: [], lesson: { title: 'Files', iconPath: './environments/cpp/images/subtopic-icons/files', subtopics: [
  lesson('📚', 'Including the <fstream> Header', {
    definition: 'The **<fstream>** header gives you the tools to work with files: **ifstream** (read), **ofstream** (write) and **fstream** (both).',
    points: [
      { term: 'In simple words', text: 'The library has a locked door. #include <fstream> is the key. Without it C++ has never heard of ifstream or ofstream.' },
      { term: 'Real-life example', text: 'You need a library card before you can borrow a book. The include is your card.' },
      { term: 'Good to know', text: 'String streams such as stringstream need their own header: <sstream>.' },
    ],
    code: '#include <fstream>\n\nint main() {\n  ofstream out("hello.txt");\n  out << "Hi" << endl;\n  out.close();\n  return 0;\n}',
  }, includeItems, 'Type the include and watch the door open'),
  lesson('📂', 'Opening and Closing Files', {
    definition: 'You **open** a file to connect a stream to it, and you **close** it to save your changes and let go of the file.',
    points: [
      { term: 'In simple words', text: 'Opening is checking a book out. Closing is returning it. What you wrote waits in a tray and is saved when the book is returned.' },
      { term: 'Real-life example', text: 'You write a letter, then post it. Until you post it, nobody can read it.' },
      { term: 'Good to know', text: 'A stream closes by itself at the end of its scope, but closing it yourself is clearer.' },
    ],
    code: '#include <fstream>\n\nint main() {\n  ofstream out("note.txt");\n  out << "Hi" << endl;\n  out.close();\n  return 0;\n}',
  }, openItems, 'Type the code and watch the book travel'),
  lesson('📖', 'Reading from Files with ifstream', {
    definition: 'An **ifstream** reads from a file. The **>>** operator reads the next value, just like cin does.',
    points: [
      { term: 'In simple words', text: 'A reading mark moves along the page. Each >> picks up the next word or number and moves the mark forward.' },
      { term: 'Real-life example', text: 'Reading a shopping list with your finger, one item at a time.' },
      { term: 'Good to know', text: 'while (in >> x) keeps reading until there is nothing left.' },
    ],
    code: '#include <fstream>\n\nint main() {\n  ifstream in("numbers.txt");\n  int x;\n  while (in >> x) {\n    cout << x << endl;\n  }\n  return 0;\n}',
  }, readItems, 'Type the code and watch the reading mark'),
  lesson('✍️', 'Writing to Files with ofstream', {
    definition: 'An **ofstream** writes to a file. The **<<** operator sends text to it, just like cout does.',
    points: [
      { term: 'In simple words', text: 'A pen that writes on the page. Your text first waits in a small tray, then lands on the page when saved.' },
      { term: 'Real-life example', text: 'Writing in a notebook. Each << adds more words.' },
      { term: 'Careful', text: 'If the file cannot open, writing quietly does nothing. Check with if (!out).' },
    ],
    code: '#include <fstream>\n\nint main() {\n  ofstream out("notes.txt");\n  out << "Hello" << endl;\n  out << "World" << endl;\n  return 0;\n}',
  }, writeItems, 'Type the code and watch the pen write'),
  lesson('⚙️', 'File Modes: Append and Binary', {
    definition: 'A **file mode** says how to open a file. **ios::app** adds to the end, **ios::trunc** wipes the old content, and **ios::binary** stores raw bytes.',
    points: [
      { term: 'In simple words', text: 'The same book can be opened in different ways: start a fresh page, add to the end, or store raw machine bytes.' },
      { term: 'Real-life example', text: 'A diary: you can tear out the pages and start over, or just keep writing after your last entry.' },
      { term: 'Careful', text: 'A plain ofstream wipes the file. Use ios::app when you want to keep what is there.' },
    ],
    code: '#include <fstream>\n\nint main() {\n  ofstream out("log.txt", ios::app);\n  out << "new line" << endl;\n  return 0;\n}',
  }, modeItems, 'Type the code and watch the modes'),
  lesson('🚨', 'Checking for File Errors and EOF', {
    definition: 'A stream keeps status flags: **fail** (something went wrong), **eof** (the end of the file was reached) and **good** (all fine).',
    points: [
      { term: 'In simple words', text: 'The desk has little lamps: open, good, eof and fail. You can look at them to see what happened.' },
      { term: 'Real-life example', text: 'A printer with warning lights: out of paper, jam, ready.' },
      { term: 'Careful', text: 'Do not loop with while (!in.eof()). Use while (in >> x) instead.' },
    ],
    code: '#include <fstream>\n\nint main() {\n  ifstream in("missing.txt");\n  if (!in) {\n    cout << "no file" << endl;\n  }\n  return 0;\n}',
  }, errorItems, 'Type the code and watch the lamps'),
  lesson('📏', 'Reading Text Files Line by Line', {
    definition: '**getline(file, text)** reads a whole line, spaces included, into a string. It returns false at the end of the file.',
    points: [
      { term: 'In simple words', text: 'Peel one line off the page at a time and put it into a string.' },
      { term: 'Real-life example', text: 'Reading a poem line by line.' },
      { term: 'Careful', text: 'After >> a new line is left behind, so the next getline may read an empty line.' },
    ],
    code: '#include <fstream>\n\nint main() {\n  ifstream in("names.txt");\n  string line;\n  while (getline(in, line)) {\n    cout << line << endl;\n  }\n  return 0;\n}',
  }, lineItems, 'Type the code and watch the lines peel off'),
  lesson('📊', 'Working with CSV and Text Data', {
    definition: 'A **CSV** file stores a table as text. Each line is a row and the values are separated by **commas**. A **stringstream** can cut a line apart.',
    points: [
      { term: 'In simple words', text: 'A spreadsheet saved as plain text. You read a line, cut it at the commas, and turn the pieces into numbers with stoi.' },
      { term: 'Real-life example', text: 'A class mark list: Ann,90 on one line, Bob,85 on the next.' },
      { term: 'Careful', text: 'stoi only works on text that looks like a number.' },
    ],
    code: '#include <fstream>\n#include <sstream>\n\nint main() {\n  ifstream in("scores.csv");\n  string line;\n  getline(in, line);\n  stringstream ss(line);\n  string name;\n  getline(ss, name, \',\');\n  cout << name << endl;\n  return 0;\n}',
  }, csvItems, 'Type the code and watch the table fill'),
] } };
