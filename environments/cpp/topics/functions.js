// Functions. Every example is a whole program (functions plus main), so items use full: true.
const guided = (name, description, steps, code) => ({ name, description, steps, guided: true, full: true, code });
const warn = (name, description, steps, code) => ({ ...guided(name, description, steps, code), warning: true });
const HEAD = '#include <iostream>\n#include <string>\n\nusing namespace std;\n\n';
const lesson = (icon, title, notes, sectionTitle, items, tryTitle) => ({
  icon, title,
  content: { heading: title, notes, sectionTitle, items, tryTitle },
  starter: HEAD + 'int main() {\n  \n  return 0;\n}\n',
});

const declItems = [
  guided('A function is a small machine', 'You build the machine once. Then you press its start button whenever you need it. Building does not run it.',
    ['The word void means the machine gives nothing back.', 'void sayHi() builds a machine called sayHi. Nothing prints yet.', 'sayHi(); inside main presses the start button. Now Hi! is printed.'],
    `void sayHi() {
  cout << "Hi!" << endl;
}

int main() {
  sayHi();
  return 0;
}`),
  guided('Announce it first', 'A declaration (also called a prototype) is a blueprint. It tells C++ the machine will exist later. The real machine is built below main.',
    ['The first line is the blueprint. It has no body, only a semicolon.', 'main can now use add, because C++ knows it is coming.', 'The definition below main is the real machine. It is built and it works.'],
    `int add(int a, int b);

int main() {
  cout << add(2, 3) << endl;
  return 0;
}

int add(int a, int b) {
  return a + b;
}`),
  warn('Calling too early', 'C++ reads from top to bottom. If main calls a machine that is built later and was never announced, C++ does not know it yet.',
    ['main calls add before add exists.', 'The scene has no machine to send the numbers to, so you get an error.', 'Fix it by adding the blueprint int add(int a, int b); above main.'],
    `int main() {
  cout << add(2, 3) << endl;
  return 0;
}

int add(int a, int b) {
  return a + b;
}`),
];
const paramItems = [
  guided('Two inputs, one answer', 'Inputs go into labelled ports on top of the machine. The answer comes out of the tray. The word before the name says what kind of answer it is.',
    ['int add(int a, int b) has two ports: a and b.', 'add(2, 3) sends the value 2 into a and 3 into b.', 'return a + b; puts the answer 5 in the tray. It goes into r.'],
    `int add(int a, int b) {
  return a + b;
}

int main() {
  int r = add(2, 3);
  cout << r << endl;
  return 0;
}`),
  guided('A machine with no answer', 'A void function does its job but gives nothing back. It has no tray, so you cannot store its result.',
    ['greet takes one input called name.', 'It prints a message. There is no return line.', 'In the scene the machine has no tray. It shows the word void.'],
    `void greet(string name) {
  cout << "Hello " << name << endl;
}

int main() {
  greet("Sam");
  return 0;
}`),
  warn('Forgetting to return', 'A function that promises an int must give an int back. If you forget the return line, the tray stays empty.',
    ['triple promises to give back an int.', 'The body works out r but never returns it.', 'Add return r; at the end to fix it.'],
    `int triple(int x) {
  int r = x * 3;
}

int main() {
  cout << triple(2) << endl;
  return 0;
}`),
];
const passItems = [
  guided('Pass by value: a copy goes in', 'By default the function gets a copy. It can change its copy, but your own variable stays the same.',
    ['n is 1. inc(n) sends a copy of n into the machine.', 'The copy becomes 2 inside. Then it is thrown away.', 'n is still 1.'],
    `void inc(int x) {
  x++;
}

int main() {
  int n = 1;
  inc(n);
  cout << n << endl;
  return 0;
}`),
  guided('Pass by reference: the real one goes in', 'Add & after the type. Now the function gets your own variable, not a copy. Changes stay after the call.',
    ['int& x means x is another name for the caller\'s variable.', 'In the scene the real n crate is lifted into the machine.', 'x++ changes n itself. n is 2 after the call.'],
    `void inc(int& x) {
  x++;
}

int main() {
  int n = 1;
  inc(n);
  cout << n << endl;
  return 0;
}`),
  guided('Pass by pointer: an address goes in', 'A pointer is an address card. It says where the variable lives. The function follows the card to change the real thing.',
    ['&n makes an address card for n.', 'The function gets the card. A line joins the machine to the real n crate.', '*p = *p + 1 follows the card and changes n. n is 2.'],
    `void inc(int* p) {
  *p = *p + 1;
}

int main() {
  int n = 1;
  inc(&n);
  cout << n << endl;
  return 0;
}`),
];
const defaultItems = [
  guided('A part that is already loaded', 'A default argument is a value the machine already has. If you give nothing, the default is used.',
    ['power(int b, int e = 2) has a ready-made part for e. It is the dim block in the port.', 'power(3) gives only b. The machine uses e = 2.', '3 times 3 is 9.'],
    `int power(int b, int e = 2) {
  int r = 1;
  for (int i = 0; i < e; i++) {
    r *= b;
  }
  return r;
}

int main() {
  cout << power(3) << endl;
  return 0;
}`),
  guided('Replace the default', 'If you give a value, it replaces the default part.',
    ['power(2, 3) gives both values.', 'The block 3 lands on top of the default block and replaces it.', '2 times 2 times 2 is 8.'],
    `int power(int b, int e = 2) {
  int r = 1;
  for (int i = 0; i < e; i++) {
    r *= b;
  }
  return r;
}

int main() {
  cout << power(2, 3) << endl;
  return 0;
}`),
  warn('Defaults go last', 'Parameters with a default must come after the ones without. Otherwise C++ cannot tell which value is for which port.',
    ['mul has a default on the first parameter but not on the second.', 'C++ stops with an error.', 'Move the default to the end: int mul(int a, int b = 2).'],
    `int mul(int a = 2, int b) {
  return a * b;
}

int main() {
  cout << mul(3) << endl;
  return 0;
}`),
];
const overloadItems = [
  guided('Same name, different inputs', 'You may build several machines with the same name if their inputs are different. C++ picks the right one for each call.',
    ['There are two machines called area. One takes a double. One takes two ints.', 'area(2, 5) has two ints, so the machine on the right lights up. The other one dims.', 'The answer is 10.'],
    `double area(double r) {
  return r * r * 3;
}

int area(int w, int h) {
  return w * h;
}

int main() {
  int a = area(2, 5);
  cout << a << endl;
  return 0;
}`),
  guided('Overloading by type', 'The kind of value also decides. A number goes to one machine and text goes to the other.',
    ['show(7) sends an int. The int machine is chosen.', 'show("hi") sends text. The string machine is chosen.', 'Each machine prints in its own way.'],
    `void show(int n) {
  cout << "number " << n << endl;
}

void show(string s) {
  cout << "text " << s << endl;
}

int main() {
  show(7);
  show("hi");
  return 0;
}`),
  warn('An unclear call', 'If two machines fit equally well, C++ cannot choose. The call is ambiguous and you get an error.',
    ['f(1, 2) could go to f(int, double) or to f(double, int).', 'Both need one conversion, so neither wins.', 'Make one value exact, for example f(1, 2.0).'],
    `void f(int a, double b) {
  cout << "first" << endl;
}

void f(double a, int b) {
  cout << "second" << endl;
}

int main() {
  f(1, 2);
  return 0;
}`),
];
const inlineItems = [
  guided('Paste the body in place', 'inline asks C++ to paste the machine\'s body right where it is called. There is no trip to a separate machine.',
    ['inline int sq(int x) is a very small machine.', 'In the scene the machine slides over to the call site and does its work there.', 'sq(4) gives 16. Then the machine goes back.'],
    `inline int sq(int x) {
  return x * x;
}

int main() {
  int r = sq(4);
  cout << r << endl;
  return 0;
}`),
  guided('A tiny helper used often', 'inline is best for tiny functions that are called many times.',
    ['isEven is one short line.', 'It is called twice. Each call is pasted in place.', 'isEven(4) is true (1). isEven(5) is false (0).'],
    `inline bool isEven(int n) {
  return n % 2 == 0;
}

int main() {
  cout << isEven(4) << endl;
  cout << isEven(5) << endl;
  return 0;
}`),
  guided('Inline inside a loop', 'Inside a loop the same tiny function runs again and again, so pasting it in saves many trips.',
    ['The loop calls sq three times.', 'Each call gives 1, 4 and 9.', 'inline is only a polite request. The compiler may ignore it.'],
    `inline int sq(int x) {
  return x * x;
}

int main() {
  for (int i = 1; i <= 3; i++) {
    cout << sq(i) << endl;
  }
  return 0;
}`),
];
const recursionItems = [
  guided('A function that calls itself', 'Each call puts a new plate on a stack. The last plate gets its answer first. The answers then fall back down.',
    ['fact(3) puts a plate on the stack. It needs fact(2), so another plate goes on.', 'fact(1) is the base case. It returns 1 and stops the calls.', 'The plates pop off one by one: 1, then 2, then 6.'],
    `int fact(int n) {
  if (n <= 1) {
    return 1;
  }
  return n * fact(n - 1);
}

int main() {
  cout << fact(3) << endl;
  return 0;
}`),
  guided('Counting down', 'A recursive function can also print as it goes. It stops at the base case.',
    ['countdown(3) prints 3 and calls countdown(2).', 'It prints 2, then 1.', 'countdown(0) is the base case. It prints Go! and stops.'],
    `void countdown(int n) {
  if (n == 0) {
    cout << "Go!" << endl;
    return;
  }
  cout << n << endl;
  countdown(n - 1);
}

int main() {
  countdown(3);
  return 0;
}`),
  warn('No base case', 'Without a base case the function never stops calling itself. The stack grows until it overflows.',
    ['f calls f(n + 1) forever.', 'The plates pile up until C++ stops the program.', 'A recursive function always needs an if that returns without calling itself.'],
    `int f(int n) {
  return f(n + 1);
}

int main() {
  cout << f(1) << endl;
  return 0;
}`),
];
const lambdaItems = [
  guided('A machine with no name', 'A lambda is a tiny machine you write on the spot. You can keep it in a variable and call it like a function.',
    ['[](int x) { ... } builds a small machine. The square brackets are for captures.', 'auto dbl = ... stores the machine in dbl.', 'dbl(4) sends 4 in and 8 comes out.'],
    `int main() {
  auto dbl = [](int x) {
    return x * 2;
  };
  cout << dbl(4) << endl;
  return 0;
}`),
  guided('Capture by value: a copy in the pouch', 'A lambda can carry outside variables in its pouch. [bonus] puts a copy of bonus in the pouch.',
    ['bonus is 5 outside.', 'The pouch holds a copy of bonus.', 'addBonus(10) gives 10 + 5 = 15.'],
    `int main() {
  int bonus = 5;
  auto addBonus = [bonus](int x) {
    return x + bonus;
  };
  cout << addBonus(10) << endl;
  return 0;
}`),
  guided('Capture by reference: a link to the real one', '[&count] does not copy. It links to the real variable, so the lambda can change it.',
    ['count starts at 0.', 'inc captures count by reference. It holds a link, not a copy.', 'Calling inc twice makes the real count 2.'],
    `int main() {
  int count = 0;
  auto inc = [&count]() {
    count++;
  };
  inc();
  inc();
  cout << count << endl;
  return 0;
}`),
];
const pointerItems = [
  guided('A dial that points to a function', 'A function pointer is a dial. It points at one machine. Calling the dial calls the machine it points to.',
    ['int (*op)(int, int) is a dial that can point to any function with two ints.', 'op = add turns the dial to add.', 'op(5, 2) goes to add and gives 7.'],
    `int add(int a, int b) {
  return a + b;
}

int main() {
  int (*op)(int, int) = add;
  cout << op(5, 2) << endl;
  return 0;
}`),
  guided('Turn the dial', 'You can turn the dial to another function at any time. The same call then does something else.',
    ['op points to add first. op(5, 2) gives 7.', 'op = sub turns the dial to sub.', 'The same op(5, 2) now gives 3.'],
    `int add(int a, int b) {
  return a + b;
}

int sub(int a, int b) {
  return a - b;
}

int main() {
  int (*op)(int, int) = add;
  cout << op(5, 2) << endl;
  op = sub;
  cout << op(5, 2) << endl;
  return 0;
}`),
  guided('Hand a function to another function', 'You can pass a function as a value. The receiving function calls it for you.',
    ['apply takes a function f and two numbers.', 'apply(add, 3, 4) hands the add machine over.', 'apply calls f(3, 4), so the answer is 7.'],
    `int add(int a, int b) {
  return a + b;
}

int apply(int (*f)(int, int), int x, int y) {
  return f(x, y);
}

int main() {
  cout << apply(add, 3, 4) << endl;
  return 0;
}`),
];

