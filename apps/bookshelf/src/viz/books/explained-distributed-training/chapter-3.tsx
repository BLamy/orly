// Cutting the Model: a real toy matmul split across devices (asserted exact)
// and pipeline bubbles computed from the schedule: (p-1)/(m+p-1).
// Published from the catalog: src/viz/explainers/tensor-pipeline IS this chapter.
export { Render, vizScene } from '../../explainers/tensor-pipeline/TensorPipeline';
