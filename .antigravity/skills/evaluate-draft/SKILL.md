---
name: evaluate-draft
description: >
  Invoke to strictly evaluate a new article draft before allowing it to be published or processed. 
  Acts as a gatekeeper to prevent publishing generic, over-saturated content.
inputs:
  - draft_content: The text or path of the draft to evaluate.
---

# Draft Evaluation & Gatekeeping Skill

## Purpose
This skill must be invoked BEFORE moving any draft to the `new-article` pipeline. Its sole purpose is to ruthlessly critique the draft to ensure it meets the "Thoughtful Builder / Senior Engineer" bar. If an article is something that AI could generate in 5 seconds from a generic prompt (e.g., "What is React?"), it must be rejected.

## Evaluation Criteria (The "Worth Posting" Test)

### 1. The Saturation Test (Fail fast)
- **Is this topic generic?** (e.g., "How to use `useState`", "HTML vs CSS")
- **Are there already 1,000+ identical tutorials online?**
- **Action:** If YES, **REJECT** the draft. Tell the user it's too generic and suggest a pivot (e.g., instead of "How to use useState", pivot to "Race conditions when using useState in data fetching").

### 2. The Seniority / "War Story" Test
- Does the draft include real-world pain points, architectural bottlenecks, or production failures?
- Does it explain the *why* and *how it breaks*, instead of just the *how-to*?
- **Action:** If it reads like beginner documentation, **REJECT** and ask the user to inject a specific "War Story" or personal experience.

### 3. The Trade-off Test
- Does the draft present a "perfect" solution without discussing trade-offs?
- Senior engineering is about trade-offs (e.g., performance vs. maintainability).
- **Action:** If it lacks nuance or trade-off analysis, **FLAG** it for revision.

### 4. BLUF & Scannability
- Does it have the Bottom Line Up Front (BLUF)? 
- **Action:** If it buries the lead, **FLAG** it for structural revision.

## Output Format
When this skill is executed, you must generate a report for the user with the following sections:
1. **Verdict**: [✅ PASS / ⚠️ PIVOT / ❌ REJECT]
2. **Analysis**: Why it passed or failed based on the 4 tests above.
3. **Actionable Feedback**: If Rejected or Pivot, provide 2-3 specific angles to make the content unique and valuable for senior readers.

## Workflow Rule
**DO NOT** generate or refine the final article (`new-article` skill) until the draft explicitly passes this evaluation. If the draft fails, block execution and wait for the user to revise it.
