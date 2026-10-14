// Structures. Every example is a whole program (types, then main), so items use full: true.
const guided = (name, description, steps, code) => ({ name, description, steps, guided: true, full: true, code });
const warn = (name, description, steps, code) => ({ ...guided(name, description, steps, code), warning: true });
const HEAD = '#include <iostream>\n#include <string>\n\nusing namespace std;\n\n';
const lesson = (icon, title, notes, items, tryTitle) => ({
  icon, title,
  content: { heading: title, notes, sectionTitle: 'More parts of this topic', items, tryTitle },
  starter: HEAD + 'int main() {\n  \n  return 0;\n}\n',
});

const defineItems = [
  guided('Draw a blank form', 'A struct is a blank form. Each member is a box on the form. A variable is a new card made from that form.',
    ['struct Student draws a blank form with two boxes: name and age.', 'Student s; makes a card from the form. The boxes are still empty.', 'You fill the boxes one by one and then read them.'],
    `struct Student {
  string name;
  int age;
};

int main() {
  Student s;
  s.name = "Ann";
  s.age = 20;
  cout << s.name << " is " << s.age << endl;
  return 0;
}`),
  guided('Fill the whole form at once', 'Curly braces fill the boxes in the same order as the form.',
    ['The values go into name and then age, in order.', 'Student s = {"Bob", 21}; makes a filled card in one line.', 'You can then read each box.'],
    `struct Student {
  string name;
  int age;
};

int main() {
  Student s = {"Bob", 21};
  cout << s.name << " " << s.age << endl;
  return 0;
}`),
  warn('Forgetting the semicolon', 'A struct definition ends with a semicolon after the closing brace. It is easy to forget.',
    ['The form is drawn, but there is no semicolon after the }.', 'C++ cannot tell where the struct ends, so it stops with an error.', 'Add ; after the closing brace to fix it.'],
    `struct Student {
  string name;
  int age;
}

int main() {
  Student s = {"Ann", 20};
  cout << s.name << endl;
  return 0;
}`),
];
const accessItems = [
  guided('Open one box with a dot', 'Use a dot to reach one box on the card. s.name is the name box. s.age is the age box.',
    ['s.name reads the name box.', 's.age = 21 puts a new value in the age box.', 'The highlighted row on the card shows which box you touched.'],
    `struct Student {
  string name;
  int age;
};

int main() {
  Student s = {"Ann", 20};
  cout << s.name << endl;
  s.age = 21;
  cout << s.age << endl;
  return 0;
}`),
  guided('Reach the card with a pointer', 'A pointer holds the address of a card. With a pointer, use an arrow -> instead of a dot.',
    ['p holds the address of s. The slip says p points here.', 'p->name follows the pointer and reads the name box.', 'p->age = 30 changes the real card.'],
    `struct Student {
  string name;
  int age;
};

int main() {
  Student s = {"Ann", 20};
  Student* p = &s;
  cout << p->name << endl;
  p->age = 30;
  cout << s.age << endl;
  return 0;
}`),
  warn('A dot on a pointer', 'A dot works on a card. An arrow works on a pointer. Mixing them up is a very common mistake.',
    ['p is a pointer, not the card itself.', 'p.name uses a dot, so C++ stops with an error.', 'Use p->name instead.'],
    `struct Student {
  string name;
  int age;
};

int main() {
  Student s = {"Ann", 20};
  Student* p = &s;
  cout << p.name << endl;
  return 0;
}`),
];
const nestedItems = [
  guided('A card inside a card', 'A member can itself be a struct. Here the Person card holds a small Address card.',
    ['Address is a small form with one box: city.', 'Person has a name box and an addr box, which holds an Address card.', 'p.addr.city goes through two dots: first the addr card, then its city box.'],
    `struct Address {
  string city;
};

struct Person {
  string name;
  Address addr;
};

int main() {
  Person p = {"Ann", {"Paris"}};
  cout << p.addr.city << endl;
  return 0;
}`),
  guided('Change the inner card', 'You change a nested box the same way. Follow the dots to the box you want.',
    ['p.addr.city is the city box inside the addr card.', 'Giving it a new value changes only that box.', 'The inner card on the form is highlighted when it changes.'],
    `struct Address {
  string city;
};

struct Person {
  string name;
  Address addr;
};

int main() {
  Person p = {"Ann", {"Paris"}};
  p.addr.city = "Rome";
  cout << p.name << " lives in " << p.addr.city << endl;
  return 0;
}`),
  warn('Defining things in the wrong order', 'C++ reads from the top. A struct must be defined before another struct uses it.',
    ['Person uses Address as a member, but Address is defined below it.', 'When C++ reads Person it does not know Address yet.', 'Move struct Address above struct Person.'],
    `struct Person {
  string name;
  Address addr;
};

struct Address {
  string city;
};

int main() {
  Person p;
  return 0;
}`),
];
const arrayItems = [
  guided('A filing cabinet of cards', 'An array of structs is a filing cabinet. Each drawer holds one card.',
    ['Student cls[3] makes 3 drawers.', 'cls[1] pulls out drawer number 1, the second card.', 'cls[1].name reads the name box on that card.'],
    `struct Student {
  string name;
  int age;
};

int main() {
  Student cls[3] = {{"Ann", 20}, {"Bob", 21}, {"Cy", 19}};
  cout << cls[1].name << endl;
  return 0;
}`),
  guided('Visit every card', 'A loop can open every drawer in turn.',
    ['i goes 0, 1, 2.', 'Each round opens drawer i and reads its name.', 'The cards are printed in order.'],
    `struct Student {
  string name;
  int age;
};

int main() {
  Student cls[3] = {{"Ann", 20}, {"Bob", 21}, {"Cy", 19}};
  for (int i = 0; i < 3; i++) {
    cout << cls[i].name << endl;
  }
  return 0;
}`),
  warn('A drawer that does not exist', 'With 3 drawers the numbers are 0, 1 and 2. Asking for drawer 3 is a bug.',
    ['cls has drawers 0, 1 and 2.', 'cls[3] asks for a drawer that is not there.', 'Change 3 to 2 to fix it.'],
    `struct Student {
  string name;
  int age;
};

int main() {
  Student cls[3] = {{"Ann", 20}, {"Bob", 21}, {"Cy", 19}};
  cout << cls[3].name << endl;
  return 0;
}`),
];
const passItems = [
  guided('Pass a copy', 'By default a function gets a photocopy of the card. It can scribble on its copy, but your card is safe.',
    ['The card a is photocopied and the copy goes to the counter.', 'The function adds 1 to the copy\'s age.', 'The original card is not changed.'],
    `struct P {
  string name;
  int age;
};

void birthday(P p) {
  p.age++;
}

int main() {
  P a = {"Ann", 20};
  birthday(a);
  cout << a.age << endl;
  return 0;
}`),
  guided('Pass the real card', 'Add & and the function gets your real card. Changes stay.',
    ['P& p means p is the real card, not a copy.', 'The real card is handed to the counter.', 'p.age++ changes the original. The age is now 21.'],
    `struct P {
  string name;
  int age;
};

void birthday(P& p) {
  p.age++;
}

int main() {
  P a = {"Ann", 20};
  birthday(a);
  cout << a.age << endl;
  return 0;
}`),
  guided('Pass an address', 'You can also pass a pointer, which is the address of the card. The function follows the address.',
    ['&a makes an address slip for the card.', 'The function receives the slip and follows it with ->.', 'The real card is changed.'],
    `struct P {
  string name;
  int age;
};

void birthday(P* p) {
  p->age++;
}

int main() {
  P a = {"Ann", 20};
  birthday(&a);
  cout << a.age << endl;
  return 0;
}`),
];
const enumItems = [
  guided('A fixed list of names', 'An enum is a dial with named positions. Behind each name is a hidden number, starting at 0.',
    ['Red is 0, Green is 1 and Blue is 2.', 'Color c = Green; turns the dial to Green.', 'Printing c shows the number behind the name: 1.'],
    `enum Color { Red, Green, Blue };

int main() {
  Color c = Green;
  cout << c << endl;
  return 0;
}`),
  guided('enum class keeps names tidy', 'An enum class needs the type name in front, such as Light::Green. It also does not turn into a number by itself.',
    ['Light::Green names the position clearly.', 'You compare it with another Light::Name.', 'To get the number you must ask: static_cast<int>(l).'],
    `enum class Light { Red, Green };

int main() {
  Light l = Light::Green;
  if (l == Light::Green) {
    cout << "go" << endl;
  }
  cout << static_cast<int>(l) << endl;
  return 0;
}`),
  warn('Printing an enum class', 'An enum class is not a number, so cout does not know how to print it.',
    ['l holds Light::Red.', 'cout << l asks cout to print it, but it does not know how.', 'Print static_cast<int>(l) instead.'],
    `enum class Light { Red, Green };

int main() {
  Light l = Light::Red;
  cout << l << endl;
  return 0;
}`),
];
const unionItems = [
  guided('One box, many names', 'A union has one box of memory shared by all its members. Only the last value you stored is really there.',
    ['Data has an int and a float. They share one 4-byte box.', 'd.i = 65 stores 65 as an int in the bytes.', 'sizeof(Data) is 4, not 8, because the box is shared.'],
    `union Data {
  int i;
  float f;
};

int main() {
  Data d;
  d.i = 65;
  cout << d.i << endl;
  cout << sizeof(Data) << endl;
  return 0;
}`),
  guided('Same bytes, different meaning', 'If you store an int and read the float, you read the same bytes in a different way.',
    ['d.i = 1065353216 fills the 4 bytes: 00 00 80 3F.', 'Reading d.f looks at the same bytes as a float.', 'As a float those bytes mean 1.'],
    `union Data {
  int i;
  float f;
};

int main() {
  Data d;
  d.i = 1065353216;
  cout << d.f << endl;
  return 0;
}`),
  warn('Reading before storing', 'A new union has nothing stored in it yet. Reading a member gives you nothing meaningful.',
    ['d is created, but no member was given a value.', 'd.i has nothing to read.', 'Store a value first, such as d.i = 7;'],
    `union Data {
  int i;
  float f;
};

int main() {
  Data d;
  cout << d.i << endl;
  return 0;
}`),
];

