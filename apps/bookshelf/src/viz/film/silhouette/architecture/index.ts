/**
 * Architecture: the set vocabulary (style bible §5). Each set piece is a Painter(c, opts, env) drawing in
 * the world coordinates of its layer with env.fill('set'|'ink'|'fg'); geometry is cached by options.
 * Windows/doors/arches are HOLES (evenodd) so the backlight shows through.
 *
 *   openings   arch(), windowGeom()  — arch geometry, glazed windows with tracery
 *   walls      windowWall (the reference back wall), panelledWall, column, colonnade, arcade, doorway, framePillar
 *   floors     checkerFloor, boardFloor, floorProject
 *   interiors  bookshelfWall, staircase, blackboardWall (+ blackboardRects), tieredSeating
 *   modern     ceilingGrid, labWall, labBench, cubicles, bedroomWall, bedroom2012, glassAtrium, openOffice, dataCentreAisle
 *   exterior   collegeHall, skyline ('chicago1940' | 'bayArea' | 'megacity'), elTrestle
 */
export * from './common';
export * from './openings';
export * from './walls';
export * from './floors';
export * from './interiors';
export * from './modern';
export * from './exterior';
