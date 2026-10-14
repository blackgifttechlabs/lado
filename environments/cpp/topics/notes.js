// Simple-English notes for every subtopic, keyed by the lesson heading.
// definition: the tinted box (**word** = bold). points: bullet list (bold term + short text). code: one small example.
export const NOTES = {
  "Data Types": {
    "definition": "A **data type** tells the computer what kind of value a variable holds and how much space it needs.",
    "points": [
      {
        "term": "In simple words",
        "text": "Every piece of information has a kind. Your age is a whole number. Your name is words. \"Is the shop open?\" is yes or no. C++ wants to know the kind before it stores anything."
      },
      {
        "term": "Real-life example",
        "text": "A school form has different boxes: a number box for age, a letter box for grade, a yes/no tick box for \"present\". Each box only accepts its own kind of answer."
      }
    ],
    "code": "int age = 25;\ndouble price = 12.50;\nchar grade = 'A';\nbool isOpen = true;"
  },
  "Declaring and Initializing Variables": {
    "definition": "**Declaring** a variable gives it a type and a name. **Initializing** it gives it its first value.",
    "points": [
      {
        "term": "In simple words",
        "text": "A variable is a box with a name. To declare it means to make the box. To initialize it means to put the first value inside."
      },
      {
        "term": "Real-life example",
        "text": "You buy an empty jar and write \"sugar\" on it. That is declaring. When you pour sugar in for the first time, that is initializing."
      }
    ],
    "code": "int score;        // declare\nscore = 10;       // give it a value later\nint lives = 3;    // declare and initialize\nint level{1};     // curly braces also work"
  },
  "Constants with const and constexpr": {
    "definition": "A ****const**ant** is a variable marked const. Its value is set once and can never be changed again.",
    "points": [
      {
        "term": "In simple words",
        "text": "Some values should never change, like the number of days in a week. Put const in front of a variable and C++ locks it. You can look at it, but you cannot change it."
      },
      {
        "term": "Real-life example",
        "text": "The price on a printed menu. The waiter can read it, but cannot rub it out and write a new price."
      }
    ],
    "code": "const double PI = 3.14;\nconstexpr int DAYS = 7;\ncout << PI * 2 << endl;\n// PI = 3.2;   // error: PI is locked"
  },
  "Automatic Type Deduction with auto": {
    "definition": "**auto** lets the compiler work out the type of a variable from the value you give it.",
    "points": [
      {
        "term": "In simple words",
        "text": "Sometimes you do not want to write the type. Write auto and C++ looks at the value on the right and picks the type for you."
      },
      {
        "term": "Real-life example",
        "text": "A scanner at a shop reads the item and prints the right label. You do not tell it what the item is."
      }
    ],
    "code": "auto a = 5;      // int\nauto b = 2.5;    // double\nauto c = 'x';    // char"
  },
  "Type Conversion and Casting": {
    "definition": "**Type conversion** changes a value from one type to another. A **cast** is when you ask for the change yourself.",
    "points": [
      {
        "term": "In simple words",
        "text": "Sometimes a value must move into a different kind of box. Going into a bigger box is safe. Going into a smaller box can lose part of the value, like the .9 in 3.9."
      },
      {
        "term": "Real-life example",
        "text": "Pouring a big jug into a small cup. Some water spills. Pouring a cup into the jug loses nothing."
      }
    ],
    "code": "double price = 3.9;\nint whole = static_cast<int>(price);  // 3\ncout << whole << endl;"
  },
  "Variable Scope and Lifetime": {
    "definition": "**Scope** is the part of the program where a variable can be used. **Lifetime** is how long the variable exists.",
    "points": [
      {
        "term": "In simple words",
        "text": "A variable only lives in the room where you made it. A room is made by curly braces { }. When the closing brace } is reached, the variable is gone."
      },
      {
        "term": "Real-life example",
        "text": "A note stuck on a classroom wall is only useful in that classroom. When you leave and lock the door, nobody outside can read it."
      }
    ],
    "code": "int a = 1;\n{\n  int b = 2;\n  cout << a + b << endl;\n}\n// b does not exist here"
  },
  "Arithmetic Operators": {
    "definition": "An **arithmetic operator** takes numbers and gives back a new number.",
    "points": [
      {
        "term": "In simple words",
        "text": "Arithmetic operators do maths. C++ has + - * / and %. With whole numbers, / throws away the decimal part. % gives what is left over."
      },
      {
        "term": "Real-life example",
        "text": "Share 7 sweets between 2 children. Each gets 3 (that is 7 / 2). One sweet is left over (that is 7 % 2)."
      }
    ],
    "code": "cout << 7 + 2 << endl;   // 9\ncout << 7 / 2 << endl;   // 3\ncout << 7 % 2 << endl;   // 1"
  },
  "Assignment and Compound Assignment": {
    "definition": "**Assignment** stores a value in a variable. **Compound assignment** changes the variable using its own old value.",
    "points": [
      {
        "term": "In simple words",
        "text": "The = sign does not mean \"equal\" like in maths. It means: take the value on the right and put it in the box on the left. Shortcuts like += change the box in one step."
      },
      {
        "term": "Real-life example",
        "text": "Your wallet has 10 coins. \"Add 5 coins\" makes it 15. You did not throw the wallet away. You changed what is inside."
      }
    ],
    "code": "int coins = 10;\ncoins += 5;   // 15\ncoins -= 3;   // 12\ncoins *= 2;   // 24"
  },
  "Comparison Operators": {
    "definition": "A **comparison operator** compares two values and gives **true or false**.",
    "points": [
      {
        "term": "In simple words",
        "text": "Comparison operators ask a question about two values. The answer is always true or false. Be careful: == asks \"are they equal?\" but = stores a value."
      },
      {
        "term": "Real-life example",
        "text": "A scale with two plates. Put a number on each side and it tips to the bigger one, or stays level if they are the same."
      }
    ],
    "code": "int score = 60;\ncout << (score >= 50) << endl;   // 1 (true)\ncout << (score == 100) << endl;  // 0 (false)"
  },
  "Logical Operators": {
    "definition": "A **logical operator** combines or reverses true/false values.",
    "points": [
      {
        "term": "In simple words",
        "text": "Logical operators join true/false answers. && means both must be true. || means at least one must be true. ! flips the answer."
      },
      {
        "term": "Real-life example",
        "text": "To enter a party you need a ticket AND an ID (&&). To pay you can use cash OR card (||)."
      }
    ],
    "code": "bool hasTicket = true;\nbool hasId = false;\ncout << (hasTicket && hasId) << endl;  // 0\ncout << (hasTicket || hasId) << endl;  // 1"
  },
  "Bitwise Operators": {
    "definition": "A **bitwise operator** changes or compares the individual bits of a whole number.",
    "points": [
      {
        "term": "In simple words",
        "text": "Inside the computer every number is a row of 0s and 1s called bits. Bitwise operators work on those bits one by one, like a row of light switches."
      },
      {
        "term": "Real-life example",
        "text": "Eight light switches in a row. \"AND\" keeps a light on only if both rows have it on. \"OR\" keeps it on if either row does."
      }
    ],
    "code": "int a = 12;   // 1100\nint b = 10;   // 1010\ncout << (a & b) << endl;  // 8  (1000)\ncout << (a | b) << endl;  // 14 (1110)"
  },
  "Increment and Decrement Operators": {
    "definition": "The increment operator **++** adds 1. The decrement operator **--** subtracts 1.",
    "points": [
      {
        "term": "In simple words",
        "text": "++ adds one to a variable. -- takes one away. Where you write them matters: ++x changes first and then gives the answer, x++ gives the answer first and then changes."
      },
      {
        "term": "Real-life example",
        "text": "A people counter at a door. Every person who walks in adds one click."
      }
    ],
    "code": "int x = 5;\ncout << x++ << endl;  // prints 5, x becomes 6\ncout << ++x << endl;  // x becomes 7, prints 7"
  },
  "Conditional Ternary Operator": {
    "definition": "The ternary operator **condition ? a : b** gives a when the condition is true, and b when it is false.",
    "points": [
      {
        "term": "In simple words",
        "text": "The ternary operator is a short way to choose between two answers. It asks a question and gives one answer if true and another if false."
      },
      {
        "term": "Real-life example",
        "text": "A traffic light. If the light is green, go. Otherwise, stop."
      }
    ],
    "code": "int age = 20;\nstring group = (age >= 18) ? \"adult\" : \"minor\";\ncout << group << endl;"
  },
  "Operator Precedence and Evaluation Order": {
    "definition": "**Precedence** is the order in which C++ does the operators in an expression.",
    "points": [
      {
        "term": "In simple words",
        "text": "When an expression has many operators, C++ does some first. Multiplication and division come before addition and subtraction. Brackets always go first."
      },
      {
        "term": "Real-life example",
        "text": "In maths class 2 + 3 x 4 is 14, not 20, because you multiply first. Brackets (2 + 3) x 4 make it 20."
      }
    ],
    "code": "cout << 2 + 3 * 4 << endl;     // 14\ncout << (2 + 3) * 4 << endl;   // 20"
  },
  "Conditional Branching with if, else if, and else": {
    "definition": "An **if statement** runs a block of code only when its condition is **true**. else if and else give other choices.",
    "points": [
      {
        "term": "In simple words",
        "text": "A program often has to choose. An if asks a question. If the answer is yes, it runs the code inside. else is the plan B when the answer is no."
      },
      {
        "term": "Real-life example",
        "text": "If it is raining, take an umbrella. Otherwise, wear a hat."
      }
    ],
    "code": "int age = 15;\nif (age < 13) {\n  cout << \"Child\" << endl;\n} else if (age < 18) {\n  cout << \"Teenager\" << endl;\n} else {\n  cout << \"Adult\" << endl;\n}"
  },
  "Multi-way Branching with switch": {
    "definition": "A **switch statement** compares one value with a list of **case** labels and runs the code of the one that matches.",
    "points": [
      {
        "term": "In simple words",
        "text": "When one value can be many fixed things, a long chain of if is tiring. A switch looks at the value once and jumps to the matching case. break stops it from running into the next case."
      },
      {
        "term": "Real-life example",
        "text": "A lift with buttons. Press 3 and it goes to floor 3. It does not stop at floors 1 and 2 on the way."
      }
    ],
    "code": "int day = 3;\nswitch (day) {\n  case 1: cout << \"Monday\"; break;\n  case 2: cout << \"Tuesday\"; break;\n  case 3: cout << \"Wednesday\"; break;\n  default: cout << \"Unknown\";\n}"
  },
  "Traditional for Loops": {
    "definition": "A **for loop** repeats a block of code while its **condition** is true. It has an **init**, a condition and an **update**.",
    "points": [
      {
        "term": "In simple words",
        "text": "A loop repeats code so you do not write it again and again. A for loop has three parts in one line: where to start, when to keep going, and how to move forward."
      },
      {
        "term": "Real-life example",
        "text": "Running laps on a track. You start at lap 1, you check \"have I done 5 laps?\", and after each lap you add one."
      }
    ],
    "code": "for (int i = 1; i <= 5; i++) {\n  cout << i << endl;\n}"
  },
  "Range-based for Loops": {
    "definition": "A **range-based for loop** visits every item in an array or string, one after another.",
    "points": [
      {
        "term": "In simple words",
        "text": "Sometimes you just want to go through every item in a list. A range-based for hands you one item at a time. You do not need a counter."
      },
      {
        "term": "Real-life example",
        "text": "A teacher handing out one book to each child in a row. She does not count. She just goes to the next child until the row ends."
      }
    ],
    "code": "int nums[] = {2, 4, 6};\nfor (int n : nums) {\n  cout << n << endl;\n}"
  },
  "while and do-while Loops": {
    "definition": "A **while loop** repeats while its condition is true. A **do-while loop** checks the condition after each run.",
    "points": [
      {
        "term": "In simple words",
        "text": "A while loop keeps going as long as its question is true. It checks the question first. A do-while runs once first and then checks, so it always runs at least one time."
      },
      {
        "term": "Real-life example",
        "text": "Filling a bucket. While the bucket is not full, keep pouring. You do not know how many cups it will take."
      }
    ],
    "code": "int n = 3;\nwhile (n > 0) {\n  cout << n << endl;\n  n--;\n}"
  },
  "Loop Control with break and continue": {
    "definition": "**break** leaves the loop immediately. **continue** jumps to the next round of the loop.",
    "points": [
      {
        "term": "In simple words",
        "text": "Sometimes you need to leave a loop early, or skip one round. break ends the whole loop right now. continue skips the rest of this round and goes to the next one."
      },
      {
        "term": "Real-life example",
        "text": "You look for your keys in 10 drawers. When you find them in drawer 4, you stop looking (break). If a drawer is stuck, you skip it (continue)."
      }
    ],
    "code": "for (int i = 1; i <= 10; i++) {\n  if (i == 3) { continue; }\n  if (i == 6) { break; }\n  cout << i << endl;\n}"
  },
  "Working with Nested Loops": {
    "definition": "A **nested loop** is a loop placed inside the body of another loop.",
    "points": [
      {
        "term": "In simple words",
        "text": "A nested loop is a loop inside another loop. The inner loop runs fully each time the outer loop goes around once. Think of rows and columns."
      },
      {
        "term": "Real-life example",
        "text": "The hands of a clock. The minute hand goes all the way round for every single step of the hour hand."
      }
    ],
    "code": "for (int r = 1; r <= 3; r++) {\n  for (int c = 1; c <= 3; c++) {\n    cout << \"*\";\n  }\n  cout << endl;\n}"
  }
};
