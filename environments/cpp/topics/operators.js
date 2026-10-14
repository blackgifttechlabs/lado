export default { id: "cpp-topic-2", title: "Operators", image: "./environments/cpp/images/operators.png", starter: "", expects: [], lesson: { title: "Operators", iconPath: "./environments/cpp/images/subtopic-icons/operators", subtopics: [
  {
        icon: "➕",
        title: "Arithmetic Operators",
        content: {
          heading: "Arithmetic Operators",
          intro: "Arithmetic operators do math. Picture a conveyor belt: two numbers ride into an operator machine, and one result drops into the tray. C++ has five machines: + - * / and %. Be careful with /. When both numbers are whole numbers, the machine throws away the decimals. And no machine can divide by zero.",
          sectionTitle: "Examples of Arithmetic Operators",
          items: [
            { name: "+ - *", description: "Add, subtract and multiply work like on a calculator. Two numbers go in, one result comes out.", code: "int sum = 17 + 5;" },
            { name: "/", description: "Dividing two whole numbers drops the decimals. 17 / 5 is 3, not 3.4. Look at both trays side by side.", code: "int quot = 17 / 5;" },
            { name: "%", description: "The remainder machine gives what is left over after dividing. 17 % 5 is 2.", code: "int rem = 17 % 5;" },
            { name: "Minutes", description: "Convert 250 minutes to hours and minutes. Use / for the hours and % for the minutes left over.", code: "int total = 250;\nint hours = total / 60;\nint minutes = total % 60;" },
            { name: "Debug", description: "You cannot divide by zero. Type both lines and watch the machine jam. To fix it, divide by a number that is not zero.", code: "int zero = 0;\nint bad = 10 / zero;", warning: true },
          ],
          tryTitle: "Feed numbers into the machines",
        },
        starter: `#include <iostream>

using namespace std;

int main() {
  int a = 17;
  int b = 5;
  int sum = a + b;
  int diff = a - b;
  int prod = a * b;
  int quot = a / b;
  int rem = a % b;
  return 0;
}`,
      }, {
        icon: "📝",
        title: "Assignment and Compound Assignment",
        content: {
          heading: "Assignment and Compound Assignment",
          intro: "A variable is a box, and assignment puts a value inside it. The = sign does not mean equal like in maths. It means: take the value on the right and store it in the box on the left. Compound assignment is a shortcut. x += 5 means: take what is in the box, add 5, and put the result back in the same box. Watch the number count up in the scene.",
          sectionTitle: "Examples of Assignment Operators",
          items: [
            { name: "=", description: "Plain assignment. The new value replaces whatever was in the box.", code: "int x = 10;\nx = 25;" },
            { name: "+=", description: "Add to the box. x += 5 is the same as x = x + 5. The number counts up.", code: "int x = 10;\nx += 5;" },
            { name: "-=", description: "Subtract from the box. x -= 3 is the same as x = x - 3.", code: "int x = 10;\nx -= 3;" },
            { name: "*=", description: "Multiply the box. x *= 4 is the same as x = x * 4.", code: "int x = 10;\nx *= 4;" },
            { name: "/=", description: "Divide the box. With whole numbers the decimals are dropped, so 10 / 4 leaves 2.", code: "int x = 10;\nx /= 4;" },
            { name: "%=", description: "Keep only the remainder. x %= 3 is the same as x = x % 3.", code: "int x = 10;\nx %= 3;" },
            { name: "Discount", description: "Apply a 10% discount using *=. Start with a price of 200.0 and multiply it by 0.9.", code: "double price = 200.0;\nprice *= 0.9;" },
            { name: "Debug", description: "One = stores, two == compares. Type both lines and see that x stays 5, because == only asks a question. To fix it, use a single =.", code: "int x = 5;\nx == 10;", warning: true },
          ],
          tryTitle: "Update the box and watch the number change",
        },
        starter: `#include <iostream>

using namespace std;

int main() {
  int x = 10;
  x += 5;
  x -= 3;
  x *= 4;
  x /= 6;
  x %= 5;
  return 0;
}`,
      },
  {
    icon: "⚖️",
    title: "Comparison Operators",
    content: {
      heading: "Comparison Operators",
      intro: "Comparison operators ask a question about two values. C++ answers every comparison with either true or false. Imagine placing one value on each side of a balance scale: the beam tips toward the larger value, or stays level when both values are equal.",
      sectionTitle: "The Six Comparison Operators",
      items: [
        { name: "==", description: "Equal to. Asks whether both values are the same.", code: "10 == 10; // true" },
        { name: "!=", description: "Not equal to. Asks whether the values are different.", code: "10 != 7; // true" },
        { name: "<", description: "Less than. Asks whether the left value is smaller.", code: "7 < 10; // true" },
        { name: ">", description: "Greater than. Asks whether the left value is larger.", code: "10 > 7; // true" },
        { name: "<=", description: "Less than or equal to. Either smaller or exactly equal passes.", code: "10 <= 10; // true" },
        { name: ">=", description: "Greater than or equal to. Either larger or exactly equal passes.", code: "12 >= 10; // true" },
        { name: "DIY", description: "Check whether a score passes 50.", code: "int score = 65;\nbool passed = score >= 50;" },
        { name: "Debug", description: "A single = stores a value. It does not compare. Use == when you want to ask whether two values are equal.", code: "int score = 50;\nscore = 40;  // assignment\nscore == 50; // comparison", warning: true },
      ],
      tryTitle: "Compare two values and watch the balance",
    },
    starter: `#include <iostream>

using namespace std;

int main() {
  int left = 10;
  int right = 7;
  left == right;
  left != right;
  left < right;
  left > right;
  left <= right;
  left >= right;
  return 0;
}`,
  }, {
    icon: "🔗", title: "Logical Operators",
    content: {
      heading: "Logical Operators",
      intro: "Logical operators join or reverse true/false conditions. Create boolean boxes, lift out copies of their values, and check them: && needs both true, || needs at least one true, and ! flips the copied value. C++ stops early when the first condition already decides the result; this is called short-circuit evaluation.",
      sectionTitle: "Logic Gates and Conditions",
      items: [
        { name: "&&", description: "AND is true only when both conditions are true. Both switches must be on.", code: "bool hasTicket = true;\nbool doorOpen = false;\nbool canEnter = hasTicket && doorOpen;" },
        { name: "||", description: "OR is true when either condition is true. One working switch is enough.", code: "bool isAdmin = false;\nbool hasPass = true;\nbool hasAccess = isAdmin || hasPass;" },
        { name: "!", description: "NOT reverses a condition: true becomes false and false becomes true.", code: "bool doorOpen = false;\nbool locked = !doorOpen;" },
        { name: "DIY", description: "A leap year is divisible by 400, or divisible by 4 but not by 100.", code: "int year = 2024;\nbool leap = (year % 400 == 0) ||\n            (year % 4 == 0 && year % 100 != 0);" },
        { name: "Debug", description: "With &&, C++ skips the right side when the left side is false. Do not rely on a skipped function call to change your program.", code: "bool ready = false;\nint checks = 0;\nbool ok = ready && (++checks > 0); // checks stays 0", warning: true },
      ], tryTitle: "Create the boxes, check their values, then store the answer",
    },
    starter: `#include <iostream>

using namespace std;

int main() {
  bool a = true;
  bool b = false;
  bool both = a && b;
  bool either = a || b;
  bool opposite = !a;
  return 0;
}`,
  }, {
    icon: "🧩", title: "Bitwise Operators",
    content: {
      heading: "Bitwise Operators",
      intro: "Bitwise operators work on the individual binary digits inside whole numbers. Open the number boxes and lift their binary rows onto the table. Check one column at a time: & keeps lights that are on in both rows, | keeps lights from either row, ^ keeps lights that differ, ~ flips every light, and shifts slide the row left or right.",
      sectionTitle: "Eight-bit Light Rows",
      items: [
        { name: "&", description: "Bitwise AND turns on a result bit only where both input bits are on.", code: "unsigned int masked = 12 & 10; // 8" },
        { name: "|", description: "Bitwise OR turns on a result bit where either input bit is on.", code: "unsigned int combined = 12 | 10; // 14" },
        { name: "^", description: "Bitwise XOR turns on a result bit where the inputs differ.", code: "unsigned int toggled = 12 ^ 10; // 6" },
        { name: "~", description: "Bitwise NOT flips every bit. Use an unsigned byte when you want to see only eight bits.", code: "unsigned char flipped = static_cast<unsigned char>(~12u); // 243" },
        { name: "<< >>", description: "Shifts slide all bits. Left usually doubles; right usually halves for small positive values.", code: "unsigned int left = 3 << 2;\nunsigned int right = 12 >> 2;" },
        { name: "DIY", description: "Turn on bit 3 without changing any other bit. Counting starts at bit 0.", code: "unsigned char flags = 0;\nflags |= (1u << 3);" },
        { name: "Debug", description: "A single & compares bits; && joins boolean conditions. Use && when both comparisons must be true.", code: "int a = 2;\nint b = 4;\nbool wrong = a & b; // false: no shared bits\nbool right = a && b; // true: both nonzero", warning: true },
      ], tryTitle: "Create number boxes, then combine their bits",
    },
    starter: `#include <iostream>

using namespace std;

int main() {
  unsigned int a = 12;
  unsigned int b = 10;
  unsigned int both = a & b;
  unsigned int either = a | b;
  unsigned int different = a ^ b;
  unsigned int shifted = a << 1;
  return 0;
}`,
  }, {
    icon: "⏫", title: "Increment and Decrement Operators",
    content: {
      heading: "Increment and Decrement Operators",
      intro: "++ adds one and -- subtracts one. Position matters inside a larger expression: prefix changes the counter before its value is used, while postfix uses the old value first and changes the counter afterward. Watch the box open: its number comes out, gains or loses one, then goes back inside. If another variable uses the value, postfix sends the old number and prefix sends the updated number.",
      sectionTitle: "Before or After the Value Is Used",
      items: [
        { name: "x++", description: "Postfix increment uses the current value, then adds one to x.", code: "int x = 5;\nint y = x++; // y is 5, x is 6" },
        { name: "++x", description: "Prefix increment adds one first, then uses the new value.", code: "int x = 5;\nint y = ++x; // x and y are 6" },
        { name: "x--", description: "Postfix decrement uses the current value, then subtracts one.", code: "int x = 5;\nint y = x--; // y is 5, x is 4" },
        { name: "DIY", description: "Predict a, b and y using separate statements (3, 5 and 8). The expression y = x++ + ++x has undefined behavior in C++; it has no predictable output.", code: "int x = 3;\nint a = x++;\nint b = ++x;\nint y = a + b; // 8" },
        { name: "Debug", description: "Prefix increments before use and skips index 0. If you need the current index before advancing, use postfix.", code: "int index = 0;\nint wrong = ++index; // 1: skipped index 0\nindex = 0;\nint first = index++; // 0: use it, then advance", warning: true },
      ], tryTitle: "Open x, add or subtract one, then put the number back",
    },
    starter: `#include <iostream>

using namespace std;

int main() {
  int x = 5;
  int post = x++;
  int pre = ++x;
  x--;
  return 0;
}`,
  }, {
    icon: "❓", title: "Conditional Ternary Operator",
    content: {
      heading: "Conditional Ternary Operator",
      intro: "The ternary operator is a compact two-way decision. C++ checks the condition before ?, follows the first path when it is true, and follows the second path after : when it is false. Only the chosen result is used.",
      sectionTitle: "Condition ? True Result : False Result",
      items: [
        { name: "Guided", description: "Choose a label from a condition. Create age first, then write the ternary expression. Watch its value follow the chosen path into label.", code: "int age = 20;\nstring label = age >= 18 ? \"adult\" : \"minor\";" },
        { name: "DIY", description: "Return the larger of two numbers with one ternary expression.", code: "int a = 12;\nint b = 7;\nint larger = a > b ? a : b;" },
        { name: "Debug", description: "An integer and a string literal are incompatible results. Uncomment the broken line to see the compiler error; fix it by using two strings.", code: "bool passed = true;\n// string result = passed ? 1 : \"no\"; // incompatible types\nstring result = passed ? \"yes\" : \"no\";", warning: true },
      ], tryTitle: "Create age, then send the chosen value to label",
    },
    starter: `#include <iostream>
#include <string>

using namespace std;

int main() {
  int age = 20;
  string label = age >= 18 ? "adult" : "minor";
  return 0;
}`,
  }, {
    icon: "🥇", title: "Operator Precedence and Evaluation Order",
    content: {
      heading: "Operator Precedence and Evaluation Order",
      intro: "Precedence decides how an expression is grouped. Multiplication, division and remainder bind more tightly than addition and subtraction. Parentheses override that grouping. Create a box, then lay out the expression. The BOMDAS letters highlight what happens next: lift the matching numbers, combine them, and keep their answer for the next operation. Put the final answer in the box. M and D have equal precedence, as do A and S; work left to right within each pair.",
      sectionTitle: "Follow BOMDAS, One Operation at a Time",
      items: [
        { name: "Guided", description: "Multiplication groups first: 3 * 4 becomes 12, then 2 + 12 becomes 14.", code: "int result = 2 + 3 * 4; // 14" },
        { name: "Parentheses", description: "Parentheses group the addition first: 2 + 3 becomes 5, then 5 * 4 becomes 20.", code: "int result = (2 + 3) * 4; // 20" },
        { name: "Same precedence", description: "Multiplication and division group from left to right, as do addition and subtraction. This is associativity, not a guarantee about when independent operands run.", code: "int result = 20 / 5 * 2; // (20 / 5) * 2 = 8" },
        { name: "DIY", description: "Add parentheses to 2 + 3 * 4 to reach the target value 20. Keep the numbers and operators in their original order. Write your expression in the editor and watch the result box.", code: "int target = (2 + 3) * 4; // 20" },
        { name: "Debug", description: "The average of 10 and 6 should be 8. Missing parentheses make the division happen inside the right operand of addition, producing 13. Group the sum before dividing.", code: "int wrong = 10 + 6 / 2; // 13\nint average = (10 + 6) / 2; // 8", warning: true },
      ],
      tryTitle: "Create a box, follow BOMDAS, then store the answer",
    },
    starter: `#include <iostream>

using namespace std;

int main() {
  int plain = 2 + 3 * 4;
  int grouped = (2 + 3) * 4;
  cout << plain << " " << grouped << endl;
  return 0;
}`,
  },
] } };
