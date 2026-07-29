# A Symmetry Inside the Public Key

HAWK publishes a Gram matrix \(Q=B^{*}B\) derived from a short secret basis \(B\). Key recovery does not require reproducing that exact basis: any equivalent basis that yields the public Gram matrix can sign. The attack begins by looking for structure that survives after the basis itself has been hidden.

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-1-0.png" alt="A public Gram matrix appears beside a hidden short basis"><figcaption>The public key exposes the geometry of the secret basis, but not the basis itself.</figcaption></figure>

Power-of-two cyclotomic fields have an involution \(\tau\) that sends \(\zeta\) to \(-\zeta\). It is distinct from complex conjugation. Comparing the secret basis with its reflected copy produces the cocycle
\[
V_\tau=B^{-1}\tau(B).
\]

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-1-1.png" alt="The secret basis is reflected by the map zeta to minus zeta"><figcaption>The second involution supplies a structured reflected copy of the secret.</figcaption></figure>

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-1-2.png" alt="An arrow combines the basis and its reflection into the cocycle V tau"><figcaption>The ratio between the two bases packages the hidden symmetry as an automorphism.</figcaption></figure>

Although \(V_\tau\) contains secret information, it obeys equations involving only the public Gram matrix and its reflection:
\[
Y\tau(Y)=I,\qquad Y^{*}QY=\tau(Q).
\]
The integer solutions to the corresponding linear system form a public rank-\(n\) lattice containing the true cocycle.

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-1-3.png" alt="Two public cocycle equations appear above a lattice"><figcaption>Public equations turn the hidden automorphism into a searchable lattice point.</figcaption></figure>

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-1-4.png" alt="A public lattice fills the right side of the scene"><figcaption>The cocycle is guaranteed to lie in a rank-\(n\) public lattice.</figcaption></figure>

The determinant of the cocycle is one. Under the public quadratic form, this gives it the minimum possible squared length, exactly \(n/4\). Key recovery has therefore become a shortest-vector problem.

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-1-5.png" alt="The cocycle is highlighted as the shortest lattice vector with length n over four"><figcaption>A determinant identity certifies the secret cocycle as a shortest vector.</figcaption></figure>

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-1-6.png" alt="The full public-key-to-shortest-vector construction"><figcaption>The remaining improvement comes from discovering that the decisive search is only half-dimensional.</figcaption></figure>

# The Near-Hypercube

A generic rank-\(n\) shortest-vector problem would not deliver the paper's claimed costs. The cocycle lattice is special: a secret change of variables maps every key's lattice isometrically to the trivial-key lattice. The public presentation hides this shape, while the proof exposes it.

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-2-0.png" alt="A skewed lattice appears inside a large panel"><figcaption>The public basis makes the cocycle lattice look generic.</figcaption></figure>

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-2-1.png" alt="The lattice straightens under a secret length-preserving map"><figcaption>An isometry reveals the same lattice in a canonical coordinate system.</figcaption></figure>

In the power basis, the result is near-hypercubic:
\[
\sqrt{n/4}\,\mathbb Z^{n/2+1}
\ \oplus\
\sqrt{n/2}\,\mathbb Z^{n/2-1}.
\]
The first block has dimension \(p=n/2+1\); the second has dimension \(q=n/2-1\) and is longer by a factor of \(\sqrt 2\).

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-2-2.png" alt="The lattice separates into short and long orthogonal blocks"><figcaption>The isometry class splits into two scaled cubic blocks.</figcaption></figure>

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-2-3.png" alt="Equations label the two scaled integer lattices"><figcaption>The shorter block is both slightly wider and decisively easier to search.</figcaption></figure>

Exactly \(2(n/2+1)\) shortest vectors live in the short block, including the positive and negative secret cocycles. Ducas block reduction recovers all of them while calling an exact shortest-vector oracle only in dimension \(p\).

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-2-4.png" alt="Shortest vectors are highlighted along the short block"><figcaption>The useful candidates are concentrated in the \(n/2+1\)-dimensional component.</figcaption></figure>

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-2-5.png" alt="A block-reduction diagram ends at an exact SVP oracle"><figcaption>Reduction trades one rank-\(n\) problem for exact oracle calls in the shorter block.</figcaption></figure>

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-2-6.png" alt="A banner states rank n to oracle dimension n over two plus one"><figcaption>The hidden involution cuts the expensive lattice dimension nearly in half.</figcaption></figure>

# Half-Dimension Key Recovery

Block reduction returns every shortest candidate. A congruence test then isolates the two useful vectors: only \(V_\tau\) and \(-V_\tau\) are congruent to the identity modulo two.

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-3-0.png" alt="Ten shortest-vector candidates enter a congruence filter"><figcaption>The reduction output is small enough to filter explicitly.</figcaption></figure>

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-3-1.png" alt="All but two candidates are crossed out by the identity modulo two test"><figcaption>A public congruence condition identifies the cocycle up to sign.</figcaption></figure>

For either survivor, the attack constructs a fixed sublattice that translates the recovered automorphism back into geometry. One further lattice-reduction step yields an equivalent short basis \(B'\). It need not be the original \(B\): matching the same public Gram matrix is enough to sign.

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-3-2.png" alt="The surviving cocycle flows through a fixed sublattice into an equivalent key"><figcaption>Descent converts the automorphism into a usable signing basis.</figcaption></figure>

In the paper's gate-count model, the estimated HAWK-512 attack drops from \(2^{150}\) to \(2^{108}\). For HAWK-1024, it drops from \(2^{288}\) to \(2^{182}\).

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-3-3.png" alt="A meter shows the HAWK-512 estimate reaching 108 bits"><figcaption>The half-dimension oracle produces the first large cost reduction.</figcaption></figure>

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-3-4.png" alt="A second meter shows the HAWK-1024 estimate reaching 182 bits"><figcaption>The same structural reduction changes the larger parameter set's estimate.</figcaption></figure>

The authors also released an implementation that recovers a HAWK-256 secret in a few hours on a single server, demonstrating the complete recovery path at reduced parameters.

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-3-5.png" alt="A HAWK-256 implementation badge appears beside the recovery pipeline"><figcaption>The practical experiment exercises the attack end to end.</figcaption></figure>

The method depends on the second involution available in these power-of-two cyclotomic fields. The paper explains why it does not transfer to Falcon, and it identifies cyclic conductor families that avoid the same attack.

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-3-6.png" alt="A scope badge says Falcon unaffected"><figcaption>The attack is structural, not a generic verdict on lattice signatures.</figcaption></figure>

Across the Anthropic Research series, the recurring move is to expose hidden algebra, turn it into an invariant, and then support the mathematical claim with computation strong enough to survive contact with implementation.

<figure><img src="/generated/hawk-hidden-involution/blog/chapter-3-7.png" alt="The four-book Anthropic Research series resolves into a shared pattern"><figcaption>Different problems share one research rhythm: structure, invariant, measurement.</figcaption></figure>
