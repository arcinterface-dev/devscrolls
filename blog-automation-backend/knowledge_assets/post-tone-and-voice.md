# Tone, Voice & Formatting Framework: Blog Posts & LinkedIn

This rule defines the signature tone, voice, rhythm, and structural framework for all DevScrolls blog intros, newsletter hooks, and LinkedIn posts.

---

## 1. Core Voice Attributes

| Attribute | Execution | Example from Voice Reference |
| :--- | :--- | :--- |
| **Vulnerable yet Authoritative** | Open with candid admission of failure or friction, then transition immediately to hands-on empirical solution. | *"I wasn’t getting shortlisted. No replies. No interviews. Just silence."* |
| **Staccato Cadence** | Micro-lines, 2-5 words per fragment. High whitespace. Forcing the eye downward. | *"No replies. / No interviews. / Just silence."* |
| **The Misattribution Reframe** | Shift blame from self-doubt/impostor syndrome to an addressable mechanical failure. | *"At first, I thought it was my skills. But the real problem? My resume."* |
| **Empirical Practitioner Proof** | Frame advice around real iteration, testing, and debugging rather than textbook theory. | *"I started researching, testing, and tweaking it."* |
| **High-Density Imperative List** | Action-oriented, past/active verbs, 4-8 words per point, zero corporate fluff. | *"Used the CAR method — Challenge → Action → Result"* |
| **Parallel Reversal Punchline** | Epigrammatic closing statement using mirrored sentence structure. | *"Your skills might not be the problem. Your resume might just be hiding them."* |
| **Utility-Driven Save CTA** | Ask for bookmarks/saves for future utility rather than vanity engagement. | *"Save this before your next application."* |

---

## 2. The 6-Beat Post Blueprint (LinkedIn & Blog Openers)

Whenever generating LinkedIn posts, newsletter openings, or article introductions (BLUF), follow this 6-beat sequence:

### Beat 1: The Cold Open (The Downward Spiral)
Start directly in the emotional or technical trough. 1 short sentence followed by 2–3 staccato fragments.
```text
I wasn’t getting shortlisted.
No replies.
No interviews.
Just silence.
```
*(Or in a technical post: "The API was failing under load. High latency. Dropped connections. 504 Gateway Timeouts everywhere.")*

### Beat 2: The Misattribution Pivot
Challenge the instinctive assumption. Isolate the true culprit.
```text
At first, I thought it was [Intuitive but incorrect cause].
But the real problem?
[The actual mechanical/systemic cause].
```

### Beat 3: The Empirical Transition
Show that you tested, iterated, and found signal through the noise.
```text
I spent [time / iterations] researching, testing, and tweaking it.
Here are the [N] changes that made the biggest difference:
```

### Beat 4: Action-First Bullet Points (Max 7-8 points)
- Start with an active verb (Used, Replaced, Cut, Added, Isolated, Kept).
- Keep each line between 4 and 10 words.
- Provide a concrete mental model or metric (e.g. CAR method, O(1), P99 latency, 1-page scan).

### Beat 5: The Epigrammatic Reversal
Close with a two-line memorable takeaway that reframes the reader's perspective:
```text
Your [perceived weakness] might not be the problem.
Your [actual bottleneck] might just be hiding it.
```

### Beat 6: High-Utility CTA
Give a direct reason to bookmark or save:
```text
Save this before your next [action / deployment / application].
```

---

## 3. Strict Guardrails for this Voice

1. **Zero LLM Filler**: Never use *delve*, *robust*, *landscape*, *in conclusion*, *tapestry*, *seamless*, or *game-changer*.
2. **No Paragraph Blocks in Openers**: In the opening 6-8 lines, no paragraph should exceed 2 sentences. Use single-line breaks to create rhythm.
3. **Conversational Peer-to-Peer Language**: Speak like a senior dev talking to another developer over coffee or in a direct message.
4. **Action over Adjectives**: Replace hype adjectives ("incredible, revolutionary") with concrete nouns and numbers ("3x faster", "CAR method", "1 page").
5. **Hashtag Discipline**: Maximum 3-4 targeted, high-intent hashtags at the very bottom (or none). Never hashtag-stuff within sentences.
