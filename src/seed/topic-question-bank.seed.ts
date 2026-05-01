import { Difficulty, PrismaClient, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

type McqSeed = {
  questionText: string;
  difficulty: Difficulty;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type ShortSeed = {
  questionText: string;
  difficulty: Difficulty;
  correctAnswer: string;
  explanation: string;
};

type TopicSeed = {
  title: string;
  slug: string;
  description: string;
  mcqs: McqSeed[];
  shorts: ShortSeed[];
};

type ExamSeed = {
  title: string;
  level: string;
  difficulty: Difficulty;
  questionCount: number;
  durationSeconds: number;
  topicSlugs?: string[];
  questionType?: QuestionType;
  questionDifficulty?: Difficulty;
};

const topics: TopicSeed[] = [
  {
    title: 'Arithmetic aptitude',
    slug: 'arithmetic-aptitude',
    description:
      'Practice questions for percentages, ratios, averages, profit and loss, time, work, and speed.',
    mcqs: [
      mcq('What is 15% of 240?', ['24', '30', '36', '42'], 2),
      mcq(
        'If a number is increased by 20% and becomes 180, what was the original number?',
        ['120', '135', '150', '160'],
        2,
      ),
      mcq('The average of 12, 18, 20, and 30 is:', ['18', '20', '22', '24'], 1),
      mcq(
        'A shopkeeper buys an item for Rs. 500 and sells it for Rs. 625. What is the profit percentage?',
        ['20%', '25%', '30%', '35%'],
        1,
      ),
      mcq(
        'If 6 workers finish a task in 10 days, how many days will 15 workers take at the same rate?',
        ['3 days', '4 days', '5 days', '6 days'],
        1,
      ),
      mcq(
        'The ratio 18:24 in simplest form is:',
        ['2:3', '3:4', '4:5', '5:6'],
        1,
      ),
      mcq(
        'A train travels 180 km in 3 hours. What is its speed?',
        ['45 km/h', '50 km/h', '60 km/h', '70 km/h'],
        2,
      ),
      mcq(
        'Simple interest on Rs. 2000 at 5% per annum for 3 years is:',
        ['Rs. 200', 'Rs. 250', 'Rs. 300', 'Rs. 350'],
        2,
      ),
      mcq(
        'What is the value of 7/8 as a percentage?',
        ['75%', '82.5%', '87.5%', '90%'],
        2,
      ),
      mcq('If x + 25 = 60, then x is:', ['25', '30', '35', '40'], 2),
      mcq(
        'The least common multiple of 12 and 18 is:',
        ['24', '30', '36', '72'],
        2,
      ),
      mcq(
        'A man spends 60% of his salary and saves Rs. 8000. His salary is:',
        ['Rs. 16000', 'Rs. 18000', 'Rs. 20000', 'Rs. 24000'],
        2,
      ),
      mcq(
        'If 9 pens cost Rs. 72, what is the cost of 14 pens?',
        ['Rs. 96', 'Rs. 104', 'Rs. 112', 'Rs. 120'],
        2,
      ),
      mcq('The square root of 2025 is:', ['35', '40', '45', '50'], 2),
      mcq(
        'A discount of 10% on Rs. 750 gives a selling price of:',
        ['Rs. 650', 'Rs. 675', 'Rs. 700', 'Rs. 725'],
        1,
      ),
      mcq(
        'Two numbers are in the ratio 5:7 and their sum is 96. The larger number is:',
        ['40', '48', '56', '60'],
        2,
      ),
      mcq(
        'The compound interest on Rs. 1000 at 10% for 2 years is:',
        ['Rs. 100', 'Rs. 200', 'Rs. 210', 'Rs. 220'],
        2,
      ),
      mcq(
        'If a car covers 150 km in 2.5 hours, its speed is:',
        ['50 km/h', '55 km/h', '60 km/h', '65 km/h'],
        2,
      ),
    ],
    shorts: [
      short('What is 9 multiplied by 8?', '72'),
      short('How many minutes are there in 3 hours?', '180'),
      short('What is the HCF of 15 and 25?', '5'),
      short('What is 25 squared?', '625'),
    ],
  },
  {
    title: 'Verbel ability',
    slug: 'verbel-ability',
    description:
      'Practice questions for vocabulary, grammar, sentence correction, and reading fundamentals.',
    mcqs: [
      mcq(
        'Choose the synonym of "Rapid".',
        ['Slow', 'Quick', 'Weak', 'Late'],
        1,
      ),
      mcq(
        'Choose the antonym of "Ancient".',
        ['Old', 'Modern', 'Historic', 'Past'],
        1,
      ),
      mcq(
        'Select the correctly spelled word.',
        ['Accomodate', 'Acommodate', 'Accommodate', 'Acomodate'],
        2,
      ),
      mcq(
        'Identify the noun in the sentence: "The child laughed loudly."',
        ['child', 'laughed', 'loudly', 'the'],
        0,
      ),
      mcq(
        'Choose the correct article: "She bought ___ umbrella."',
        ['a', 'an', 'the', 'no article'],
        1,
      ),
      mcq(
        'Pick the correct sentence.',
        [
          'He go to school.',
          'He goes to school.',
          'He going to school.',
          'He gone to school.',
        ],
        1,
      ),
      mcq(
        'Choose the antonym of "Generous".',
        ['Kind', 'Selfish', 'Helpful', 'Brave'],
        1,
      ),
      mcq(
        'Fill in the blank: They have been waiting ___ morning.',
        ['since', 'for', 'from', 'by'],
        0,
      ),
      mcq(
        'Choose the correct plural of "analysis".',
        ['analysises', 'analysis', 'analyses', 'analysi'],
        2,
      ),
      mcq(
        'Which word is an adjective?',
        ['beauty', 'beautiful', 'beautify', 'beautifully'],
        1,
      ),
      mcq(
        'Choose the synonym of "Brief".',
        ['Short', 'Long', 'Heavy', 'Clear'],
        0,
      ),
      mcq(
        'Find the error: "Neither of the answers are correct."',
        ['Neither', 'of the', 'are', 'correct'],
        2,
      ),
      mcq(
        'Choose the correct preposition: He is good ___ mathematics.',
        ['in', 'at', 'on', 'by'],
        1,
      ),
      mcq(
        'Choose the passive voice: "The teacher praised the student."',
        [
          'The student praised the teacher.',
          'The student was praised by the teacher.',
          'The teacher was praised by the student.',
          'The student is praising the teacher.',
        ],
        1,
      ),
      mcq(
        'Choose the word closest in meaning to "Reluctant".',
        ['Eager', 'Unwilling', 'Certain', 'Joyful'],
        1,
      ),
      mcq(
        'Fill in: I prefer tea ___ coffee.',
        ['than', 'over', 'to', 'from'],
        2,
      ),
      mcq(
        'Choose the correct tense: "She ___ here since 2020."',
        ['works', 'worked', 'has worked', 'will work'],
        2,
      ),
      mcq(
        'Choose the correctly punctuated sentence.',
        [
          'What a beautiful day!',
          'What a beautiful day.',
          'What a beautiful day?',
          'What a beautiful day,',
        ],
        0,
      ),
    ],
    shorts: [
      short('Write the opposite of "hot".', 'cold'),
      short('Write the plural of "child".', 'children'),
      short('Write one word for a person who writes poems.', 'poet'),
      short('Write the past tense of "go".', 'went'),
    ],
  },
  {
    title: 'Reasoning',
    slug: 'reasoning',
    description:
      'Practice questions for series, analogies, directions, coding-decoding, and logical reasoning.',
    mcqs: [
      mcq('Find the next number: 2, 4, 8, 16, __', ['18', '24', '32', '36'], 2),
      mcq(
        'If CAT is coded as DBU, then DOG is coded as:',
        ['EPH', 'EPI', 'FQH', 'DPI'],
        0,
      ),
      mcq(
        'Book is to Reading as Fork is to:',
        ['Writing', 'Eating', 'Drawing', 'Sleeping'],
        1,
      ),
      mcq(
        'Find the odd one out.',
        ['Square', 'Circle', 'Triangle', 'Apple'],
        3,
      ),
      mcq(
        'If A is east of B and C is east of A, then C is ___ of B.',
        ['west', 'east', 'north', 'south'],
        1,
      ),
      mcq(
        'Find the missing term: 3, 6, 11, 18, __',
        ['25', '27', '29', '31'],
        1,
      ),
      mcq('Which number is different?', ['16', '25', '36', '45'], 3),
      mcq(
        'If today is Monday, what day will it be after 10 days?',
        ['Wednesday', 'Thursday', 'Friday', 'Saturday'],
        1,
      ),
      mcq(
        'Complete the analogy: Eye : See :: Ear : __',
        ['Speak', 'Hear', 'Walk', 'Think'],
        1,
      ),
      mcq('Find the next letter: A, C, F, J, O, __', ['S', 'T', 'U', 'V'], 2),
      mcq(
        'If 5 + 3 = 28 and 6 + 2 = 48, then 7 + 1 = ?',
        ['56', '63', '48', '42'],
        0,
      ),
      mcq(
        'A person walks 5 km north, then 3 km east. In which direction is he from the starting point?',
        ['North-East', 'South-East', 'North-West', 'South-West'],
        0,
      ),
      mcq(
        'Choose the pair that has the same relationship: Doctor : Hospital',
        ['Teacher : School', 'Farmer : Crop', 'Pen : Paper', 'Car : Road'],
        0,
      ),
      mcq(
        'Find the next number: 1, 1, 2, 3, 5, 8, __',
        ['10', '11', '13', '15'],
        2,
      ),
      mcq(
        'If all roses are flowers and some flowers fade, which is definitely true?',
        [
          'All roses fade',
          'Some roses fade',
          'All roses are flowers',
          'No flowers fade',
        ],
        2,
      ),
      mcq(
        'Arrange in logical order: Infant, Adult, Child, Teenager',
        [
          'Infant, Child, Teenager, Adult',
          'Child, Infant, Adult, Teenager',
          'Adult, Teenager, Child, Infant',
          'Infant, Teenager, Child, Adult',
        ],
        0,
      ),
      mcq(
        'Which shape has exactly three sides?',
        ['Square', 'Circle', 'Triangle', 'Rectangle'],
        2,
      ),
      mcq(
        'If RED is coded as 1854 using A=1, B=2..., what is the code for BAD?',
        ['214', '241', '124', '412'],
        0,
      ),
    ],
    shorts: [
      short('What comes next: 10, 20, 30, 40, __?', '50'),
      short('How many sides does a hexagon have?', '6'),
      short('If A=1, what is C?', '3'),
      short('What is the opposite direction of North?', 'south'),
    ],
  },
  {
    title: 'Java programming',
    slug: 'java-programming',
    description:
      'Practice questions for Java basics, OOP, collections, exceptions, and core language behavior.',
    mcqs: [
      mcq(
        'Which keyword is used to inherit a class in Java?',
        ['implements', 'extends', 'inherits', 'super'],
        1,
      ),
      mcq(
        'Which method is the entry point of a Java program?',
        ['start()', 'main()', 'run()', 'init()'],
        1,
      ),
      mcq(
        'Which of these is not a primitive data type in Java?',
        ['int', 'boolean', 'String', 'char'],
        2,
      ),
      mcq(
        'Which keyword is used to create an object?',
        ['class', 'this', 'new', 'static'],
        2,
      ),
      mcq(
        'What is JVM?',
        [
          'Java Variable Method',
          'Java Virtual Machine',
          'Java Verified Module',
          'Joint Virtual Method',
        ],
        1,
      ),
      mcq(
        'Which access modifier gives widest visibility?',
        ['private', 'protected', 'public', 'default'],
        2,
      ),
      mcq(
        'Which collection does not allow duplicate elements?',
        ['List', 'Set', 'Map', 'Queue'],
        1,
      ),
      mcq(
        'Which block is always executed after try-catch?',
        ['final', 'finally', 'finish', 'default'],
        1,
      ),
      mcq(
        'Which keyword prevents method overriding?',
        ['static', 'final', 'abstract', 'volatile'],
        1,
      ),
      mcq(
        'Which operator is used to compare object references?',
        ['=', '==', 'equals', '==='],
        1,
      ),
      mcq(
        'Which interface is commonly used for sorting custom objects?',
        ['Runnable', 'Comparable', 'Serializable', 'Cloneable'],
        1,
      ),
      mcq(
        'What is the default value of a boolean field?',
        ['true', 'false', '0', 'null'],
        1,
      ),
      mcq(
        'Which package contains ArrayList?',
        ['java.io', 'java.util', 'java.lang', 'java.net'],
        1,
      ),
      mcq(
        'Which keyword is used to define an interface?',
        ['interface', 'implements', 'abstract', 'class'],
        0,
      ),
      mcq(
        'Which exception is checked?',
        [
          'NullPointerException',
          'ArithmeticException',
          'IOException',
          'ArrayIndexOutOfBoundsException',
        ],
        2,
      ),
      mcq(
        'Which concept allows many forms of a method?',
        ['Encapsulation', 'Inheritance', 'Polymorphism', 'Abstraction'],
        2,
      ),
      mcq(
        'Which class is immutable?',
        ['String', 'StringBuilder', 'ArrayList', 'HashMap'],
        0,
      ),
      mcq(
        'Which loop runs at least once?',
        ['for', 'while', 'do-while', 'foreach'],
        2,
      ),
    ],
    shorts: [
      short('Which keyword refers to the current object in Java?', 'this'),
      short('What is the file extension of compiled Java bytecode?', 'class'),
      short('Name the superclass of all Java classes.', 'Object'),
      short('Which keyword is used to handle exceptions?', 'catch'),
    ],
  },
  {
    title: 'Database',
    slug: 'database',
    description:
      'Practice questions covering MySQL, PostgreSQL, MongoDB, SQL basics, indexing, and transactions.',
    mcqs: [
      mcq(
        'Which SQL command is used to retrieve data?',
        ['INSERT', 'UPDATE', 'SELECT', 'DELETE'],
        2,
      ),
      mcq(
        'Which clause filters rows before grouping?',
        ['HAVING', 'WHERE', 'ORDER BY', 'GROUP BY'],
        1,
      ),
      mcq(
        'Which key uniquely identifies a row?',
        ['Foreign key', 'Primary key', 'Candidate list', 'Index key'],
        1,
      ),
      mcq(
        'Which SQL command removes all rows but keeps the table structure?',
        ['DROP', 'DELETE', 'TRUNCATE', 'ALTER'],
        2,
      ),
      mcq(
        'Which join returns matching rows from both tables?',
        ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN'],
        0,
      ),
      mcq(
        'MongoDB stores records as:',
        ['Rows', 'Documents', 'Tables', 'Schemas'],
        1,
      ),
      mcq(
        'Which PostgreSQL data type stores JSON with binary optimization?',
        ['JSON', 'JSONB', 'TEXT', 'XML'],
        1,
      ),
      mcq(
        'Which MySQL engine supports transactions by default?',
        ['MyISAM', 'MEMORY', 'CSV', 'InnoDB'],
        3,
      ),
      mcq(
        'Which command creates an index?',
        ['CREATE INDEX', 'ADD KEYSPACE', 'MAKE INDEX', 'BUILD TABLE'],
        0,
      ),
      mcq(
        'What does ACID stand for in databases?',
        [
          'Atomicity, Consistency, Isolation, Durability',
          'Access, Control, Index, Data',
          'Atomicity, Control, Integrity, Durability',
          'Access, Consistency, Isolation, Data',
        ],
        0,
      ),
      mcq(
        'Which clause is used with aggregate conditions?',
        ['WHERE', 'HAVING', 'LIMIT', 'OFFSET'],
        1,
      ),
      mcq(
        'Which SQL function counts rows?',
        ['SUM()', 'COUNT()', 'AVG()', 'MAX()'],
        1,
      ),
      mcq(
        'Which MongoDB method inserts one document?',
        ['insertOne()', 'addOne()', 'pushOne()', 'createRow()'],
        0,
      ),
      mcq(
        'Which PostgreSQL command shows query execution plan?',
        ['DESCRIBE', 'EXPLAIN', 'PROFILE', 'PLAN'],
        1,
      ),
      mcq(
        'Which normal form removes partial dependency?',
        ['1NF', '2NF', '3NF', 'BCNF'],
        1,
      ),
      mcq(
        'Which operator checks pattern matching in SQL?',
        ['LIKE', 'MATCH', 'FIND', 'SEARCH'],
        0,
      ),
      mcq(
        'Which SQL statement changes table structure?',
        ['ALTER TABLE', 'UPDATE TABLE', 'MODIFY ROW', 'CHANGE DATA'],
        0,
      ),
      mcq(
        'Which database is document-oriented?',
        ['MySQL', 'PostgreSQL', 'MongoDB', 'SQLite'],
        2,
      ),
    ],
    shorts: [
      short('Which SQL keyword sorts result rows?', 'ORDER BY'),
      short('Name the default port of PostgreSQL.', '5432'),
      short('Name the default port of MySQL.', '3306'),
      short('In MongoDB, a group of documents is called a what?', 'collection'),
    ],
  },
];

const extraQuestionsByTopic: Record<
  string,
  { mcqs: McqSeed[]; shorts: ShortSeed[] }
> = {
  'arithmetic-aptitude': {
    mcqs: [
      mcq(
        'A sum becomes Rs. 6050 in 2 years at 10% compound interest. What was the principal?',
        ['Rs. 4500', 'Rs. 5000', 'Rs. 5500', 'Rs. 6000'],
        1,
        Difficulty.HARD,
      ),
      mcq(
        'A pipe fills a tank in 12 hours and another pipe empties it in 18 hours. If both are opened, when will the tank fill?',
        ['24 hours', '30 hours', '36 hours', '40 hours'],
        2,
        Difficulty.HARD,
      ),
    ],
    shorts: [
      short('What is the next prime number after 47?', '53', Difficulty.MEDIUM),
    ],
  },
  'verbel-ability': {
    mcqs: [
      mcq(
        'Choose the best replacement: "Despite of the rain, we continued."',
        [
          'Despite the rain, we continued.',
          'Despite for the rain, we continued.',
          'Despite with the rain, we continued.',
          'Despite to the rain, we continued.',
        ],
        0,
        Difficulty.MEDIUM,
      ),
      mcq(
        'Choose the word nearest in meaning to "Pragmatic".',
        ['Idealistic', 'Practical', 'Careless', 'Decorative'],
        1,
        Difficulty.HARD,
      ),
    ],
    shorts: [
      short(
        'Write one word for fear of heights.',
        'acrophobia',
        Difficulty.HARD,
      ),
    ],
  },
  reasoning: {
    mcqs: [
      mcq(
        'In a row, A is 7th from the left and 11th from the right. How many people are in the row?',
        ['17', '18', '19', '20'],
        0,
        Difficulty.MEDIUM,
      ),
      mcq(
        'If CLOCK is coded as DMPDL, then WATCH is coded as:',
        ['XBUDI', 'XBUCI', 'VZSBG', 'YBUDI'],
        0,
        Difficulty.HARD,
      ),
    ],
    shorts: [
      short('What comes next: 2, 6, 12, 20, 30, __?', '42', Difficulty.MEDIUM),
    ],
  },
  'java-programming': {
    mcqs: [
      mcq(
        'Which Java collection offers constant-time basic operations and no guaranteed order?',
        ['ArrayList', 'TreeSet', 'HashSet', 'LinkedList'],
        2,
        Difficulty.MEDIUM,
      ),
      mcq(
        'Which concept hides internal implementation and exposes only essential behavior?',
        ['Inheritance', 'Abstraction', 'Overloading', 'Serialization'],
        1,
        Difficulty.MEDIUM,
      ),
    ],
    shorts: [
      short(
        'Which Java keyword is used to create a subclass contract without implementation?',
        'abstract',
        Difficulty.HARD,
      ),
    ],
  },
  database: {
    mcqs: [
      mcq(
        'Which isolation level prevents dirty reads but may allow non-repeatable reads?',
        [
          'READ UNCOMMITTED',
          'READ COMMITTED',
          'REPEATABLE READ',
          'SERIALIZABLE',
        ],
        1,
        Difficulty.HARD,
      ),
      mcq(
        'Which MongoDB aggregation stage filters documents?',
        ['$group', '$sort', '$match', '$project'],
        2,
        Difficulty.MEDIUM,
      ),
    ],
    shorts: [
      short(
        'Which SQL keyword removes duplicate rows from output?',
        'DISTINCT',
        Difficulty.MEDIUM,
      ),
    ],
  },
};

const exams: ExamSeed[] = [
  {
    title: 'Beginner Aptitude MCQ Warmup',
    level: 'Beginner',
    difficulty: Difficulty.EASY,
    questionCount: 10,
    durationSeconds: 10 * 60,
    topicSlugs: ['arithmetic-aptitude', 'reasoning'],
    questionType: QuestionType.MCQ,
    questionDifficulty: Difficulty.EASY,
  },
  {
    title: 'Intermediate Aptitude Sprint',
    level: 'Intermediate',
    difficulty: Difficulty.MEDIUM,
    questionCount: 20,
    durationSeconds: 15 * 60,
    topicSlugs: ['arithmetic-aptitude', 'reasoning'],
  },
  {
    title: 'Intermediate Verbal and Database Check',
    level: 'Intermediate',
    difficulty: Difficulty.MEDIUM,
    questionCount: 20,
    durationSeconds: 15 * 60,
    topicSlugs: ['verbel-ability', 'database'],
  },
  {
    title: 'Advanced Java and Database Mock',
    level: 'Advanced',
    difficulty: Difficulty.HARD,
    questionCount: 30,
    durationSeconds: 25 * 60,
    topicSlugs: ['java-programming', 'database'],
  },
  {
    title: 'Advanced Reasoning and Arithmetic Mock',
    level: 'Advanced',
    difficulty: Difficulty.HARD,
    questionCount: 30,
    durationSeconds: 25 * 60,
    topicSlugs: ['reasoning', 'arithmetic-aptitude'],
  },
  {
    title: 'Advanced Full-Length Placement Mock',
    level: 'Advanced',
    difficulty: Difficulty.HARD,
    questionCount: 50,
    durationSeconds: 30 * 60,
  },
];

function mcq(
  questionText: string,
  options: string[],
  correctIndex: number,
  difficulty: Difficulty = Difficulty.EASY,
): McqSeed {
  return {
    questionText,
    options,
    correctIndex,
    difficulty,
    explanation:
      getCalculationExplanation(questionText) ??
      explanationHtml(
        `The correct answer is <strong>${escapeHtml(options[correctIndex])}</strong>.`,
        'Check the meaning of the question and eliminate the options that do not match it.',
      ),
  };
}

function short(
  questionText: string,
  correctAnswer: string,
  difficulty: Difficulty = Difficulty.EASY,
): ShortSeed {
  return {
    questionText,
    correctAnswer,
    difficulty,
    explanation:
      getCalculationExplanation(questionText) ??
      explanationHtml(
        `The expected answer is <strong>${escapeHtml(correctAnswer)}</strong>.`,
        'For one-word answers, spelling and the exact concept matter.',
      ),
  };
}

function explanationHtml(answer: string, detail: string) {
  return `<div style="font-family:Inter,Arial,sans-serif;line-height:1.55;color:#1f2937;">
  <p style="margin:0 0 8px;font-weight:700;color:#111827;">Explanation</p>
  <p style="margin:0 0 6px;">${answer}</p>
  <p style="margin:0;">${detail}</p>
</div>`;
}

function calcHtml(lines: string[], answer: string) {
  return `<div style="font-family:Inter,Arial,sans-serif;line-height:1.55;color:#1f2937;">
  <p style="margin:0 0 8px;font-weight:700;color:#111827;">Calculation</p>
  <ol style="margin:0 0 8px 18px;padding:0;">
    ${lines.map((line) => `<li style="margin:0 0 4px;">${line}</li>`).join('\n    ')}
  </ol>
  <p style="margin:0;font-weight:700;color:#312e81;">Answer: ${answer}</p>
</div>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getCalculationExplanation(questionText: string) {
  const calculationExplanations: Record<string, string> = {
    'What is 15% of 240?': calcHtml(
      ['15% of 240 = (15 / 100) × 240', '= 0.15 × 240', '= 36'],
      '36',
    ),
    'If a number is increased by 20% and becomes 180, what was the original number?':
      calcHtml(
        [
          'Let the original number be x.',
          '120% of x = 180',
          'x = 180 × 100 / 120 = 150',
        ],
        '150',
      ),
    'The average of 12, 18, 20, and 30 is:': calcHtml(
      ['Average = (12 + 18 + 20 + 30) / 4', '= 80 / 4', '= 20'],
      '20',
    ),
    'A shopkeeper buys an item for Rs. 500 and sells it for Rs. 625. What is the profit percentage?':
      calcHtml(
        ['Profit = 625 - 500 = 125', 'Profit % = (125 / 500) × 100', '= 25%'],
        '25%',
      ),
    'If 6 workers finish a task in 10 days, how many days will 15 workers take at the same rate?':
      calcHtml(
        [
          'Total work = 6 × 10 = 60 worker-days',
          'Days for 15 workers = 60 / 15',
          '= 4 days',
        ],
        '4 days',
      ),
    'The ratio 18:24 in simplest form is:': calcHtml(
      ['HCF of 18 and 24 is 6.', '18:24 = (18 / 6):(24 / 6)', '= 3:4'],
      '3:4',
    ),
    'A train travels 180 km in 3 hours. What is its speed?': calcHtml(
      ['Speed = Distance / Time', '= 180 / 3', '= 60 km/h'],
      '60 km/h',
    ),
    'Simple interest on Rs. 2000 at 5% per annum for 3 years is:': calcHtml(
      [
        'Simple Interest = (P × R × T) / 100',
        '= (2000 × 5 × 3) / 100',
        '= Rs. 300',
      ],
      'Rs. 300',
    ),
    'What is the value of 7/8 as a percentage?': calcHtml(
      ['Percentage = (7 / 8) × 100', '= 0.875 × 100', '= 87.5%'],
      '87.5%',
    ),
    'If x + 25 = 60, then x is:': calcHtml(
      ['x + 25 = 60', 'x = 60 - 25', 'x = 35'],
      '35',
    ),
    'The least common multiple of 12 and 18 is:': calcHtml(
      ['12 = 2 × 2 × 3', '18 = 2 × 3 × 3', 'LCM = 2 × 2 × 3 × 3 = 36'],
      '36',
    ),
    'A man spends 60% of his salary and saves Rs. 8000. His salary is:':
      calcHtml(
        [
          'If he spends 60%, he saves 40%.',
          '40% of salary = 8000',
          'Salary = 8000 × 100 / 40 = 20000',
        ],
        'Rs. 20000',
      ),
    'If 9 pens cost Rs. 72, what is the cost of 14 pens?': calcHtml(
      ['Cost of 1 pen = 72 / 9 = 8', 'Cost of 14 pens = 14 × 8', '= Rs. 112'],
      'Rs. 112',
    ),
    'The square root of 2025 is:': calcHtml(
      ['45 × 45 = 2025', 'So √2025 = 45'],
      '45',
    ),
    'A discount of 10% on Rs. 750 gives a selling price of:': calcHtml(
      ['Discount = 10% of 750 = 75', 'Selling price = 750 - 75', '= Rs. 675'],
      'Rs. 675',
    ),
    'Two numbers are in the ratio 5:7 and their sum is 96. The larger number is:':
      calcHtml(
        [
          'Total ratio parts = 5 + 7 = 12',
          'One part = 96 / 12 = 8',
          'Larger number = 7 × 8 = 56',
        ],
        '56',
      ),
    'The compound interest on Rs. 1000 at 10% for 2 years is:': calcHtml(
      [
        'Amount = 1000 × (1 + 10/100)²',
        '= 1000 × 1.21 = 1210',
        'Compound Interest = 1210 - 1000 = 210',
      ],
      'Rs. 210',
    ),
    'If a car covers 150 km in 2.5 hours, its speed is:': calcHtml(
      ['Speed = Distance / Time', '= 150 / 2.5', '= 60 km/h'],
      '60 km/h',
    ),
    'What is 9 multiplied by 8?': calcHtml(['9 × 8 = 72'], '72'),
    'How many minutes are there in 3 hours?': calcHtml(
      ['1 hour = 60 minutes', '3 hours = 3 × 60 = 180 minutes'],
      '180',
    ),
    'What is the HCF of 15 and 25?': calcHtml(
      [
        'Factors of 15 are 1, 3, 5, 15.',
        'Factors of 25 are 1, 5, 25.',
        'Highest common factor is 5.',
      ],
      '5',
    ),
    'What is 25 squared?': calcHtml(['25² = 25 × 25', '= 625'], '625'),
  };

  return calculationExplanations[questionText];
}

async function seed() {
  await resetContentData();

  for (const topicSeed of topics) {
    const topic = await prisma.topic.create({
      data: {
        title: topicSeed.title,
        slug: topicSeed.slug,
        description: topicSeed.description,
        isPremium: false,
      },
      select: { id: true, title: true, slug: true },
    });

    await seedQuestions(topic.id, topicSeed.mcqs, topicSeed.shorts);

    const extraQuestions = extraQuestionsByTopic[topic.slug];
    if (extraQuestions) {
      await seedQuestions(topic.id, extraQuestions.mcqs, extraQuestions.shorts);
    }

    const totalQuestions =
      topicSeed.mcqs.length +
      topicSeed.shorts.length +
      (extraQuestions?.mcqs.length ?? 0) +
      (extraQuestions?.shorts.length ?? 0);

    console.log(`Seeded ${topic.title}: ${totalQuestions} questions`);
  }

  await seedExams();
}

async function resetContentData() {
  await prisma.answer.deleteMany();
  await prisma.testAttemptQuestionState.deleteMany();
  await prisma.testAttempt.deleteMany();
  await prisma.testQuestion.deleteMany();
  await prisma.test.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.editorTopicPermission.deleteMany();
  await prisma.question.updateMany({ data: { correctOptionId: null } });
  await prisma.mcqOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.topic.deleteMany();

  console.log('Cleared old topic, question, test, and attempt data.');
}

async function seedQuestions(
  topicId: string,
  mcqs: McqSeed[],
  shorts: ShortSeed[],
) {
  for (const questionSeed of mcqs) {
    const question = await prisma.question.create({
      data: {
        topicId,
        type: QuestionType.MCQ,
        questionText: questionSeed.questionText,
        difficulty: questionSeed.difficulty,
        explanation: questionSeed.explanation,
        isPremium: false,
      },
      select: { id: true },
    });

    let correctOptionId: string | undefined;
    for (const [index, optionText] of questionSeed.options.entries()) {
      const option = await prisma.mcqOption.create({
        data: {
          questionId: question.id,
          optionText,
          displayOrder: index,
        },
        select: { id: true },
      });

      if (index === questionSeed.correctIndex) {
        correctOptionId = option.id;
      }
    }

    await prisma.question.update({
      where: { id: question.id },
      data: { correctOptionId },
    });
  }

  for (const questionSeed of shorts) {
    await prisma.question.create({
      data: {
        topicId,
        type: QuestionType.SHORT_ANSWER,
        questionText: questionSeed.questionText,
        difficulty: questionSeed.difficulty,
        explanation: questionSeed.explanation,
        correctAnswer: questionSeed.correctAnswer,
        caseInsensitiveMatch: true,
        isPremium: false,
      },
    });
  }
}

async function seedExams() {
  for (const exam of exams) {
    const questions = await getExamQuestions(exam);

    if (questions.length < exam.questionCount) {
      throw new Error(
        `${exam.title} needs ${exam.questionCount} questions but only ${questions.length} are available.`,
      );
    }

    const test = await prisma.test.create({
      data: {
        title: exam.title,
        difficulty: exam.difficulty,
        isTimed: true,
        durationSeconds: exam.durationSeconds,
        isPremium: false,
      },
      select: { id: true, title: true },
    });

    for (const [index, question] of questions
      .slice(0, exam.questionCount)
      .entries()) {
      await prisma.testQuestion.create({
        data: {
          testId: test.id,
          questionId: question.id,
          displayOrder: index,
          points: 1,
        },
      });
    }

    console.log(
      `Seeded exam ${test.title}: ${exam.questionCount} questions, ${exam.durationSeconds / 60} minutes`,
    );
  }
}

async function getExamQuestions(exam: ExamSeed) {
  const questions = await prisma.question.findMany({
    where: exam.topicSlugs?.length
      ? {
          topic: {
            slug: { in: exam.topicSlugs },
          },
          ...(exam.questionType ? { type: exam.questionType } : {}),
          ...(exam.questionDifficulty
            ? { difficulty: exam.questionDifficulty }
            : {}),
        }
      : exam.questionType
        ? {
            type: exam.questionType,
            ...(exam.questionDifficulty
              ? { difficulty: exam.questionDifficulty }
              : {}),
          }
        : exam.questionDifficulty
          ? { difficulty: exam.questionDifficulty }
        : {},
    orderBy: [{ difficulty: 'desc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      difficulty: true,
    },
  });

  return questions.sort((first, second) => {
    const firstWeight = difficultyWeight(first.difficulty);
    const secondWeight = difficultyWeight(second.difficulty);
    return secondWeight - firstWeight;
  });
}

function difficultyWeight(difficulty: Difficulty) {
  if (difficulty === Difficulty.HARD) return 3;
  if (difficulty === Difficulty.MEDIUM) return 2;
  return 1;
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
