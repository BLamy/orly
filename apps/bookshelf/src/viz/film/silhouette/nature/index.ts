/**
 * Nature: trees (recursive, bare winter trees first), forest bands, fbm ridgelines and mountains with mist,
 * snowfields, clouds, the moon and stars. Painters take (c, opts, env) in layer world coordinates.
 *
 *   noise    noise1, fbm1, ridged1
 *   trees    tree, treeGeom, forestBand
 *   terrain  ridgePath, ridgeline, mountains, snowfield
 *   sky      cloud, cloudBank, moon, stars
 */
export * from './noise';
export * from './trees';
export * from './terrain';
export * from './sky';
