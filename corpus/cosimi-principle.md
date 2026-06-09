---
title: The Cosimi Principle - put the model where it can't lie to the user
topic: portfolio/artifact/cosimi-principle
---

The Cosimi Principle is the design idea behind this whole chat: put the model where it can't lie to the user. A language model generates confidently whether or not it actually knows - that's the shape of the thing, not a bug you can prompt away. So the design question is never "how do I stop it hallucinating" but "where can it generate without reaching anyone live."

## The hallucination problem

A model in the request path of a portfolio chat fails in the worst way - confidently, and in my voice. There's no visible seam between something I actually believe and a fluent guess; both arrive in the same first person. For a system that answers as me, that's disqualifying. I'd rather it stay silent than improvise a confident answer wearing my name. The requirement was never "build a chatbot" - it was make the failure mode legible.

## Fencing the model to build time

In Cosimi the LLM still does almost all the labor, but offline, before anyone is watching. The ingest pipeline runs on my machine: it takes my source documents, chunks them into a graph, generates question-answer pairs with one model, audits every pair with a second model, and embeds the survivors into Postgres with pgvector. Chunks and pairs are all model-generated, none hand-typed. Then it freezes. At request time there is no LLM in the path - your question is embedded, a vector search seeds from the nearest chunks and pairs, the engine walks the graph for context, ranks, and returns. Same question, same data, same answer, every time, at zero per-reply token cost on the edge. The model that wrote the answers never sees the question that retrieves them.

## Generation isn't the enemy

The trust comes from the boundary, not the byline. An earlier version hand-wrote every reply and I told myself the honesty came from the hand-craft - that's false and it doesn't scale. A model generating answers from my own source, checked by another model, frozen before it can reach anyone, isn't a hallucination risk - it's a build artifact. The same generative capability that's reckless live is just productive labor offline, because the ingest path has grounding, audit, and a human who can read the output first. What I own isn't the corpus (the model builds that) - it's the source it's grounded on, the audit gate, and the small hand-written canonical layer for questions I want answered exactly.

## The design law

Strip away the portfolio and the principle generalizes to any system that puts words in a user's face as fact, in someone's voice. Build time, grounded on real source, behind an audit, frozen into an inspectable artifact: there, generation is an asset. Request time, ungrounded, unreviewed, speaking as a person: there, the same generation is a liability handed to your most important reader. The trade is depth-for-honesty, and for anything that speaks as you, it's the right trade. Cosimi is one instance; the law outlives the chatbot.