export default { id: 'cpp-topic-5', title: 'Functions', image: './environments/cpp/images/functions.png', starter: '', expects: [], lesson: { title: 'Functions', iconPath: './environments/cpp/images/subtopic-icons/functions', subtopics: [
  lesson('📣', 'Function Declaration, Definition, and Calling', {
    definition: 'A **function** is a named block of code you can run again and again. To **declare** it you announce it. To **define** it you write its body. To **call** it you run it.',
    points: [
      { term: 'In simple words', text: 'A function is a small machine. You build it once, give it a name, and press its start button whenever you need it.' },
      { term: 'Real-life example', text: 'A kettle. You build it once. Each time you press the button, it does the same job.' },
      { term: 'Remember', text: 'C++ reads from top to bottom. A function must be declared or defined before the line that calls it.' },
    ],
    code: 'void sayHi() {\n  cout << "Hi!" << endl;\n}\n\nint main() {\n  sayHi();\n  return 0;\n}',
  }, 'More parts of this topic', declItems, 'Type the function and watch the machine appear'),
  lesson('↔️', 'Function Parameters and Return Values', {
    definition: '**Parameters** are the inputs a function receives. A **return value** is the answer it gives back with the word **return**.',
    points: [
      { term: 'In simple words', text: 'Inputs go into labelled ports on the machine. The answer comes out of the tray. If the machine gives no answer, we write void.' },
      { term: 'Real-life example', text: 'A coffee machine. You put in water and a coffee pod (inputs). A cup of coffee comes out (the answer).' },
      { term: 'Careful', text: 'If the function promises an answer, such as int, it must return one.' },
    ],
    code: 'int add(int a, int b) {\n  return a + b;\n}\n\nint main() {\n  cout << add(2, 3) << endl;\n  return 0;\n}',
  }, 'More parts of this topic', paramItems, 'Type the function and watch values go in and out'),
  lesson('📨', 'Pass by Value, Reference, and Pointer', {
    definition: 'There are three ways to give a variable to a function. **By value** sends a copy. **By reference** (**&**) sends the real variable. **By pointer** (*****) sends its address.',
    points: [
      { term: 'In simple words', text: 'Value is a photocopy: the original never changes. Reference hands over the real thing. Pointer hands over an address card that leads to the real thing.' },
      { term: 'Real-life example', text: 'You can give a friend a photocopy of your notes, lend them your real notebook, or give them the address of your house.' },
      { term: 'Good to know', text: 'Use a reference or a pointer when the function must change your variable.' },
    ],
    code: 'void inc(int& x) {\n  x++;\n}\n\nint main() {\n  int n = 1;\n  inc(n);\n  cout << n << endl;   // 2\n  return 0;\n}',
  }, 'More parts of this topic', passItems, 'Type the function and watch what travels'),
  lesson('⚙️', 'Functions with Default Arguments', {
    definition: 'A **default argument** is a value a parameter already has. If the caller gives no value, the **default** is used.',
    points: [
      { term: 'In simple words', text: 'The machine has a part already loaded in one of its ports. If you do not give a part, it uses the loaded one.' },
      { term: 'Real-life example', text: 'A pizza shop. If you do not choose a size, they give you a medium.' },
      { term: 'Careful', text: 'Parameters with defaults must come last in the list.' },
    ],
    code: 'int power(int b, int e = 2) {\n  int r = 1;\n  for (int i = 0; i < e; i++) {\n    r *= b;\n  }\n  return r;\n}\n\nint main() {\n  cout << power(3) << endl;      // 9\n  cout << power(2, 3) << endl;   // 8\n  return 0;\n}',
  }, 'More parts of this topic', defaultItems, 'Type the function and watch the default part'),
  lesson('🧬', 'Function Overloading', {
    definition: '**Function overloading** means several functions share one name but have different **parameters**. C++ picks the best match for each call.',
    points: [
      { term: 'In simple words', text: 'Several machines have the same name. Each one takes different inputs. C++ sends your values to the machine that fits.' },
      { term: 'Real-life example', text: 'The word "open". You open a door, open a jar, and open a file. The action is different but the word is the same.' },
      { term: 'Careful', text: 'If two machines fit equally well, the call is ambiguous and C++ shows an error.' },
    ],
    code: 'int area(int w, int h) {\n  return w * h;\n}\n\ndouble area(double r) {\n  return r * r * 3;\n}\n\nint main() {\n  cout << area(2, 5) << endl;\n  return 0;\n}',
  }, 'More parts of this topic', overloadItems, 'Type the functions and watch the sorting'),
  lesson('⚡', 'Inline Functions', {
    definition: 'An **inline function** is a function that C++ may paste directly into the place where it is called, instead of jumping to it.',
    points: [
      { term: 'In simple words', text: 'The machine does its job right at the call site. There is no trip to a separate place.' },
      { term: 'Real-life example', text: 'Instead of walking to the kitchen to cut one slice of bread, you cut it right on your table.' },
      { term: 'Good to know', text: 'Use inline for tiny functions called often. It is only a request, the compiler decides.' },
    ],
    code: 'inline int sq(int x) {\n  return x * x;\n}\n\nint main() {\n  cout << sq(4) << endl;\n  return 0;\n}',
  }, 'More parts of this topic', inlineItems, 'Type the function and watch it paste in'),
  lesson('🔁', 'Recursive Functions', {
    definition: 'A **recursive function** calls itself. It needs a **base case**, a situation where it stops calling itself and returns an answer.',
    points: [
      { term: 'In simple words', text: 'Every call puts a new plate on a stack. When the base case is reached, the plates come off one by one and the answers fall back down.' },
      { term: 'Real-life example', text: 'Russian nesting dolls. You open one doll and find a smaller one, until you reach the smallest doll that has nothing inside.' },
      { term: 'Careful', text: 'No base case means the calls never stop and the stack overflows.' },
    ],
    code: 'int fact(int n) {\n  if (n <= 1) {\n    return 1;\n  }\n  return n * fact(n - 1);\n}\n\nint main() {\n  cout << fact(3) << endl;   // 6\n  return 0;\n}',
  }, 'More parts of this topic', recursionItems, 'Type the function and watch the stack'),
  lesson('λ', 'Lambda Expressions', {
    definition: 'A **lambda** is a small function without a name that you write where you need it. The **capture list** [ ] says which outside variables it may use.',
    points: [
      { term: 'In simple words', text: 'A pocket-sized machine with a pouch. The pouch carries outside variables inside, either as copies or as links to the real ones.' },
      { term: 'Real-life example', text: 'A sticky-note instruction you write quickly and carry in your pocket, such as "add 5 to whatever number I give you".' },
      { term: 'Careful', text: 'A lambda that captures by copy cannot change that copy. Use & to capture by reference.' },
    ],
    code: 'int main() {\n  int bonus = 5;\n  auto addBonus = [bonus](int x) {\n    return x + bonus;\n  };\n  cout << addBonus(10) << endl;   // 15\n  return 0;\n}',
  }, 'More parts of this topic', lambdaItems, 'Type the lambda and watch the pouch'),
  lesson('👉', 'Function Pointers', {
    definition: 'A **function pointer** is a variable that holds a function. You can call the function through the pointer.',
    points: [
      { term: 'In simple words', text: 'A dial on a control panel. You turn it to one machine, and pressing the button runs that machine.' },
      { term: 'Real-life example', text: 'A TV remote that has one button for "play". It plays whichever video you picked earlier.' },
      { term: 'Good to know', text: 'You can also hand a function to another function, so it can call it for you.' },
    ],
    code: 'int add(int a, int b) {\n  return a + b;\n}\n\nint main() {\n  int (*op)(int, int) = add;\n  cout << op(5, 2) << endl;   // 7\n  return 0;\n}',
  }, 'More parts of this topic', pointerItems, 'Type the pointer and watch the dial'),
] } };
