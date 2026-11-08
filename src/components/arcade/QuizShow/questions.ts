export interface QuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  category: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'What is the typeof NaN in JavaScript?',
    options: ['"undefined"', '"number"', '"NaN"', '"object"'],
    correctIndex: 1,
    explanation: 'In JavaScript IEEE-754 floating point standard, NaN is technically a numerical value indicating "Not-a-Number".',
    category: 'JavaScript',
  },
  {
    id: 'q2',
    question: 'Which HTTP status code is officially defined as "I\'m a teapot"?',
    options: ['402', '418', '429', '451'],
    correctIndex: 1,
    explanation: 'RFC 2324 (Hyper Text Coffee Pot Control Protocol) defined 418 as an April Fools joke in 1998, later standardized.',
    category: 'Networking',
  },
  {
    id: 'q3',
    question: 'How do you center a <div> horizontally and vertically with CSS Flexbox?',
    options: [
      'display: flex; justify-content: center; align-items: center;',
      'display: flex; text-align: center; vertical-align: middle;',
      'margin: auto auto; float: center;',
      'align-content: center; justify-items: center;'
    ],
    correctIndex: 0,
    explanation: '`justify-content: center` centers along the main axis, and `align-items: center` centers along the cross axis.',
    category: 'CSS',
  },
  {
    id: 'q4',
    question: 'What command completely wipes all uncommitted changes and resets to the latest commit?',
    options: ['git undo --all', 'git reset --hard HEAD', 'git clean -force', 'git revert last'],
    correctIndex: 1,
    explanation: '`git reset --hard HEAD` discards all staged and unstaged working tree changes back to the HEAD commit.',
    category: 'Git',
  },
  {
    id: 'q5',
    question: 'In React, what happens if you mutate state directly instead of calling setState()?',
    options: [
      'It throws a fatal SyntaxError',
      'The component will not re-render',
      'It triggers a double re-render',
      'The virtual DOM deletes the subtree'
    ],
    correctIndex: 1,
    explanation: 'React relies on shallow object reference equality. Mutating state in-place means the reference is unchanged, so no render triggers.',
    category: 'React',
  },
  {
    id: 'q6',
    question: 'What is the default port for PostgreSQL?',
    options: ['3306', '5432', '6379', '27017'],
    correctIndex: 1,
    explanation: 'PostgreSQL uses 5432. (MySQL uses 3306, Redis uses 6379, and MongoDB uses 27017).',
    category: 'Databases',
  },
  {
    id: 'q7',
    question: 'Which company originally created TypeScript?',
    options: ['Google', 'Meta', 'Microsoft', 'Mozilla'],
    correctIndex: 2,
    explanation: 'TypeScript was designed and developed by Anders Hejlsberg at Microsoft, first released in October 2012.',
    category: 'TypeScript',
  },
  {
    id: 'q8',
    question: 'What does "CORS" stand for?',
    options: [
      'Cross-Origin Resource Sharing',
      'Central Object Routing System',
      'Cross-Online Redirect Security',
      'Client Origin Request Standard'
    ],
    correctIndex: 0,
    explanation: 'Cross-Origin Resource Sharing is an HTTP-header based mechanism that allows servers to indicate any origins other than its own.',
    category: 'Security',
  },
  {
    id: 'q9',
    question: 'In Python, what is the result of `[1, 2] * 2`?',
    options: ['[2, 4]', '[1, 2, 1, 2]', '[[1, 2], [1, 2]]', 'Throws TypeError'],
    correctIndex: 1,
    explanation: 'The `*` operator on a list duplicates its elements, producing `[1, 2, 1, 2]`.',
    category: 'Python',
  },
  {
    id: 'q10',
    question: 'What does the `node_modules` folder commonly get memed as having the weight of?',
    options: ['A feather', 'The heaviest object in the universe', 'A floppy disk', '1 gigabyte per line of code'],
    correctIndex: 1,
    explanation: 'The classic astrophysics meme ranks the Sun, Neutron Stars, Black Holes, and finally `node_modules` as the heaviest object.',
    category: 'Dev Culture',
  },
];