export default { id: 'cpp-topic-6', title: 'Structures', image: './environments/cpp/images/structures.png', starter: '', expects: [], lesson: { title: 'Structures', iconPath: './environments/cpp/images/subtopic-icons/structures', subtopics: [
  lesson('🏗️', 'Defining and Using struct Types', {
    definition: 'A **struct** is a type you design yourself. It groups several variables, called **members**, under one name.',
    points: [
      { term: 'In simple words', text: 'A struct is a blank form. Each member is a box on the form. When you make a variable, you get a new card filled in from that form.' },
      { term: 'Real-life example', text: 'A school registration form has boxes for name, age and class. Every student fills in their own copy.' },
      { term: 'Careful', text: 'A struct definition ends with a semicolon after the closing brace.' },
    ],
    code: 'struct Student {\n  string name;\n  int age;\n};\n\nint main() {\n  Student s = {"Ann", 20};\n  cout << s.name << endl;\n  return 0;\n}',
  }, defineItems, 'Type the struct and watch the cards'),
  lesson('🔑', 'Accessing Structure Members', {
    definition: 'You reach a member with the **dot operator** (**.**). With a pointer to a struct you use the **arrow operator** (**->**).',
    points: [
      { term: 'In simple words', text: 'The dot opens one box on a card. The arrow first follows an address to the card, then opens the box.' },
      { term: 'Real-life example', text: 'A dot is like reading a form you hold in your hand. An arrow is like reading a form after following a note that says where it is stored.' },
      { term: 'Remember', text: 'Dot for a normal variable. Arrow for a pointer.' },
    ],
    code: 'Student s = {"Ann", 20};\nStudent* p = &s;\ncout << s.name << endl;   // dot\ncout << p->age << endl;   // arrow',
  }, accessItems, 'Type the code and watch the highlighted box'),
  lesson('🪆', 'Creating Nested Structures', {
    definition: 'A **nested structure** is a struct that has another struct as one of its members.',
    points: [
      { term: 'In simple words', text: 'A card can hold a smaller card in one of its boxes. You reach the inside with more than one dot.' },
      { term: 'Real-life example', text: 'A person file has an address card clipped inside it. To find the city you open the file, then the address card, then read the city.' },
      { term: 'Careful', text: 'Define the inner struct above the outer one.' },
    ],
    code: 'struct Address {\n  string city;\n};\n\nstruct Person {\n  string name;\n  Address addr;\n};\n\nPerson p = {"Ann", {"Paris"}};\ncout << p.addr.city << endl;',
  }, nestedItems, 'Type the structs and watch the nested card'),
  lesson('🗂️', 'Working with Arrays of Structures', {
    definition: 'An **array of structures** is a row of struct variables of the same type, reached by an **index**.',
    points: [
      { term: 'In simple words', text: 'A filing cabinet. Every drawer holds one card of the same form. You pull out a card by its number.' },
      { term: 'Real-life example', text: 'A class register. Each line is one student card. Line 0 is the first student.' },
      { term: 'Careful', text: 'With 3 cards the last index is 2.' },
    ],
    code: 'Student cls[3] = {{"Ann", 20}, {"Bob", 21}, {"Cy", 19}};\ncout << cls[0].name << endl;\ncout << cls[2].age << endl;',
  }, arrayItems, 'Type the code and watch the drawers'),
  lesson('📤', 'Passing Structures to Functions', {
    definition: 'A struct can be given to a function **by value** (a copy), **by reference** (**&**, the real one) or **by pointer** (its address).',
    points: [
      { term: 'In simple words', text: 'By value, the function works on a photocopy. By reference or pointer, it works on your real card.' },
      { term: 'Real-life example', text: 'You can hand a clerk a photocopy of your form, or give them the original to stamp.' },
      { term: 'Good to know', text: 'Big structs are slow to copy. A reference avoids the copy.' },
    ],
    code: 'void birthday(P& p) {\n  p.age++;\n}\n\nint main() {\n  P a = {"Ann", 20};\n  birthday(a);\n  cout << a.age << endl;   // 21\n  return 0;\n}',
  }, passItems, 'Type the function and watch the card travel'),
  lesson('🏷️', 'Enumerations with enum and enum class', {
    definition: 'An **enum** is a type with a fixed list of named values. An **enum class** is a safer version that keeps its names inside the type.',
    points: [
      { term: 'In simple words', text: 'A dial with a few named positions. Each name has a hidden number behind it, starting at 0.' },
      { term: 'Real-life example', text: 'Traffic light states: Red, Yellow, Green. Only these three are allowed.' },
      { term: 'Careful', text: 'An enum class does not turn into a number by itself. Use static_cast<int> when you need the number.' },
    ],
    code: 'enum class Light { Red, Green };\n\nLight l = Light::Green;\nif (l == Light::Green) {\n  cout << "go" << endl;\n}',
  }, enumItems, 'Type the enum and watch the dial'),
  lesson('🔀', 'Memory Sharing with union', {
    definition: 'A **union** is like a struct, but all its members **share the same memory**. Only one value is really stored at a time.',
    points: [
      { term: 'In simple words', text: 'One box of memory with several labels on it. What you stored last is what is in the box. Reading it under another label reads the same bytes in another way.' },
      { term: 'Real-life example', text: 'A single whiteboard that can show either a number or a word. Writing one wipes the other.' },
      { term: 'Good to know', text: 'The size of a union is the size of its biggest member.' },
    ],
    code: 'union Data {\n  int i;\n  float f;\n};\n\nData d;\nd.i = 65;\ncout << d.i << endl;\ncout << sizeof(Data) << endl;   // 4',
  }, unionItems, 'Type the union and watch the shared bytes'),
] } };
