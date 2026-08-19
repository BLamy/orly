// The bookshelf renders Docstream markdown and live VizEmbed scenes, but it
// never enables Docstream's optional almost-node React preview. Keep that
// optional peer out of the production bundle; the Vite alias documents the
// boundary and fails clearly if the unused preview is ever invoked here.
export class VirtualFS {
  constructor() {
    throw new Error('Docstream almost-node previews are not enabled in the bookshelf.');
  }
}

export function createContainer(): never {
  throw new Error('Docstream almost-node previews are not enabled in the bookshelf.');
}
