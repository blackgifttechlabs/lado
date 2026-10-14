// Classes. Every example is a whole program (classes, then main), so items use full: true.
const guided = (name, description, steps, code) => ({ name, description, steps, guided: true, full: true, code });
const warn = (name, description, steps, code) => ({ ...guided(name, description, steps, code), warning: true });
const HEAD = '#include <iostream>\n#include <string>\n\nusing namespace std;\n\n';
const lesson = (icon, title, notes, items, tryTitle) => ({
  icon, title,
  content: { heading: title, notes, sectionTitle: 'More parts of this topic', items, tryTitle },
  starter: HEAD + 'int main() {\n  \n  return 0;\n}\n',
});

const memberItems = [
  guided('A plan with data and actions', 'A class is a plan for a house. Data members are the rooms. Methods are the things the house can do. Each object is a real house built from the plan.',
    ['class Car is the plan. It has one data member, speed, and one method, accelerate.', 'Car c; builds a house from the plan.', 'c.accelerate() makes the house do its action and change its own speed.'],
    `class Car {
public:
  int speed;
  void accelerate() {
    speed += 10;
  }
};

int main() {
  Car c;
  c.speed = 0;
  c.accelerate();
  cout << c.speed << endl;
  return 0;
}`),
  guided('Two houses, two sets of data', 'Every object has its own copy of the data members. Changing one house does not change the other.',
    ['a and b are two houses built from the same plan.', 'a.speed and b.speed are different rooms in different houses.', 'Each one prints its own number.'],
    `class Car {
public:
  int speed;
};

int main() {
  Car a;
  Car b;
  a.speed = 10;
  b.speed = 50;
  cout << a.speed << " " << b.speed << endl;
  return 0;
}`),
  warn('A plan cannot act', 'A method works on an object, not on the plan itself. You need a house first.',
    ['Car::accelerate() tries to use the plan directly.', 'There is no house, so there is no speed to change.', 'Build a Car c; and call c.accelerate() instead.'],
    `class Car {
public:
  int speed;
  void accelerate() {
    speed += 10;
  }
};

int main() {
  Car::accelerate();
  return 0;
}`),
];
const accessItems = [
  guided('Public door, private rooms', 'public members are on the street: anyone can use them. private members are inside the house: only the house itself can use them.',
    ['balance is private, so it is red with a lock on the plan.', 'get() is public. It is the front door.', 'main uses the front door to read the balance. It never touches the room itself.'],
    `class Account {
private:
  int balance;
public:
  Account() {
    balance = 100;
  }
  int get() {
    return balance;
  }
};

int main() {
  Account a;
  cout << a.get() << endl;
  return 0;
}`),
  guided('protected is for the family', 'protected members are hidden from the street, but children of the class can use them.',
    ['id is protected in Base.', 'Child comes from Base, so Child\'s methods can read id.', 'main still cannot touch id directly.'],
    `class Base {
protected:
  int id;
public:
  Base() {
    id = 7;
  }
};

class Child : public Base {
public:
  int show() {
    return id;
  }
};

int main() {
  Child c;
  cout << c.show() << endl;
  return 0;
}`),
  warn('Knocking on a private room', 'Code outside the class is not allowed to reach private members. C++ stops it.',
    ['balance is private.', 'a.balance in main tries to walk into the room from the street.', 'Use a public method such as get() instead.'],
    `class Account {
private:
  int balance;
public:
  Account() {
    balance = 100;
  }
};

int main() {
  Account a;
  cout << a.balance << endl;
  return 0;
}`),
];
const ctorItems = [
  guided('A builder that sets things up', 'A constructor runs automatically when the object is built. It has the same name as the class and no return type.',
    ['Pet(string n) is the constructor. It takes a name.', 'Pet p("Rex") builds the house and runs the builder with "Rex".', 'The builder stores the name and prints a message.'],
    `class Pet {
  string name;
public:
  Pet(string n) {
    name = n;
    cout << "made " << name << endl;
  }
};

int main() {
  Pet p("Rex");
  return 0;
}`),
  guided('A demolition crew at the end', 'A destructor runs automatically when the object goes out of scope. Its name is a tilde and the class name.',
    ['Door d is built inside the curly braces. The constructor prints open.', 'At the closing brace the house is taken apart. The destructor prints closed.', 'Then the program goes on and prints end.'],
    `class Door {
public:
  Door() {
    cout << "open" << endl;
  }
  ~Door() {
    cout << "closed" << endl;
  }
};

int main() {
  {
    Door d;
  }
  cout << "end" << endl;
  return 0;
}`),
  warn('No builder fits', 'If a class has a constructor that needs a value, you must give that value when you build the object.',
    ['Pet has only one constructor, and it needs a name.', 'Pet p; gives no name, so no builder fits.', 'Write Pet p("Rex"); to fix it.'],
    `class Pet {
  string name;
public:
  Pet(string n) {
    name = n;
  }
};

int main() {
  Pet p;
  return 0;
}`),
];
const thisItems = [
  guided('this points at the house itself', 'Inside a method, this is an arrow that points at the object that called it. this->x means "my own x".',
    ['The parameter and the member are both called x.', 'this->x is the member. x alone is the parameter.', 'So this->x = x copies the parameter into the house.'],
    `class P {
  int x;
public:
  P(int x) {
    this->x = x;
  }
  int get() {
    return x;
  }
};

int main() {
  P p(5);
  cout << p.get() << endl;
  return 0;
}`),
  guided('Chaining calls', 'A method can return *this, which means "give back the same object". Then you can call another method right away.',
    ['add returns Counter&, a reference to the same house.', 'c.add(1) changes n and hands back c, so .add(2) works on the same house.', 'Three adds in a row give 1 + 2 + 3 = 6.'],
    `class Counter {
  int n;
public:
  Counter() {
    n = 0;
  }
  Counter& add(int d) {
    n += d;
    return *this;
  }
  int get() {
    return n;
  }
};

int main() {
  Counter c;
  c.add(1).add(2).add(3);
  cout << c.get() << endl;
  return 0;
}`),
  warn('The parameter hides the member', 'If a parameter has the same name as a member, the plain name means the parameter. Without this-> nothing reaches the member.',
    ['x = x copies the parameter into itself.', 'The member x never gets a value.', 'Reading it later stops with an error. Write this->x = x.'],
    `class P {
  int x;
public:
  P(int x) {
    x = x;
  }
  int get() {
    return x;
  }
};

int main() {
  P p(5);
  cout << p.get() << endl;
  return 0;
}`),
];
const staticItems = [
  guided('One sign shared by every house', 'A static member belongs to the class, not to any one object. All houses share the same one, like a sign on the street.',
    ['count is static, so there is one count for every Counter.', 'Every constructor adds 1 to the shared count.', 'After two objects the street sign says 2.'],
    `class Counter {
public:
  static int count;
  Counter() {
    count++;
  }
};

int Counter::count = 0;

int main() {
  Counter a;
  Counter b;
  cout << Counter::count << endl;
  return 0;
}`),
  guided('A static method', 'A static method also belongs to the class. You call it with the class name and it can use the shared data.',
    ['total() is static, so it needs no object.', 'Counter::total() reads the shared count.', 'One object was made, so it prints 1.'],
    `class Counter {
public:
  static int count;
  Counter() {
    count++;
  }
  static int total() {
    return count;
  }
};

int Counter::count = 0;

int main() {
  Counter a;
  cout << Counter::total() << endl;
  return 0;
}`),
  warn('A sign that was never painted', 'Declaring a static member inside the class is not enough. You must also define it once, below the class.',
    ['count is declared as static inside the class.', 'There is no line int Counter::count = 0; below the class.', 'Add that line to give it a starting value.'],
    `class Counter {
public:
  static int count;
  Counter() {
    count++;
  }
};

int main() {
  Counter a;
  cout << Counter::count << endl;
  return 0;
}`),
];
const encapItems = [
  guided('A front desk that checks', 'Keep data private and let outside code use public methods. The methods can check every request.',
    ['bal is private. Nobody can set it directly.', 'deposit checks that the amount is positive.', 'deposit(-5) is refused, so the balance stays 50.'],
    `class Account {
  int bal;
public:
  Account() {
    bal = 0;
  }
  void deposit(int d) {
    if (d > 0) {
      bal += d;
    }
  }
  int get() {
    return bal;
  }
};

int main() {
  Account a;
  a.deposit(50);
  a.deposit(-5);
  cout << a.get() << endl;
  return 0;
}`),
  guided('Read only', 'A getter with no setter makes a value read only. Outside code can look but cannot change.',
    ['id is private and set once in the constructor.', 'getId() lets everyone read it.', 'There is no way to change it afterwards.'],
    `class User {
  int id;
public:
  User(int i) {
    id = i;
  }
  int getId() {
    return id;
  }
};

int main() {
  User u(42);
  cout << u.getId() << endl;
  return 0;
}`),
  warn('Skipping the front desk', 'Private data cannot be set directly from outside. That is the whole point: bad values cannot sneak in.',
    ['bal is private.', 'a.bal = 999 tries to go straight into the room.', 'Use deposit() so the check runs.'],
    `class Account {
  int bal;
public:
  Account() {
    bal = 0;
  }
  void deposit(int d) {
    if (d > 0) {
      bal += d;
    }
  }
};

int main() {
  Account a;
  a.bal = 999;
  return 0;
}`),
];
const inheritItems = [
  guided('A child house with the parent\'s rooms', 'A child class gets everything public or protected from its parent, then adds its own.',
    ['Dog : public Animal means Dog inherits from Animal.', 'Dog has the name room from Animal, marked "from Animal" on its card.', 'bark() is new and belongs only to Dog.'],
    `class Animal {
public:
  string name;
};

class Dog : public Animal {
public:
  void bark() {
    cout << name << " barks" << endl;
  }
};

int main() {
  Dog d;
  d.name = "Rex";
  d.bark();
  return 0;
}`),
  guided('Parents are built first', 'When you build a child, the parent part is built first. Taking apart goes the other way round.',
    ['B inherits from A.', 'Building B first runs the constructor of A.', 'Then the constructor of B runs. So A prints before B.'],
    `class A {
public:
  A() {
    cout << "A" << endl;
  }
};

class B : public A {
public:
  B() {
    cout << "B" << endl;
  }
};

int main() {
  B b;
  return 0;
}`),
  warn('A child cannot use the parent\'s private room', 'private members stay private even from children. Use protected if the family should share.',
    ['secret is private in A.', 'B tries to return secret from its own method.', 'Change private to protected in A to fix it.'],
    `class A {
private:
  int secret;
public:
  A() {
    secret = 1;
  }
};

class B : public A {
public:
  int peek() {
    return secret;
  }
};

int main() {
  B b;
  cout << b.peek() << endl;
  return 0;
}`),
];
const polyItems = [
  guided('One remote, many houses', 'A pointer to the parent can point at a child. With virtual, the real object decides which version of the method runs.',
    ['Animal* a points at a Dog made with new.', 'speak() is virtual, so the Dog\'s speak runs, not the Animal\'s.', 'delete a takes the house down again.'],
    `class Animal {
public:
  virtual void speak() {
    cout << "..." << endl;
  }
  virtual ~Animal() {}
};

class Dog : public Animal {
public:
  void speak() {
    cout << "Woof" << endl;
  }
};

int main() {
  Animal* a = new Dog();
  a->speak();
  delete a;
  return 0;
}`),
  guided('Without virtual the remote decides', 'If the method is not virtual, the type of the pointer decides, even when the real object is a child.',
    ['Animal* a points at a Dog.', 'speak() is NOT virtual, so C++ trusts the pointer type: Animal.', 'It prints ... and the Dog never gets to speak. Add virtual to fix this.'],
    `class Animal {
public:
  void speak() {
    cout << "..." << endl;
  }
};

class Dog : public Animal {
public:
  void speak() {
    cout << "Woof" << endl;
  }
};

int main() {
  Dog d;
  Animal* a = &d;
  a->speak();
  return 0;
}`),
  warn('A plan nobody can build', 'A class with a pure virtual method (= 0) is abstract. It is only a plan for other classes. You cannot build a house from it.',
    ['Shape has area() = 0, so it has no body.', 'Shape s; tries to build a house from an unfinished plan.', 'Build a child class that writes area(), then create that one.'],
    `class Shape {
public:
  virtual double area() = 0;
};

int main() {
  Shape s;
  return 0;
}`),
];
const operatorItems = [
  guided('Teach + to work on houses', 'operator+ tells C++ what a + b means for your own class.',
    ['a + b calls operator+ on a with b as the input.', 'It builds a new P whose x is the sum.', 'c holds the new house: 1 + 2 = 3.'],
    `class P {
public:
  int x;
  P(int a) {
    x = a;
  }
  P operator+(const P& o) const {
    return P(x + o.x);
  }
};

int main() {
  P a(1);
  P b(2);
  P c = a + b;
  cout << c.x << endl;
  return 0;
}`),
  guided('Teach == to compare houses', 'operator== returns true or false, so you can use == on your own class.',
    ['a == b calls operator== on a with b.', 'It compares the two x values.', 'They are equal, so the answer is 1 (true).'],
    `class P {
public:
  int x;
  P(int a) {
    x = a;
  }
  bool operator==(const P& o) const {
    return x == o.x;
  }
};

int main() {
  P a(2);
  P b(2);
  cout << (a == b) << endl;
  return 0;
}`),
  warn('An operator nobody taught', 'C++ does not know how to add your objects unless you write operator+ for them.',
    ['a + b needs operator+, but P has none.', 'C++ stops with an error.', 'Write P operator+(const P& o) const inside the class.'],
    `class P {
public:
  int x;
  P(int a) {
    x = a;
  }
};

int main() {
  P a(1);
  P b(2);
  P c = a + b;
  return 0;
}`),
];

