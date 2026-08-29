# Flashcard Website Plan (Next.js + Firebase)

## 🎯 Project Goals

- Build a web app with two modes: **Review Mode** and **Test Mode**.
- Use **Next.js** for frontend and **Firebase Firestore** for database.
- Ensure scalability for future features like spaced repetition, user accounts, and progress tracking.

---

## 🛠 Tech Stack

- **Frontend**: Next.js (React-based framework)
- **Backend/Database**: Firebase Firestore
- **Authentication**: Firebase Auth (optional for multi-user support)
- **Hosting**: Vercel or Firebase Hosting

---

## 📂 Project Structure

```js
    /pages
    /index.tsx        → Mode selector (Review/Test)
    /review.tsx       → Review Mode UI
    /test.tsx         → Test Mode UI
    /create.tsx       → Flashcard creation form
    /components
    Flashcard.tsx     → Card flip component
    QuizQuestion.tsx  → Test mode question component
    ProgressStats.tsx → Stats display
    /firebase.js        → Firebase config`
```

---

## 🎯 Review Mode

- Fetch flashcards from Firestore.
- Display one card at a time with **flip animation**.
- Buttons: “Got it” / “Need practice” → update difficulty field in Firestore.
- Optional: implement **spaced repetition** logic.

---

## 📝 Test Mode

- Convert flashcards into quiz questions.
- Multiple-choice options generated from other flashcards.
- Track score in Firestore (`attempts`, `correct`, `accuracy`).
- Add timer for exam-style practice.
- Randomize question order.

---

## 🔑 Database Schema (Firestore)

Collection: `flashcards`

```js
    {
    id: string,
    question: string,
    answer: string,
    tags: [string],
    difficulty: number,   // 1 = easy, 5 = hard
    createdAt: timestamp
    }
```

Collection: `users` (optional, if using Auth)

```js
    {
    uid: string,
    email: string,
    progress: {
        reviewed: number,
        correct: number,
        accuracy: number
        }
    }
```

---

## 🚀 Development Path

1. **Setup Firebase project** and Firestore collection `flashcards`.
2. **Create Next.js pages** for Review and Test modes.
3. **Implement Review Mode** with flip + difficulty tracking.
4. **Implement Test Mode** with quiz logic + scoring.
5. **Add Auth** for personalized decks (optional).
6. **Deploy** via Vercel or Firebase Hosting.

---

## 📈 Future Enhancements

- Spaced repetition algorithm (SM2).
- Deck sharing between users.
- Mobile-friendly UI.
- Export/import flashcards.
