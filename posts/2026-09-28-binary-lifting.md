---
title: "Climbing a tree in log n jumps"
date: 2026-09-28
kind: Algorithm
lang: en
summary: "Binary lifting, explained from one observation: every distance is a sum of powers of two. Sample post: replace it with your own."
tags: [trees, lca, binary-lifting]
draft: true
hue: 14
---

You are standing on a node deep in a rooted tree and someone asks for your ancestor $k$ levels up. Walking one parent at a time costs $O(k)$. Do that for every query on a path-shaped tree and you have an $O(nq)$ solution that times out.

Binary lifting fixes this with one observation: **any distance $k$ is a sum of distinct powers of two**. If every node remembers its ancestors at distances $1, 2, 4, 8, \dots$, you can cover any distance in at most $\lfloor \log_2 k \rfloor + 1$ jumps.

## The jump table

Let $\text{up}[j][v]$ be the ancestor of $v$ that is $2^j$ levels above it. The root points to itself, so overshooting simply stays at the root. The table fills itself from one recurrence: two jumps of $2^{j-1}$ make one jump of $2^j$.

$$
\text{up}[j][v] = \text{up}[j-1]\big[\,\text{up}[j-1][v]\,\big]
$$

Parents are known before their children when you walk down the tree, so a single DFS can build every row for $v$ the moment it is visited.

## Jumping up by k

Write $k$ in binary and take a jump for every set bit. For $k = 13 = 1101_2$ that is jumps of $8$, $4$ and $1$: three table lookups instead of thirteen parent hops.

```cpp
const int LOG = 18;                 // 2^18 > 2 * 10^5
vector<int> g[N];
int up[LOG][N], depth[N];

void dfs(int v, int p) {
    up[0][v] = p;
    for (int j = 1; j < LOG; j++)
        up[j][v] = up[j - 1][up[j - 1][v]];
    for (int u : g[v])
        if (u != p) {
            depth[u] = depth[v] + 1;
            dfs(u, v);
        }
}

int kth_ancestor(int v, int k) {
    for (int j = 0; j < LOG; j++)
        if (k >> j & 1) v = up[j][v];
    return v;
}
```

Call `dfs(root, root)` once. The recursion is fine for random trees, but a path of $2 \cdot 10^5$ nodes can overflow the stack on some judges.[^stack]

## Lowest common ancestor

The same table answers LCA queries:

1. Lift the deeper node until both are at the same depth.
2. If they are now equal, that node is the answer.
3. Otherwise, try jumps from largest to smallest and take a jump only if it keeps the two nodes **different**. When no jump is left, both sit just below the LCA.

```cpp
int lca(int a, int b) {
    if (depth[a] < depth[b]) swap(a, b);
    a = kth_ancestor(a, depth[a] - depth[b]);
    if (a == b) return a;
    for (int j = LOG - 1; j >= 0; j--)
        if (up[j][a] != up[j][b]) {
            a = up[j][a];
            b = up[j][b];
        }
    return up[0][a];
}
```

Step 3 is a binary search written as greedy jumps. "The ancestors are different" is monotone in the distance: true below the LCA and false from the LCA up. Taking the largest jump that keeps it true lands exactly one level below the answer.

!!! complexity "Complexity"
    Preprocessing is $O(n \log n)$ time and memory, and each query is $O(\log n)$. With $n = 2 \cdot 10^5$ that is about $3.6$ million table cells, roughly 14 MB as `int`.

## When to reach for something else

| Technique | Preprocessing | Query | Notes |
|---|---|---|---|
| Walk parent by parent | $O(n)$ | $O(n)$ | Fine for a handful of queries |
| Binary lifting | $O(n \log n)$ | $O(\log n)$ | Also gives $k$-th ancestor and path aggregates |
| Euler tour + sparse table | $O(n \log n)$ | $O(1)$ | LCA only |
| Heavy-light decomposition | $O(n)$ | $O(\log n)$ | Best when paths need updates too |

Binary lifting is the one to know by heart. It is short and hard to get wrong, and it extends naturally: store the maximum edge weight next to each jump and the same loop answers "heaviest edge on the path" queries.

!!! flex "Where this got used"
    Replace this box with your story. For example: the contest problem where binary lifting was the key, the verdict, and the rank that came with it.

[^stack]: An iterative DFS, or raising the stack limit with `ulimit -s unlimited` when testing locally, avoids this.
