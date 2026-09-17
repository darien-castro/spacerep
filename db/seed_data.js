const starterDecks = [
  {
    name: 'Web Development',
    description: 'Core concepts in JavaScript, browser APIs, and asynchronous programming.',
    icon: '⚡',
    color: '#8b5cf6',
    cards: [
      {
        front: 'What is a closure in JavaScript?',
        back: 'A closure is a function bundled together with references to its surrounding lexical scope. It allows an inner function to access variables from an outer function even after the outer function has finished executing.',
        hint: 'Lexical scope retention.'
      },
      {
        front: 'What are the main phases of the Node.js / Browser Event Loop?',
        back: '1. Timers (setTimeout, setInterval)\n2. Pending callbacks (I/O)\n3. Poll (incoming requests & data)\n4. Check (setImmediate)\n5. Close callbacks\n* Microtasks (Promises, process.nextTick) drain between phases.',
        hint: 'Timers, I/O, Poll, Check, Close.'
      },
      {
        front: 'What is the difference between `Promise.all()` and `Promise.allSettled()`?',
        back: '`Promise.all` fails immediately if any promise rejects (short-circuit). `Promise.allSettled` waits for all promises to either resolve or reject, returning an array of objects with the status and value/reason of each.',
        hint: 'One is fail-fast; the other collects every result.'
      },
      {
        front: 'What is the difference between `==` and `===` in JavaScript?',
        back: '`==` performs type coercion before comparison (e.g., `"5" == 5` is true). `===` is strict equality and checks both value and type without coercion (e.g., `"5" === 5` is false).',
        hint: 'Loose equality vs strict equality.'
      },
      {
        front: 'Why choose SQLite over PostgreSQL for local applications?',
        back: 'SQLite is an in-process, serverless library that stores data in a single local file. There is no daemon to configure or maintain, zero network latency, and instant ACID transactions.',
        hint: 'Embedded in-process file, zero network setup.'
      }
    ]
  },
  {
    name: 'Computer Science Fundamentals',
    description: 'Data structures, algorithmic complexity, and foundational principles.',
    icon: '🧠',
    color: '#3b82f6',
    cards: [
      {
        front: 'What is the time complexity of Binary Search, and what is the prerequisite?',
        back: 'Time complexity: O(log n).\nPrerequisite: The input array or collection MUST already be sorted.',
        hint: 'Halving the search space each step.'
      },
      {
        front: 'What is the fundamental difference between a Stack and a Queue?',
        back: 'A Stack is LIFO (Last-In, First-Out) — like a stack of plates.\nA Queue is FIFO (First-In, First-Out) — like a line of people waiting.',
        hint: 'LIFO vs FIFO.'
      },
      {
        front: 'How do Hash Tables handle key collisions?',
        back: 'Common strategies include:\n1. Chaining: Each bucket holds a linked list of entries that hash to the same index.\n2. Open Addressing (Linear/Quadratic Probing): Probing for the next empty slot in the table.',
        hint: 'Chaining and Open Addressing.'
      },
      {
        front: 'What is the difference between a process and a thread?',
        back: 'A process is an independent execution unit with its own dedicated memory space and system resources. A thread is a lightweight execution unit within a process that shares memory and state with other threads of that process.',
        hint: 'Isolated memory vs shared memory.'
      }
    ]
  },
  {
    name: 'Spanish Essentials',
    description: 'High-frequency vocabulary and practical conversational phrases.',
    icon: '💬',
    color: '#10b981',
    cards: [
      {
        front: 'How do you say: "Could you please help me?"',
        back: '¿Podría ayudarme, por favor?',
        hint: 'Podría...'
      },
      {
        front: 'How do you say: "Where is the nearest subway station?"',
        back: '¿Dónde está la estación de metro más cercana?',
        hint: '¿Dónde está...?'
      },
      {
        front: 'What does "Mucho gusto" mean, and when is it used?',
        back: '"Nice to meet you" — used when greeting someone for the first time upon being introduced.',
        hint: 'Standard polite introduction.'
      },
      {
        front: 'How do you say: "How much does this cost?"',
        back: '¿Cuánto cuesta esto?',
        hint: '¿Cuánto...?'
      },
      {
        front: 'How do you say: "I would like a coffee with milk, please."',
        back: 'Me gustaría un café con leche, por favor.',
        hint: 'Café con leche...'
      }
    ]
  }
];

function seedDatabaseIfEmpty(db) {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM decks').get();
  if (countRow && countRow.count > 0) {
    return false;
  }

  const insertDeck = db.prepare(`
    INSERT INTO decks (name, description, icon, color)
    VALUES (?, ?, ?, ?)
  `);

  const insertCard = db.prepare(`
    INSERT INTO cards (deck_id, front, back, hint, orbit_level, interval_days, repetitions, ease_factor, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date().toISOString().split('T')[0];

  for (const deck of starterDecks) {
    const res = insertDeck.run(deck.name, deck.description, deck.icon, deck.color);
    const deckId = res.lastInsertRowid;

    for (let i = 0; i < deck.cards.length; i++) {
      const c = deck.cards[i];
      let initialOrbit = 1;
      let interval = 0;
      let reps = 0;
      let ease = 2.5;
      let lapses = 0;

      if (i === 0) {
        // Good territory: mature recall
        initialOrbit = 3;
        interval = 14;
        reps = 3;
        ease = 2.6;
      } else if (i === 1) {
        // Learning territory: recent study
        initialOrbit = 2;
        interval = 3;
        reps = 1;
        ease = 2.5;
      } else if (i === 2 && deck.name === 'Web Development') {
        // Bad territory: lapsed card
        initialOrbit = 1;
        interval = 1;
        reps = 1;
        ease = 1.8;
        lapses = 1;
      } else {
        // New card: unreviewed
        initialOrbit = 1;
        interval = 0;
        reps = 0;
        ease = 2.5;
      }

      insertCard.run(
        deckId,
        c.front,
        c.back,
        c.hint,
        initialOrbit,
        interval,
        reps,
        ease,
        today
      );
    }
  }

  console.log('Successfully seeded database with starter decks.');
  return true;
}

module.exports = {
  starterDecks,
  seedDatabaseIfEmpty
};
