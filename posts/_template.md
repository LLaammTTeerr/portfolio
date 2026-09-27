---
# Copy this file to posts/YYYY-MM-DD-your-slug.md and start writing.
# Files whose name starts with "_" (like this one) are never published.

title: "Your title here"
date: 2026-10-01            # YYYY-MM-DD (can be omitted if the filename starts with it)
kind: Algorithm             # free text; each distinct kind becomes a filter. e.g. Algorithm, Story, Build log, Flex
lang: en                    # en or vi
summary: "One or two sentences shown under the title, in the archive, on the homepage card and in RSS."
tags: [graphs, trees]       # optional
draft: true                 # true = staging only; set false (or delete) to publish on lamter.cc
# slug: custom-url          # optional; defaults to the filename after the date
# hue: 210                  # optional 0–360; tints the generated map banner
---

Intro paragraph. Markdown as usual: **bold**, *italic*, [links](https://lamter.cc), `inline code`.

## A section (shows up in the side "route" once you have 3+ sections)

Inline math: $O(n \log n)$. Display math:

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

A literal dollar sign needs a backslash: \$5.

```cpp
// Fenced code gets syntax highlighting and a copy button.
int main() { return 0; }
```

| Approach | Build | Query |
|---|---|---|
| Naive | $O(1)$ | $O(n)$ |

!!! complexity "Complexity"
    Callout boxes: note, tip, warning, complexity, flex.

!!! flex "Flex"
    For the brag-worthy bits: ratings, rankings, "solved it first".

A footnote.[^1]

[^1]: The footnote text.
