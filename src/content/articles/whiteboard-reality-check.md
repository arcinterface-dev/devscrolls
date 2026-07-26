---
title: "Whiteboard Reality Check: Why AI Won't Save Your Next Interview"
description: "How over-reliance on AI coding agents and a lack of hand-written coding practice cost me a senior-level MERN stack interview."
publishDate: 2026-07-04
category: "interviews"
tags: ["react", "system-design"]
heroImage: "/whiteboard-reality-check-hero.webp"
heroImageAlt: "A physical fountain pen resting on top of handwritten code notes, with amber digital code glows"
draft: false
---

**BLUF:** AI coding tools are making us lazy. If you are a senior developer relying on agents to write your code every day, you might be setting yourself up for failure. I recently went for a senior-level MERN stack walk-in interview (5 to 10 years experience), and I lost my chance because I stumbled on a basic array sorting algorithm when asked to write it down on a piece of paper. Relying on AI coding tools creates a false sense of security that breaks down completely under pen-and-paper interview constraints.

Here is the outline of what we will cover:
* The MERN Stack Interview Questions
* The Pen and Paper Whiteboard Trap
* Why AI Agents are Creating a False Sense of Competence

## 1. The MERN Stack Interview Questions 🛠️✨

Before we talk about the paper-and-pen hurdle, let's see the technical questions they asked during the first round. Since this was for a senior role, the focus was heavily on state management architecture and request lifecycle details.

### React lifecycle in functional components
They asked about how we handle lifecycle methods in functional components. In functional components, this is handled by the `useEffect` hook, which is nothing but a unified API for managing side effects. 

Instead of writing separate lifecycle methods, we configure the dependency array:
* Empty dependency array `[]` behaves like `componentDidMount`.
* A dependency array with variables `[data]` behaves like `componentDidUpdate`.
* Returning a cleanup function from the hook behaves like `componentWillUnmount`.

For senior roles, they expect you to mention cleanup handlers, which helps you to prevent memory leaks by aborting active fetch requests or clearing active subscriptions when a component unmounts.

### Context API vs. Redux
This is a classic question, the main difference lies in how they propagate changes. Context API is a tool for dependency injection, which helps to avoid prop drilling. It is not a state management system. 

When a value in a Context Provider changes, React triggers a re-render for all components that consume that context. This is fine for low-frequency updates like themes or language settings. 

Redux uses a centralized store with a publish-subscribe model. By using Redux selectors, you can able to subscribe only to the specific slice of state your component needs. If other parts of the store change, your component will not re-render.

### State management decision matrix
For a new project, how will you decide what to use? If your application has simple state requirements and low-frequency updates, Context API is more than enough. 

But if you have high-frequency state updates, complex business logic, or a large team working on different features, Redux or Zustand is the right choice. It keeps the store decoupled from the UI components.

### Node.js middleware lifecycle
In Express, middleware is nothing but a function that has access to the request object (`req`), the response object (`res`), and the `next` function in the application’s request-response cycle. 

```js
// Example of a basic logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} request received at ${new Date().toISOString()}`);
  next(); // Pass control to the next middleware
});
```

Middleware acts as an interceptor. It executes code, makes changes to the request and response objects, ends the request-response cycle, or calls `next()` to pass control down the chain.

### Authentication vs. Authorization
In simple terms, authentication is verifying who you are (e.g., validating a password or JWT token). Authorization is verifying what you are allowed to do (e.g., checking if the authenticated user has admin access to delete a resource).

---

## 2. The Pen and Paper Whiteboard Trap 📝❌

After answering the architectural questions, they handed me a pen and a piece of paper. They asked me to write a custom function to sort an array without using any built-in sorting method like `Array.prototype.sort()`.

I thought I knew this very well. I started writing a standard bubble sort. But suddenly, my hand stopped. I realized I was doubting the inner loop index boundaries. 

For example:

```js
// sorting-algorithm.js
function bubbleSort(arr) {
  let len = arr.length;
  // Outer loop to run through the entire array
  for (let i = 0; i < len; i++) {
    // Inner loop stops before already sorted elements
    for (let j = 0; j < len - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap elements using a temporary variable
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}
```

I had written 90% of the logic, but I could not run it. In a real editor, you write the loop, run the test, and see if it fails with an off-by-one error. The feedback loop is instant. On paper, under the eyes of two interviewers, you have to compile the code in your head. 

Because I had not written code by hand for more than a year, I hesitated. That hesitation cost me the interview.

---

## 3. Why AI Agents are Creating a False Sense of Competence 🧠🤖

We are living in an era where AI agents and Copilot can write code in seconds. We use them for our daily project tasks, and we feel incredibly productive. But there is a hidden trade-off. 

When you rely entirely on an agent to write your syntax, your brain stops doing the low-level retrieval work. You understand the code when you see it, but that is recognition, not recall. Recognition is easy; recall is hard. 

When the editor, autocomplete, and AI are taken away, you are left with only your memory. If you have not practiced manual recall, your core coding muscles will rot.

---

## Conclusion 🌟📦

Losing this chance was a major wakeup call. Even if you are using advanced coding agents to build your projects, you must maintain your manual skills. 

Always keep practicing, and do not let tools make you forget the fundamentals. I am planning to share my personal interview study materials and notes in an upcoming post to help you prepare for frontend and MERN stack interviews.

> What is your biggest challenge when writing code without an editor? Hit reply to the newsletter and let me know.
