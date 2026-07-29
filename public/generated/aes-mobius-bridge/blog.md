# Nine Guesses at the Middle

The paper does not claim a break of full AES. It improves the best known attack on seven reduced rounds in the single-key setting, beginning from the meet-in-the-middle lineage of Demirci-Selçuk, Dunkelman-Keller-Shamir, and Derbez-Fouque-Jean. The attack starts with a delta set: 256 chosen plaintexts in which one byte ranges over every possible value and the other fifteen remain fixed.

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-1-0.png" alt="Seven reduced AES rounds arranged around a central core"><figcaption>The target is seven reduced rounds, not the full ten-round cipher.</figcaption></figure>

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-1-1.png" alt="A ring of 256 structured plaintexts"><figcaption>One active byte supplies all 256 values while the remaining bytes stay fixed.</figcaption></figure>

Peeling one round from either end exposes the four-round structure that the offline table represents. Candidate key bytes let the attacker compute fingerprints from above and below; a match is evidence that the guesses agree with a valid internal sequence.

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-1-2.png" alt="Outer rounds peel away from a four-round core"><figcaption>Outer-round guesses expose the restricted four-round family.</figcaption></figure>

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-1-3.png" alt="Two candidate fingerprints approach the same table"><figcaption>The time-memory trade compares online and offline fingerprints at the middle.</figcaption></figure>

The DFJ attack needs nine bytes around that core: four whitening-key bytes at the input, four anti-diagonal last-round bytes at the output, and one equivalent subkey byte one round deeper. Each guessed byte contributes a factor of 256.

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-1-4.png" alt="Nine key-byte chips surrounding the core"><figcaption>Nine byte guesses fence in the match.</figcaption></figure>

The earlier multiset invariant already eliminates an input-side byte whose only effect is to reorder the 256 values. Frequencies do not care about order. The new work asks whether the byte below the table can be removed as well.

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-1-5.png" alt="One key-byte chip crossed out"><figcaption>A permutation-invariant multiset removes the first byte guess.</figcaption></figure>

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-1-6.png" alt="The two fingerprints meet after one more byte disappears"><figcaption>The Möbius Bridge targets the corresponding output-side byte.</figcaption></figure>

# The Byte That Cancels

The AES S-box is the composition of inversion in the 256-element finite field and a fixed affine map. That algebraic construction, chosen in part for strong differential properties, is precisely what makes the new invariant possible.

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-2-0.png" alt="Offline and online field-element clouds"><figcaption>The two sides begin with related multisets of field elements.</figcaption></figure>

When the unknown output-side key byte is carried backward through the inverse S-box, its effect becomes a single affine action shared by every value: a nonzero scale and a shift. The online multiset is therefore not arbitrary relative to the offline one; it lies in the same affine orbit.

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-2-1.png" alt="Field elements transform through inversion and a hidden byte"><figcaption>Inversion exposes the structured action of the hidden key byte.</figcaption></figure>

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-2-2.png" alt="Two point clouds related by scale and shift"><figcaption>Every element moves under the same pair of affine parameters.</figcaption></figure>

The first construction forms ratios of power sums. The selected combinations cancel translation, while division cancels the common scale. What remains agrees on the online and offline sides even though neither side knows the hidden byte.

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-2-3.png" alt="The equation G equals alpha D plus beta between two clouds"><figcaption>Power-sum ratios eliminate the unknown affine parameters algebraically.</figcaption></figure>

The second construction, chi canonicalization, treats the same problem geometrically. It solves for a moving affine frame and sends every member of an orbit to the same canonical representative. Comparing representatives replaces comparing unknown affine copies.

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-2-4.png" alt="A canonical frame surrounds the online orbit"><figcaption>Orbit canonicalization chooses a shared reference frame.</figcaption></figure>

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-2-5.png" alt="Canonicalized online and offline multisets compare directly"><figcaption>The comparison no longer needs the scale or shift.</figcaption></figure>

The result is the paper's bridge: a fingerprint that crosses the S-box while remaining invariant to the key-byte action. One byte guess disappears, giving a raw factor-of-256 reduction.

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-2-6.png" alt="Unknown key byte crossed out beside a one-over-256 badge"><figcaption>The algebra removes one complete byte from the candidate loop.</figcaption></figure>

# Making the Bridge Pay

An invariant is not automatically an improved attack. Naively evaluating the Möbius transform costs roughly two to the nineteenth operations per table entry, more than enough to consume the eight-bit saving from eliminating a byte guess.

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-3-0.png" alt="A cost meter above the eight-bit savings budget"><figcaption>The first implementation spends more than the bridge saves.</figcaption></figure>

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-3-1.png" alt="The expensive cost bar remains beyond the savings budget"><figcaption>Correct algebra still needs a cheaper evaluation strategy.</figcaption></figure>

A packed power table computes the required sums through table lookups. A DDT-aware Gray-code walk enumerates neighboring differential choices so that only one branch changes at a time, letting almost all work carry over.

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-3-2.png" alt="Packed powers reduce the cost bar"><figcaption>Packing specializes the calculation to the fingerprint's required powers.</figcaption></figure>

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-3-3.png" alt="A Gray-code trace under the shrinking cost meter"><figcaption>The Gray walk reuses work between consecutive candidates.</figcaption></figure>

An XOR-separable S-box cache removes repeated online evaluation. Together, these techniques bring the algebraic fingerprint to about two to the 8.6 lookups per entry. Chi canonicalization is cheaper by construction because it solves a frame rather than assembling the full collection of power sums.

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-3-4.png" alt="The XOR cache chip and a lower cost bar"><figcaption>The cache pushes the per-entry cost into the useful range.</figcaption></figure>

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-3-5.png" alt="Chi canonicalization joins the optimization stack"><figcaption>The moving-frame fingerprint offers a second, cheaper route to the same invariance.</figcaption></figure>

The full attack is too large to execute end to end. The paper therefore layers evidence: exhaustive enumeration on smaller fields, wrong-key randomization measurements, complete recovery on a small-scale AES variant, a Lean-verified false-positive bound, and timed implementations of the kernels used in the complexity count.

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-3-6.png" alt="Five verification checks stack beside the implementation"><figcaption>Each validation attacks a different gap between the proof and the un-runnable full attack.</figcaption></figure>

At a data complexity of two to the 105 chosen plaintexts, the final accounting places time between two to the 89.3 and two to the 91.4, depending on the cost convention and tradeoff point. The achievement is not merely that a byte can be canceled, but that the cancellation can be computed cheaply enough to improve the attack.

<figure><img src="/generated/aes-mobius-bridge/blog/chapter-3-7.png" alt="Final complexity range for seven-round AES"><figcaption>The bridge survives both algebraic and implementation accounting.</figcaption></figure>
