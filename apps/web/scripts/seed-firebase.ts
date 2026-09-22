import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log("Connecting to Firebase Project:", firebaseConfig.projectId);

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Firebase config is missing in .env");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const STARTER_DECKS = [
  {
    id: "deck-frontend-mastery",
    title: "Web & Frontend Mastery",
    description: "Core concepts of modern web development, React, Next.js, and CSS layout architecture.",
    tags: ["Frontend", "React", "Next.js", "Web"],
    cards: [
      {
        id: "card-fe-1",
        question: "What is the primary function of React's useEffect hook?",
        answer: "To handle side effects like data fetching, subscriptions, or manually manipulating the DOM after render.",
        tags: ["React", "JavaScript", "Frontend"],
        difficulty: 2,
        createdAt: Date.now(),
        reviewCount: 0,
        correctCount: 0,
      },
      {
        id: "card-fe-2",
        question: "What is Cloud Firestore in Firebase?",
        answer: "A flexible, scalable NoSQL document database for mobile, web, and server development from Firebase and Google Cloud.",
        tags: ["Firebase", "Database", "Backend"],
        difficulty: 2,
        createdAt: Date.now(),
        reviewCount: 0,
        correctCount: 0,
      },
      {
        id: "card-fe-3",
        question: "What does CSS 'box-sizing: border-box' do?",
        answer: "It includes padding and border in the element's total width and height calculations.",
        tags: ["CSS", "Frontend", "Web"],
        difficulty: 1,
        createdAt: Date.now(),
        reviewCount: 0,
        correctCount: 0,
      },
      {
        id: "card-fe-4",
        question: "What is the purpose of Next.js App Router Server Components?",
        answer: "They allow components to render on the server by default, reducing client bundle size and improving performance.",
        tags: ["Next.js", "React", "Frontend"],
        difficulty: 3,
        createdAt: Date.now(),
        reviewCount: 0,
        correctCount: 0,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPublic: true,
    shareCode: "WEB-DEV-01",
    authorName: "ReviewFlash Community",
  },
  {
    id: "deck-cs-fundamentals",
    title: "Computer Science Core",
    description: "Essential data structures, algorithm complexities, and foundational computational theory.",
    tags: ["Computer Science", "Algorithms", "Data Structures"],
    cards: [
      {
        id: "card-cs-1",
        question: "What is the time complexity of searching in a balanced Binary Search Tree (BST)?",
        answer: "O(log n) on average and in the worst case for balanced trees.",
        tags: ["Algorithms", "Computer Science"],
        difficulty: 3,
        createdAt: Date.now(),
        reviewCount: 0,
        correctCount: 0,
      },
      {
        id: "card-cs-2",
        question: "What is the difference between a Process and a Thread?",
        answer: "A process is an executing program with its own memory space, while a thread is a lightweight unit of execution within a process sharing memory.",
        tags: ["OS", "Computer Science"],
        difficulty: 4,
        createdAt: Date.now(),
        reviewCount: 0,
        correctCount: 0,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPublic: true,
    shareCode: "CS-CORE-02",
    authorName: "ReviewFlash Community",
  },
  {
    id: "deck-study-methods",
    title: "Accelerated Learning & Memory",
    description: "Cognitive science principles, active recall, and spaced repetition systems.",
    tags: ["Learning", "Study Techniques", "Cognition"],
    cards: [
      {
        id: "card-learn-1",
        question: "What is Spaced Repetition (e.g. SM2 algorithm)?",
        answer: "An evidence-based learning technique that incorporates increasing intervals of time between subsequent review of previously learned material.",
        tags: ["Learning", "Study Techniques"],
        difficulty: 2,
        createdAt: Date.now(),
        reviewCount: 0,
        correctCount: 0,
      },
      {
        id: "card-learn-2",
        question: "What is Active Recall in study science?",
        answer: "Actively stimulating memory retrieval during the learning process rather than passively rereading material.",
        tags: ["Learning", "Memory"],
        difficulty: 1,
        createdAt: Date.now(),
        reviewCount: 0,
        correctCount: 0,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPublic: true,
    shareCode: "LEARN-03",
    authorName: "ReviewFlash Community",
  },
];

async function seed() {
  console.log("Seeding starter decks into Firebase Firestore...");

  for (const deck of STARTER_DECKS) {
    // 1. Seed into public_decks collection
    console.log(`Writing "${deck.title}" to public_decks/${deck.id}...`);
    await setDoc(doc(db, "public_decks", deck.id), deck);

    // 2. Also register in shared_decks by shareCode for universal lookup
    if (deck.shareCode) {
      console.log(`Registering share code "${deck.shareCode}" in shared_decks...`);
      await setDoc(doc(db, "shared_decks", deck.shareCode), deck);
    }
  }

  console.log("✅ Successfully seeded all starter decks into Firebase Firestore!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