export default { id: 'cpp-topic-7', title: 'Classes', image: './environments/cpp/images/classes.png', starter: '', expects: [], lesson: { title: 'Classes', iconPath: './environments/cpp/images/subtopic-icons/classes', subtopics: [
  lesson('🧱', 'Class Data Members and Methods', {
    definition: 'A **class** is a plan for objects. It has **data members** (the data) and **methods** (the actions). An **object** is one real thing built from the plan.',
    points: [
      { term: 'In simple words', text: 'A class is a plan for a house. Data members are the rooms. Methods are the things the house can do. Every object is its own house.' },
      { term: 'Real-life example', text: 'The plan for a car says it has a speed and can accelerate. Your car and your neighbour\'s car are two different objects built from that plan.' },
      { term: 'Careful', text: 'Methods work on an object. You need to build one first.' },
    ],
    code: 'class Car {\npublic:\n  int speed;\n  void accelerate() {\n    speed += 10;\n  }\n};\n\nint main() {\n  Car c;\n  c.speed = 0;\n  c.accelerate();\n  cout << c.speed << endl;\n  return 0;\n}',
  }, memberItems, 'Type the class and watch the house get built'),
  lesson('🔐', 'Access Specifiers: public, private, protected', {
    definition: '**Access specifiers** decide who may use a member. **public** is for everyone, **private** is for the class only, **protected** is for the class and its children.',
    points: [
      { term: 'In simple words', text: 'Green is the street door: anyone can use it. Red is a locked room: only the house itself. Yellow is a family room: the house and its children.' },
      { term: 'Real-life example', text: 'A shop: customers can use the front counter (public). Only staff can enter the stock room (private).' },
      { term: 'Good to know', text: 'In a class, members are private unless you say otherwise.' },
    ],
    code: 'class Account {\nprivate:\n  int balance;\npublic:\n  Account() { balance = 100; }\n  int get() { return balance; }\n};',
  }, accessItems, 'Type the class and watch the locked rooms'),
  lesson('🏭', 'Constructors and Destructors', {
    definition: 'A **constructor** runs when an object is created. A **destructor** (with a **~** in front of its name) runs when the object is destroyed.',
    points: [
      { term: 'In simple words', text: 'The constructor is the building crew. It sets the house up. The destructor is the demolition crew. It tidies up at the end.' },
      { term: 'Real-life example', text: 'A hotel room is cleaned and prepared when a guest arrives (constructor) and cleaned again when they leave (destructor).' },
      { term: 'Remember', text: 'Objects are destroyed in the opposite order to how they were built.' },
    ],
    code: 'class Door {\npublic:\n  Door() { cout << "open" << endl; }\n  ~Door() { cout << "closed" << endl; }\n};\n\nint main() {\n  {\n    Door d;\n  }\n  cout << "end" << endl;\n}',
  }, ctorItems, 'Type the class and watch the crews work'),
  lesson('👈', 'The this Pointer', {
    definition: '**this** is a pointer that every method has. It points to the object that the method was called on.',
    points: [
      { term: 'In simple words', text: 'Inside a house, this is a sign that says "me". this->x means my own x.' },
      { term: 'Real-life example', text: 'When you say "my phone", the word "my" points at you. this works the same way for an object.' },
      { term: 'Good to know', text: 'return *this lets you chain calls: c.add(1).add(2).' },
    ],
    code: 'class P {\n  int x;\npublic:\n  P(int x) {\n    this->x = x;\n  }\n  int get() { return x; }\n};',
  }, thisItems, 'Type the class and watch which house is meant'),
  lesson('📌', 'Static Data Members and Methods', {
    definition: 'A **static** member belongs to the **class**, not to a single object. All objects share the same one.',
    points: [
      { term: 'In simple words', text: 'A sign on the street that every house can see and change. There is only one sign, no matter how many houses.' },
      { term: 'Real-life example', text: 'A school has one total of students, shared by every classroom.' },
      { term: 'Careful', text: 'Define a static data member once below the class, for example int Counter::count = 0;' },
    ],
    code: 'class Counter {\npublic:\n  static int count;\n  Counter() { count++; }\n};\n\nint Counter::count = 0;\n\nint main() {\n  Counter a;\n  Counter b;\n  cout << Counter::count << endl;   // 2\n}',
  }, staticItems, 'Type the class and watch the shared sign'),
  lesson('🛡️', 'Encapsulation with Getters and Setters', {
    definition: '**Encapsulation** means keeping data **private** and giving controlled access through public **getters** (read) and **setters** (change).',
    points: [
      { term: 'In simple words', text: 'The data is kept in a locked room. A front desk checks every request before it reaches the room.' },
      { term: 'Real-life example', text: 'A bank. You cannot walk into the vault. You ask the clerk, and the clerk checks your request.' },
      { term: 'Good to know', text: 'A setter can refuse bad values. That keeps your object always valid.' },
    ],
    code: 'class Account {\n  int bal;\npublic:\n  Account() { bal = 0; }\n  void deposit(int d) {\n    if (d > 0) { bal += d; }\n  }\n  int get() { return bal; }\n};',
  }, encapItems, 'Type the class and watch the front desk'),
  lesson('🌳', 'Class Inheritance', {
    definition: '**Inheritance** lets a class (the **child**) reuse the members of another class (the **parent**) and add its own.',
    points: [
      { term: 'In simple words', text: 'A child house starts with the rooms of the parent plan and then adds more. The parent part is built first.' },
      { term: 'Real-life example', text: 'A Dog is an Animal. It has a name like every animal, and it can also bark.' },
      { term: 'Careful', text: 'A child cannot use the parent\'s private members. Use protected to share with children.' },
    ],
    code: 'class Animal {\npublic:\n  string name;\n};\n\nclass Dog : public Animal {\npublic:\n  void bark() {\n    cout << name << " barks" << endl;\n  }\n};',
  }, inheritItems, 'Type the classes and watch the family'),
  lesson('🎭', 'Polymorphism and Virtual Functions', {
    definition: '**Polymorphism** means one call can behave differently for different classes. A **virtual** function lets the real object decide which version runs.',
    points: [
      { term: 'In simple words', text: 'One remote control, many different houses. Press "speak" and each house answers in its own way, as long as the method is virtual.' },
      { term: 'Real-life example', text: 'The word "play" works on a piano, a guitar and a drum. The action is different for each instrument.' },
      { term: 'Careful', text: 'Without virtual, the type of the pointer decides and the child version is ignored.' },
    ],
    code: 'class Animal {\npublic:\n  virtual void speak() { cout << "..." << endl; }\n};\n\nclass Dog : public Animal {\npublic:\n  void speak() { cout << "Woof" << endl; }\n};\n\nDog d;\nAnimal* a = &d;\na->speak();   // Woof',
  }, polyItems, 'Type the classes and watch the remote'),
  lesson('🧮', 'Operator Overloading in Classes', {
    definition: '**Operator overloading** lets you decide what an operator such as **+** or **==** does for your own class.',
    points: [
      { term: 'In simple words', text: 'You teach C++ a new meaning. a + b on two houses can mean "combine them into a new house".' },
      { term: 'Real-life example', text: 'Adding two amounts of money: 5 euros + 3 euros is 8 euros. The + knows how to add money.' },
      { term: 'Careful', text: 'If you do not write the operator, C++ does not guess. It stops with an error.' },
    ],
    code: 'class P {\npublic:\n  int x;\n  P(int a) { x = a; }\n  P operator+(const P& o) const {\n    return P(x + o.x);\n  }\n};\n\nP c = P(1) + P(2);   // c.x is 3',
  }, operatorItems, 'Type the class and watch the new operator'),
] } };
