// Do-it-yourself and Debug challenges for the C# lessons, keyed by the lesson heading.
// diy: write code from a task (the editor opens with an empty Main). debug: the editor opens with broken code to fix.
// Code that needs real .NET (classes, files, forms, databases) is checked by its goals (re = must match, no = must not match).
const diy = (task, expect, solution, hint, goals = [], why = '') => ({ kind: 'diy', task, expect, solution, hint, goals, why });
const debug = (task, code, expect, solution, hint, goals = [], why = '') => ({ kind: 'debug', task, code, expect, solution, hint, goals, why });
const g = (label, re) => ({ label, re });

export const PRACTICE = {
  'Variables and Data Types': [
    diy('Make a string called city with the value Harare and an int called year with the value 2026. Print them like this: Harare 2026', 'Harare 2026\n',
      'string city = "Harare";\nint year = 2026;\nConsole.WriteLine(city + " " + year);', 'Declare string city = "Harare"; and int year = 2026; then join them with + and a space.',
      [g('Uses a string variable', '\\bstring\\s+city'), g('Uses an int variable', '\\bint\\s+year')], 'A type tells C# what fits in the box.'),
    debug('This program should print 3.5 but the type is wrong. Fix it.', 'int price = 3.5;\nConsole.WriteLine(price);', '3.5\n',
      'double price = 3.5;\nConsole.WriteLine(price);', 'An int cannot hold a decimal point. Use double.', [g('Uses double', '\\bdouble\\b')], 'int is for whole numbers only.'),
  ],
  'Input and Output': [
    diy('Print Hello on one line and World on the next line.', 'Hello\nWorld\n', 'Console.WriteLine("Hello");\nConsole.WriteLine("World");', 'Use Console.WriteLine twice.', [g('Uses Console.WriteLine', 'Console\\.WriteLine')], 'WriteLine ends the line.'),
    diy('Make name = "Lado" and score = 90. Use string interpolation to print: Lado scored 90%', 'Lado scored 90%\n', 'string name = "Lado";\nint score = 90;\nConsole.WriteLine($"{name} scored {score}%");', 'Put $ before the quote and write {name} and {score} inside.', [g('Uses $ interpolation', '\\$"')], 'Interpolation puts variables inside text.'),
  ],
  'Operators': [
    diy('Print the remainder of 17 divided by 5.', '2\n', 'Console.WriteLine(17 % 5);', 'The remainder operator is %.', [g('Uses %', '%')], '% gives what is left over.'),
    diy('Make int x = 10. Add 5 with +=, then print x.', '15\n', 'int x = 10;\nx += 5;\nConsole.WriteLine(x);', 'x += 5; means x = x + 5;', [g('Uses +=', '\\+=')], ''),
  ],
  'Selection Statements (if, if...else, switch)': [
    diy('Make int age = 15. Print Teenager if age is from 13 to 17, otherwise print Other.', 'Teenager\n', 'int age = 15;\nif (age >= 13 && age <= 17) Console.WriteLine("Teenager");\nelse Console.WriteLine("Other");', 'Join two conditions with &&.', [g('Uses if and else', '\\bif\\b[\\s\\S]*\\belse\\b')], 'else is plan B.'),
    diy('Make int day = 3. Use a switch to print Wednesday for 3 and Other for anything else.', 'Wednesday\n', 'int day = 3;\nswitch (day)\n{\n    case 3: Console.WriteLine("Wednesday"); break;\n    default: Console.WriteLine("Other"); break;\n}', 'Write case 3: and end it with break;', [g('Uses switch', '\\bswitch\\b')], ''),
    debug('This should print Pass but it prints nothing. Fix the bug.', 'int mark = 60;\nif (mark = 50) Console.WriteLine("Pass");', 'Pass\n', 'int mark = 60;\nif (mark >= 50) Console.WriteLine("Pass");', 'Use a comparison operator, not =.', [g('Compares with >=', '>=')], '= stores a value, == and >= compare.'),
  ],
  'Loops (for, while, do...while)': [
    diy('Use a for loop to print the numbers 1 to 5, each on its own line.', '1\n2\n3\n4\n5\n', 'for (int i = 1; i <= 5; i++)\n{\n    Console.WriteLine(i);\n}', 'for (int i = 1; i <= 5; i++)', [g('Uses a for loop', '\\bfor\\s*\\(')], ''),
    diy('Use a while loop to count down 3, 2, 1 and then print Go!', '3\n2\n1\nGo!\n', 'int n = 3;\nwhile (n > 0)\n{\n    Console.WriteLine(n);\n    n--;\n}\nConsole.WriteLine("Go!");', 'Start n at 3 and use n-- inside the loop.', [g('Uses a while loop', '\\bwhile\\s*\\(')], ''),
    debug('This loop never ends. Fix it so it prints 1 2 3.', 'int i = 1;\nwhile (i <= 3)\n{\n    Console.WriteLine(i);\n}', '1\n2\n3\n', 'int i = 1;\nwhile (i <= 3)\n{\n    Console.WriteLine(i);\n    i++;\n}', 'Something must change i inside the loop.', [g('Changes i', 'i\\+\\+|i\\s*\\+=|i\\s*=\\s*i')], 'A loop needs a way to stop.'),
  ],
  'Nested Loops': [
    diy('Print a block of 2 rows and 3 columns of * (like ***) using two loops.', '***\n***\n', 'for (int r = 0; r < 2; r++)\n{\n    for (int c = 0; c < 3; c++) Console.Write("*");\n    Console.WriteLine();\n}', 'Outer loop for rows, inner loop for columns, WriteLine after the inner loop.', [g('Uses two for loops', '\\bfor\\b[\\s\\S]*\\bfor\\b')], 'The inner loop finishes for every outer round.'),
  ],
  'Arrays': [
    diy('Make an array of the numbers 4, 8 and 6. Print the first number and the Length of the array on separate lines.', '4\n3\n', 'int[] a = { 4, 8, 6 };\nConsole.WriteLine(a[0]);\nConsole.WriteLine(a.Length);', 'Index 0 is the first item.', [g('Uses an int array', 'int\\[\\]')], 'Indexes start at 0.'),
    diy('Make int[] a = { 2, 5, 3 } and use a foreach loop to print the sum.', '10\n', 'int[] a = { 2, 5, 3 };\nint sum = 0;\nforeach (int v in a) sum += v;\nConsole.WriteLine(sum);', 'Keep a running total in sum.', [g('Uses foreach', '\\bforeach\\b')], ''),
  ],
  'Multidimensional Arrays': [
    diy('Make int[,] grid = { { 1, 2 }, { 3, 4 } } and print grid[1, 0].', '3\n', 'int[,] grid = { { 1, 2 }, { 3, 4 } };\nConsole.WriteLine(grid[1, 0]);', 'The first index is the row, the second is the column.', [g('Uses int[,]', 'int\\[\\s*,\\s*\\]')], ''),
  ],
  'Strings and String Manipulation': [
    diy('Make string s = "hello". Print it in capital letters.', 'HELLO\n', 'string s = "hello";\nConsole.WriteLine(s.ToUpper());', 'ToUpper() gives a new capital string.', [g('Uses ToUpper', 'ToUpper')], ''),
    diy('Print the first 3 letters of "Programming".', 'Pro\n', 'Console.WriteLine("Programming".Substring(0, 3));', 'Substring(0, 3) starts at 0 and takes 3 letters.', [g('Uses Substring', 'Substring')], ''),
  ],
  'Methods and Functions': [
    diy('Write a method static int Double(int n) that returns n * 2. Print Double(21).', '42\n', 'static int Double(int n)\n{\n    return n * 2;\n}\nConsole.WriteLine(Double(21));', 'Type the method above Main, inside class Program, then call it in Main.', [g('Declares a method', 'static\\s+int\\s+Double\\s*\\(')], ''),
  ],
  'Parameter Passing and Return Values': [
    diy('Write static void AddOne(ref int n) that adds 1. In Main make int x = 5, call AddOne(ref x) and print x.', '6\n', 'static void AddOne(ref int n)\n{\n    n++;\n}\nint x = 5;\nAddOne(ref x);\nConsole.WriteLine(x);', 'Use the ref keyword both in the method and in the call.', [g('Uses ref twice', 'ref[\\s\\S]*ref')], 'ref works on the original variable.'),
  ],
  'Recursion': [
    diy('Write a recursive method static int Sum(int n) that returns n + Sum(n - 1), stopping at 0. Print Sum(4).', '10\n', 'static int Sum(int n)\n{\n    if (n == 0) return 0;\n    return n + Sum(n - 1);\n}\nConsole.WriteLine(Sum(4));', 'The base case is n == 0.', [g('Calls itself', 'Sum\\s*\\([^)]*\\)[\\s\\S]*Sum\\s*\\(')], 'Every recursive method needs a base case.'),
  ],
  'Classes and Objects': [
    diy('Write a class Dog with a public string Name. Make a Dog, set Name to Rex and print the name.', '', 'class Dog { public string Name; }\n// in Main: Dog d = new Dog(); d.Name = "Rex"; Console.WriteLine(d.Name);', 'Use new Dog() to build the object.', [g('Declares class Dog', 'class\\s+Dog'), g('Creates an object with new', 'new\\s+Dog\\s*\\('), g('Sets the name to Rex', 'Rex')], 'The class is the blueprint, new builds the object.'),
  ],
  'Exception Handling (try, catch, finally)': [
    diy('Divide 10 by 0 inside a try. Catch DivideByZeroException and print Cannot divide.', 'Cannot divide\n', 'try\n{\n    int a = 10, b = 0;\n    Console.WriteLine(a / b);\n}\ncatch (DivideByZeroException)\n{\n    Console.WriteLine("Cannot divide");\n}', 'Put the risky line in try { } and the message in catch { }.', [g('Uses try and catch', '\\btry\\b[\\s\\S]*\\bcatch\\b')], 'catch handles the error.'),
  ],
  'Input Validation': [
    diy('Use int.TryParse on the text "abc". Print Invalid if it fails and Valid if it works.', 'Invalid\n', 'if (int.TryParse("abc", out int n)) Console.WriteLine("Valid");\nelse Console.WriteLine("Invalid");', 'TryParse returns true or false.', [g('Uses TryParse', 'TryParse')], 'TryParse never crashes.'),
  ],
  'File Handling': [
    diy('Write the text Hello to the file note.txt and then read it back with File.ReadAllText.', '', 'File.WriteAllText("note.txt", "Hello");\nConsole.WriteLine(File.ReadAllText("note.txt"));', 'You need using System.IO; at the top.', [g('Uses System.IO', 'System\\.IO'), g('Writes a file', 'WriteAllText|StreamWriter'), g('Reads a file', 'ReadAllText|StreamReader')], ''),
  ],
  'Collections (List, ArrayList)': [
    diy('Make a List<string> of Bread and Milk and print how many items it has.', '', 'List<string> items = new List<string>();\nitems.Add("Bread");\nitems.Add("Milk");\nConsole.WriteLine(items.Count);', 'You need using System.Collections.Generic; at the top.', [g('Uses List<string>', 'List<string>'), g('Uses Add', '\\.Add\\(')], ''),
  ],
  'Structures': [
    diy('Make a struct Point with int X and int Y. Create one with X = 3 and Y = 4.', '', 'struct Point { public int X; public int Y; }\n// in Main: Point p = new Point { X = 3, Y = 4 };', 'A struct looks like a class but uses the struct keyword.', [g('Declares struct Point', 'struct\\s+Point'), g('Has X and Y', 'X[\\s\\S]*Y')], 'A struct is a value type.'),
  ],
  'Windows Forms Applications': [
    diy('Write a Form class that sets its Text to My App and adds a Button.', '', 'class MainForm : Form { public MainForm() { Text = "My App"; Controls.Add(new Button()); } }', 'Inherit from Form and add controls with Controls.Add.', [g('Inherits Form', ':\\s*Form'), g('Sets Text', 'Text\\s*='), g('Adds a Button', 'Button')], ''),
  ],
  'Event Handling': [
    diy('Add a click handler to a button b using b.Click += OnClick; and write the OnClick method.', '', 'b.Click += OnClick;\nvoid OnClick(object sender, EventArgs e) { }', 'An event handler takes (object sender, EventArgs e).', [g('Subscribes with +=', 'Click\\s*\\+='), g('Has a handler', 'EventArgs')], ''),
  ],
  'Database Connectivity': [
    diy('Open a SqlConnection using a connection string and the using keyword.', '', 'using (SqlConnection con = new SqlConnection(cs))\n{\n    con.Open();\n}', 'using closes the connection for you.', [g('Uses SqlConnection', 'SqlConnection'), g('Opens it', '\\.Open\\(\\)')], ''),
  ],
  'CRUD Operations (Create, Read, Update, Delete)': [
    diy('Write an INSERT command with parameters @n and @a for a Students table.', '', 'var cmd = new SqlCommand("INSERT INTO Students (Name, Age) VALUES (@n, @a)", con);\ncmd.Parameters.AddWithValue("@n", "Amy");\ncmd.Parameters.AddWithValue("@a", 20);\ncmd.ExecuteNonQuery();', 'Parameters keep user input safe.', [g('Uses INSERT', 'INSERT\\s+INTO'), g('Uses parameters', 'Parameters\\.AddWithValue'), g('Runs it', 'ExecuteNonQuery')], 'Never join user text into SQL.'),
  ],
  'Classes: Properties and Inheritance': [
    diy('Write class Animal with a virtual method Speak and class Dog : Animal that overrides it.', '', 'class Animal { public virtual void Speak() { } }\nclass Dog : Animal { public override void Speak() { Console.WriteLine("Woof"); } }', 'Mark the parent method virtual and the child method override.', [g('Inherits', 'class\\s+Dog\\s*:\\s*Animal'), g('Uses virtual', '\\bvirtual\\b'), g('Uses override', '\\boverride\\b')], ''),
  ],
  'Static Members': [
    diy('Write a class Counter with a public static int Total that increases in the constructor.', '', 'class Counter\n{\n    public static int Total = 0;\n    public Counter() { Total++; }\n}', 'static means one copy for the whole class.', [g('Has a static field', 'static\\s+int\\s+Total'), g('Increases it', 'Total\\s*\\+\\+|Total\\s*\\+=')], ''),
  ],
};
