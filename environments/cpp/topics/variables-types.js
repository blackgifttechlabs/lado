export default {
  id: "cpp-topic-1",
  title: "Variables & Types",
  image: "./environments/cpp/images/variables-types.png",
  starter: "",
  expects: [],
  lesson: {
    title: "Variables & Types",
    iconPath: "./environments/cpp/images/subtopic-icons/variables-types",
    subtopics: [
      {
        icon: "types",
        title: "Fundamental Types: int, float, double, char, bool",
        content: {
          heading: "Data Types",
          intro: "A data type tells the computer what kind of information you are keeping. Is it a whole number? A word? A yes or no answer? Before you make a variable, you choose its data type. Then the computer knows how to store it.",
          sectionTitle: "Examples of Data Types",
          items: [
            { name: "int", description: "A whole number. No decimal point.", code: "int age = 25;" },
            { name: "float", description: "A number with a decimal point. Uses less space than double.", code: "float height = 1.75f;" },
            { name: "double", description: "A number with a decimal point. Good for money and measurements.", code: "double price = 12.50;" },
            { name: "char", description: "One single letter or symbol. Use single quotes.", code: "char grade = 'A';" },
            { name: "bool", description: "Only two answers: true or false.", code: "bool isOpen = true;" },
            { name: "string", description: "Words and sentences. Use double quotes.", code: "string name = \"Lado\";" },
          ],
          tryTitle: "Change the values and run the program",
        },
        starter: `#include <iostream>
#include <string>

using namespace std;

int main() {
  string name = "Lado";
  double currency = 12.50;

  cout << "Hello " << name << endl;
  cout << "Balance: $" << currency << endl;
  return 0;
}`,
        expectedOutput: "Hello Lado\nBalance: $12.50",
      },
      {
        icon: "declare",
        title: "Declaring and Initializing Variables",
        content: {
          heading: "Declaring and Initializing Variables",
          intro: "A variable is a named box that holds a value. To declare a variable means to make the box: you pick a type and a name. To initialize it means to put the first value inside. You can do both in one line. If you declare a variable but give it no value, it holds a random leftover number. So always give your variables a value.",
          sectionTitle: "Examples of Declaring and Initializing",
          items: [
            { description: "Declare only. The box exists, but its value is random junk.", code: "int age;" },
            { description: "Declare and initialize in one line. This is the best habit.", code: "int age = 25;" },
            { description: "Change the value later. Do not write the type again.", code: "age = 26;" },
            { description: "Curly braces also work for giving the first value.", code: "int score { 10 };" },
            { description: "Make more than one variable of the same type in one line.", code: "int x = 1, y = 2;" },
            { name: "Warning", description: "Do not use a variable before it has a value. This prints a random number.", code: "int total;\ncout << total; // junk value!", warning: true },
          ],
          tryTitle: "Declare your own variables and run the program",
        },
      },
      {
        icon: "constant",
        title: "Constants with const and constexpr",
        content: {
          heading: "Constants with const and constexpr",
          intro: "Some values must never change. Pi is always 3.14. The days in a week are always 7. Put the word const in front of a variable and it becomes a locked crate. You can look inside the crate, but you cannot change what is inside. If you try, the compiler shows a red error. The word constexpr is a strong lock too. It tells the compiler to know the value before the program even runs.",
          sectionTitle: "Examples of Constants",
          items: [
            { name: "const", description: "Lock a value. You must give it a value on the same line.", code: "const double PI = 3.14;" },
            { name: "constexpr", description: "A lock that is checked while the program is being built. Good for fixed numbers.", code: "constexpr int DAYS = 7;" },
            { name: "Use it", description: "You can read a constant and use it in math. This finds the area of a circle with radius 5. You will use PI again in the circle lesson.", code: "double area = PI * 5 * 5;" },
            { name: "Debug", description: "You cannot change a constant. Type both lines and watch the crate bounce the change back with a red error. To fix it, delete the second line.", code: "const double PI = 3.14;\nPI = 3.14159;", warning: true },
          ],
          tryTitle: "Lock a value, then try to change it",
        },
        starter: `#include <iostream>

using namespace std;

int main() {
  const double PI = 3.14;
  PI = 3.14159;
  cout << PI << endl;
}`,
      },
      {
        icon: "auto",
        title: "Automatic Type Deduction with auto",
        content: {
          heading: "Automatic Type Deduction with auto",
          intro: "Sometimes you do not want to write the type. Write auto and the compiler picks it for you. It looks at the value on the right side and decides. Think of a scanner that reads the value and then stamps the right label on the box. But auto must have a value to look at.",
          sectionTitle: "Examples of auto",
          items: [
            { name: "int", description: "The scanner sees a whole number. So a is an int.", code: "auto a = 5;" },
            { name: "double", description: "The scanner sees a decimal point. So b is a double.", code: "auto b = 2.5;" },
            { name: "char", description: "The scanner sees one letter in single quotes. So c is a char.", code: "auto c = 'x';" },
            { name: "Debug", description: "auto needs a value on the same line. With no value, the scanner has nothing to read. Type both lines and watch the red error. To fix it, write auto x = 5;", code: "auto x;\nx = 5;", warning: true },
          ],
          tryTitle: "Let the scanner pick the type",
        },
        starter: `#include <iostream>

using namespace std;

int main() {
  auto a = 5;
  auto b = 2.5;
  auto c = 'x';
}`,
      },
      {
        icon: "cast",
        title: "Type Conversion and Casting",
        content: {
          heading: "Type Conversion and Casting",
          intro: "Sometimes a value must move from one crate to another. Moving into a bigger crate is easy: the compiler does it for you and nothing is lost. Moving into a smaller crate squeezes the value through a funnel, and some data can fall out. When you want to squeeze on purpose, use static_cast to say so.",
          sectionTitle: "Examples of Conversion and Casting",
          items: [
            { name: "Implicit", description: "Widening. A small crate fits into a bigger one, so the compiler converts it for you. Nothing is lost.", code: "double big = 5;" },
            { name: "static_cast", description: "Narrowing. A big value squeezed into a small crate loses data. static_cast<int> says you meant it. 3.7 becomes 3.", code: "int narrow = static_cast<int>(3.7);" },
            { name: "Average", description: "Compute the average of 3 ints correctly as a decimal. Divide by 3.0, not 3.", code: "int a = 4, b = 5, c = 8;\ndouble avg = (a + b + c) / 3.0;" },
            { name: "Debug", description: "5 / 2 gives 2, not 2.5, because both are ints. Type it and watch the funnel: the decimals are gone before the double gets the value.", code: "double r = 5 / 2;", warning: true },
            { name: "Fix", description: "Fix it with a cast. Turn one side into a double first, and the division keeps the .5.", code: "double r = static_cast<double>(5) / 2;" },
          ],
          tryTitle: "Move values between crates and watch the funnel",
        },
        starter: `#include <iostream>

using namespace std;

int main() {
  int whole = 5;
  double wide = whole;
  int narrow = static_cast<int>(3.7);
  return 0;
}`,
      },
      {
        icon: "scope",
        title: "Variable Scope and Lifetime",
        content: {
          heading: "Variable Scope and Lifetime",
          intro: "A warehouse has rooms. A variable lives only inside the room where you made it, and a room is made by a pair of curly braces { }. When the door closes at }, everything inside is destroyed. Outside the room, that name does not exist. The places where a name can be used are its scope. The time a variable stays alive is its lifetime.",
          sectionTitle: "Examples of Scope and Lifetime",
          items: [
            { name: "Outer", description: "A variable made in main lives in the big warehouse room. Every room inside can see it.", code: "int outer = 1;" },
            { name: "Inner room", description: "Curly braces open a new room. inner is born when the door opens and destroyed when the door closes.", code: "{\n  int inner = 2;\n}" },
            { name: "Shadow", description: "Shadowing. An inner room can make a variable with the same name. It hides the outer one until the door closes. Predict the output before you run it: it prints 2, then 1.", code: "int x = 1;\n{\n  int x = 2;\n  cout << x;\n}\ncout << x;" },
            { name: "Debug", description: "The variable died when the door closed, so its name is gone. The compiler says: not declared in this scope. Type it and watch the red error. To fix it, declare room before the curly braces, in the big room.", code: "{\n  int room = 5;\n}\ncout << room;", warning: true },
          ],
          tryTitle: "Open a room, then try to use its variable outside",
        },
        starter: `#include <iostream>

using namespace std;

int main() {
  int outer = 1;
  {
    int inner = 2;
  }
  inner = 3;
  return 0;
}`,
      },
    ],
  },
};
