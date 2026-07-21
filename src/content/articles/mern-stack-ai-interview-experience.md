---
title: "An AI Bot Conducted My MERN Interview: 14 Questions"
description: "My experience taking an AI-powered Berribot technical interview. Here are 14 real questions covering React, backend architecture, and CI/CD."
publishDate: 2026-07-20
category: "interviews"
tags: ["react", "system-design", "performance"]
heroImage: "/mern_ai_interview_hero_1784465198163.png"
heroImageAlt: "Robot conducting an interview with a developer, with MERN stack logos"
draft: false
---

If you are preparing for a senior full-stack interview or you are just curious about how AI is changing the hiring process, then this article is for you.

Recently, I took a MERN stack interview for a major company, but there was a catch. The interviewer wasn't a human. It was an AI-powered conversational assessment bot called Berribot (often used by companies like LTIMindtree and Wipro). The bot evaluates your soft skills, technical depth, and coding capabilities in real-time. It tracks your eye movements and locks down the session, so cheating is practically impossible. Interesting right?

The bottom line up front: The AI doesn't just want definition regurgitation. It demands trade-off analysis. It wants to know *when* to use a tool, not just *how*. 

Here is the outline of what we will cover from my experience:
1. React Mechanics & State Management
2. Backend Architecture & APIs
3. Databases & Security
4. DevOps, CI/CD, & Production Fires

Let's see the 14 questions they threw at me, grouped by topic, and how I answered them.

## 1. React Mechanics & State ⚛️

The bot went straight for the under-the-hood mechanics of React. 

**Q: Explain the React reconciliation algorithm. How does it work and impact performance?**
React uses a Virtual DOM, which is nothing but a lightweight copy of the actual DOM. When state changes, React creates a new Virtual DOM and compares it with the old one using a heuristic O(n) diffing algorithm. This is called reconciliation. It impacts performance because if you don't use keys correctly in lists, React will unmount and remount components unnecessarily, destroying local state and slowing down the render cycle.

**Q: Difference between Context API vs Redux/RTK and when to use it?**
Context API is built-in and great for low-frequency updates (like theme or auth state). But for high-frequency updates, it causes unnecessary re-renders because any component consuming the context will re-render when *any* value inside it changes. 
In other words, you can able to use Redux Toolkit (RTK) for complex, high-frequency, global state because it allows components to subscribe only to the specific slice of state they need. 

**Q: How to handle a chart Toggle component button with visualization of current state in a Class Component?**
The AI specifically asked for a class component approach to test legacy knowledge. 
For example:
```jsx
class ChartToggle extends React.Component {
  state = { view: 'bar' };

  toggleView = () => {
    this.setState(prevState => ({
      view: prevState.view === 'bar' ? 'line' : 'bar'
    }));
  };
  // Renders button and passes this.state.view to the Chart visualization
}
```
Always use `prevState` when the new state relies on the old state to avoid race conditions.

## 2. Backend Architecture & APIs 🛠️

**Q: Express vs Node.js vs Koa?**
Node.js is the runtime environment. Express is a heavy, battery-included framework built on top of Node. Koa is created by the original Express team but it is much lighter and modern, leveraging async/await natively without the callback hell. Koa gives you a bare-bones foundation, whereas Express gives you a massive ecosystem of middleware out of the box.

**Q: How do you handle heavy API calls with backpressure and timeouts?**
If a service is overwhelmed, you don't want to keep hammering it. I explained the Circuit Breaker pattern. If requests fail continuously or timeout, the circuit "opens" and immediately fails fast without hitting the database. For backpressure in Node streams, you have to listen to the `drain` event so you don't overwhelm the available memory buffer.

## 3. Databases & Security 🔒

**Q: When to use SQL vs NoSQL, and normalisation vs denormalisation?**
Use SQL for strict ACID compliance and relational data (like financial transactions). Use NoSQL (like MongoDB) for unstructured data or rapid prototyping. 
Normalization is splitting data into multiple tables to reduce redundancy, which saves storage but requires expensive joins. Denormalization is bundling data together (like embedding documents in Mongo) which speeds up read times but duplicates data. 

**Q: JWT token usage and how to handle token revocation in a multi-tenant system?**
JWTs are stateless, which is great for scaling, but terrible for revoking (like when a user logs out or is banned). To solve this, you maintain a fast in-memory Redis blocklist. When a token is revoked, you add its `jti` (JWT ID) to Redis with a TTL equal to the token's remaining lifespan. The API Gateway checks Redis before allowing the request through.

**Q: How do database joins and many-to-many relationships work?**
In SQL, a many-to-many relationship requires a junction (pivot) table. In MongoDB, you can store an array of ObjectIDs referencing the other collection, and use `$lookup` in an aggregation pipeline to simulate a join.

## 4. DevOps, CI/CD, & Production Fires 🚀

**Q: How does a CI/CD pipeline work with GitHub Actions and how do you handle performance?**
GitHub Actions uses YAML workflows. You handle performance by aggressively caching `node_modules` and Docker layers. If you don't cache, your build times will skyrocket. 
For example:
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

**Q: How to handle CI/CD pipeline issues?**
Always check the logs first. Often, it's a version mismatch between the runner environment and local development, or a flaky test. In some cases, a bad merge breaks the build, so you revert the commit immediately to unblock the team, then fix it locally.

**Q: How does Kubernetes work?**
Kubernetes is a container orchestration tool. It helps you manage Docker containers at scale. You define your desired state (e.g., "I want 3 replicas of my Node app"), and the K8s control plane constantly monitors the pods to ensure 3 are always running, automatically replacing any that crash.

**Q: How to handle a sudden production issue without affecting sprint work?**
This is a classic behavioral question. You follow the incident management protocol: Acknowledge, Mitigate, Resolve. You pull the minimum necessary developers (a "tiger team") to patch the fire and roll back the deployment. The rest of the team continues sprint work. Once mitigated, you write a blameless post-mortem so it never happens again.

## 5. The Coding Round 💻

**Q: Generate Pascal's Triangle (n=3 output: [[1], [1,1], [1,2,1]])**
They asked me to write the logic for Pascal's Triangle. The trick is that every number is the sum of the two numbers directly above it.
```javascript
function generatePascal(numRows) {
  let triangle = [];
  for (let i = 0; i < numRows; i++) {
    let row = new Array(i + 1).fill(1);
    for (let j = 1; j < row.length - 1; j++) {
      row[j] = triangle[i - 1][j - 1] + triangle[i - 1][j];
    }
    triangle.push(row);
  }
  return triangle;
}
```

## Conclusion

The Berribot interview was intense but fair. It didn't just ask for definitions; it demanded real-world scenarios. Trust me! Once you are good at understanding the "why" behind these technologies rather than just the "how", you will crush any AI or human interview.

I hope this helps you prepare for your next big role.
