// ZeRO: memory-per-device arithmetic as sharding stages turn on (98 → 34 →
// 23 → 12 GB for 6.57B params on 8 devices), computed at module scope.
// Published from the catalog: src/viz/explainers/zero-sharding IS this chapter.
export { Render, vizScene } from '../../explainers/zero-sharding/ZeroSharding';
