# Model and numerical sources

- AlexNet: Krizhevsky, Sutskever and Hinton (2012), section 3.5 and figure 2:
  https://papers.nips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf
- Original source archive: https://github.com/computerhistory/AlexNet-Source-Code
- Spatial dimension convention: Stanford BIODS276 lecture 2, simplified AlexNet:
  https://web.stanford.edu/class/biods276/lectures/lecture2.pdf

The display uses the common 227×227 input / no-padding first convolution convention:
(227−11)/4+1 = 55. The 2012 paper describes 224×224 crops. We do not silently equate
those conventions. Both use the historical channel counts 96/256/384/384/256 and
the 4096/4096/1000 dense widths. The viewer combines normalization/pooling with
its preceding convolution in the overview. Grouping in conv2/4/5 is stated in the
stage descriptions; the sparse display edges are schematic, not a full wiring map.
This is not torchvision's later 64/192-channel variant.

The supplied reference image guides the approach of exposing feature volumes and
connections. No image asset or animation from that film is copied into this library.

All small numerical examples are fully specified in `examples/data.ts`. Convolution
uses the deep-learning cross-correlation convention (no kernel reversal), valid
padding and stride one. Displayed outputs apply ReLU and a fixed divisor of four.
The neural network has no bias, a ReLU hidden layer and softmax outputs. No trained
weights or real-world classification claims are involved.
