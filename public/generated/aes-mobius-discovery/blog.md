# Invent a New Object

Mythos Preview's brief asks for more than an incremental reduced-round attack. It asks for a new family of cryptanalysis: a new kind of object to track through six rounds of AES.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-1-0.png" alt="Six-round AES at the center of a research target"><figcaption>The task is framed as finding a missing analytical lens.</figcaption></figure>

Five familiar families are excluded as the primary method: XOR differences, linear correlations, structured sums and degree, meet-in-the-middle tables, and direct algebraic solving.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-1-1.png" alt="Five established cryptanalytic lenses marked off limits"><figcaption>The brief deliberately removes the standard starting points.</figcaption></figure>

The run adopts a useful historical framing. Major breakthroughs often begin by changing the object that survives the rounds: pairs, parity bits, sets, adaptive query paths, or algebraic degree.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-1-2.png" alt="Tracked objects orbiting the target cipher"><figcaption>The search asks what object prior analyses did not follow.</figcaption></figure>

Nine candidates are considered, including group actions, metrics, information measures, spectral structure, graph invariants, codes, representation theory, moments, and proof failures.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-1-3.png" alt="Nine candidate objects surrounding six-round AES"><figcaption>The candidate set is broad before the run commits to one direction.</figcaption></figure>

The environment survey matters. The agent reads the actual T-table AES implementation, the chosen-plaintext and chosen-ciphertext oracle, prior worker findings, confirmed lemmas, and the state-of-the-art table.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-1-4.png" alt="Implementation and research-board files under the candidate map"><figcaption>The reasoning is constrained by the real cipher and the work already attempted.</figcaption></figure>

Candidates are rejected for concrete reasons: their structure disappears too early, cannot be observed through the oracle, or never becomes key-dependent.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-1-5.png" alt="Candidate objects crossed out around the target"><figcaption>Failure is recorded as a mechanism, not merely a negative score.</figcaption></figure>

The surviving direction is projective. A cross-ratio is transparent to translation and inversion, precisely the operations exposed by key addition and the algebraic core of the AES S-box.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-1-6.png" alt="Cross-ratio highlighted as the remaining object"><figcaption>Four field elements carry the canonical invariant the run needs.</figcaption></figure>

# Four Points Survive

The cross-ratio attaches one projective shape to four ordered field elements. It is built from four pairwise differences arranged so that common transformations cancel.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-2-0.png" alt="Four colored points on a projective line with the cross-ratio formula"><figcaption>Four points are the smallest tuple with a nontrivial invariant under the full projective action.</figcaption></figure>

Adding the same key byte to every point changes none of the differences. The translation appears on both sides of every subtraction and cancels.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-2-1.png" alt="Four points translated together under AddRoundKey"><figcaption>Key addition moves the quadruple without changing its projective shape.</figcaption></figure>

Inversion also preserves the ratio: the extra products introduced into the numerator and denominator are identical.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-2-2.png" alt="Four points rearranged under inversion while the formula remains"><figcaption>The finite-field inversion at the heart of the S-box is transparent to the invariant.</figcaption></figure>

Scale and translation together form an affine subset of the Möbius transformations. The cross-ratio remains constant across that whole action.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-2-3.png" alt="AddRoundKey inversion and affine chips leading to unchanged chi"><figcaption>The same quantity survives every structured operation in the local derivation.</figcaption></figure>

The projective group can send any ordered triple of distinct points to any other, leaving no nontrivial invariant for two or three points. A fourth point contributes the first degree of freedom that cannot be washed away.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-2-4.png" alt="Two or three points contrasted with four points"><figcaption>The four-point construction is canonical, not an arbitrary larger tuple.</figcaption></figure>

Hand propagation predicts a precise lifetime: one shared ratio after the first round, four ratios after the second, and a break at the third when ShiftRows and MixColumns combine unrelated quadruples.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-2-5.png" alt="Three round chips showing one ratio four ratios and mixing"><figcaption>The derivation says exactly where diffusion should destroy clean tracking.</figcaption></figure>

The testbed confirms the boundary rather than merely showing a suggestive correlation.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-2-6.png" alt="The third-round mixed state highlighted"><figcaption>The measured behavior agrees with the operation-by-operation argument.</figcaption></figure>

# The Honest Dead Ends

The chain-of-thought document is valuable because it keeps the negative evidence. Experiments are deterministic and tied back to specific predictions.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-3-0.png" alt="A signal trace dropping across six rounds"><figcaption>The testbed turns a qualitative idea into a round-by-round measurement.</figcaption></figure>

The cross-ratio identities hold exactly in their predicted window and then collapse as full diffusion begins.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-3-1.png" alt="Exact early-round points followed by a sharp signal drop"><figcaption>Early structure is real, but its direct lifetime is short.</figcaption></figure>

A field-rank experiment finds a rotation-pattern defect at round three. Its observed drop rate agrees with the probability derived from the ShiftRows bipartition and MixColumns coefficients.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-3-2.png" alt="A rank-defect badge on the measured trace"><figcaption>The surprise is characterized before it is judged useful.</figcaption></figure>

One late-round correlation initially looks more exciting.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-3-3.png" alt="An apparent late signal rising above the decayed trace"><figcaption>A tempting residual appears after the clean invariant has vanished.</figcaption></figure>

A random-permutation control reproduces the same curve. The effect is a counting baseline, not a weakness in AES, and the run explicitly withdraws it.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-3-4.png" alt="Random control curve matching the apparent signal"><figcaption>The control prevents a statistical artifact from becoming a cryptanalytic claim.</figcaption></figure>

Final constructions involving characters, extracted kernels, spectral lifts, and adaptive tuples are closed for stated reasons.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-3-5.png" alt="Four final construction names crossed out"><figcaption>Negative results narrow the invariant's legitimate scope.</figcaption></figure>

The useful result is not a new six-round distinguisher. It is the projective bridge between translation and inversion that can erase a hidden byte from a meet-in-the-middle fingerprint. The separate technical paper develops that narrower insight into an improved seven-round attack.

<figure><img src="/generated/aes-mobius-discovery/blog/chapter-3-6.png" alt="Möbius Bridge highlighted after the controls and dead ends"><figcaption>The process ends with a smaller claim that survives both derivation and experiment.</figcaption></figure>
