# Research bible — perceptron-short

Minimal bible for the pipeline's example film. Claims: see claims.json (mk1-builder, mk1-retina, mk1-weights, mk1-rule; added 2026-10-06 for review round 1: mk1-sum, limit-linear, lineage-mlp; added 2026-10-06 for review round 2: mk1-trained, mk1-patchboard).

People: Frank Rosenblatt (1928–1971), psychologist at the Cornell Aeronautical Laboratory, Buffalo, New York; usually pictured in his thirties, slim, dark short hair, suit and tie or shirt sleeves in the lab.

Machine: the Mark I Perceptron — a camera-like grid of 400 photocells (20 × 20) wired through a patch board of tangled cables to racks of motor-driven potentiometers (the weights).

Mechanism (mk1-sum): the response unit adds up its weighted inputs and answers by whether the total passes a threshold (Rosenblatt 1958). In the Mark I the inputs reach the response unit through a randomly wired association layer; the film's theatre is an illustration of the rule, not a wiring diagram.

Scope and lineage (limit-linear, lineage-mlp): a single-layer perceptron learns only linearly separable ("simple") patterns; Minsky and Papert's *Perceptrons* (1969) showed it cannot compute XOR and is often credited with a 1970s slump in neural-network research. Multilayer perceptrons grew out of efforts to get past that limit and form the basis of deep learning; they too learn by adjusting weights to reduce error (by backpropagation, not Rosenblatt's exact rule).

Training (mk1-trained): the Mark I was a supervised learning machine, not programmed with the rule: it was shown example images and learned by trial and error, its weights corrected after each wrong answer (the right answer is the error signal, so never say it was not told which shape was which).

Wiring (mk1-patchboard): the photocells reached the association units through a plugboard wired at random from a table of random numbers; those connections were fixed, and only the motor-driven potentiometer weights were learned.
