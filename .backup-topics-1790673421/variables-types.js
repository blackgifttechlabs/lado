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

int main() {
  std::string name = "Lado";
  double currency = 12.50;

  std::cout << "Hello " << name << "\\n";
  std::cout << "Balance: $" << currency << "\\n";
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
      { icon: "constant", title: "Constants with const and constexpr" },
      { icon: "auto", title: "Automatic Type Deduction with auto" },
      { icon: "cast", title: "Type Conversion and Casting" },
      { icon: "scope", title: "Variable Scope and Lifetime" },
    ],
  },
};
