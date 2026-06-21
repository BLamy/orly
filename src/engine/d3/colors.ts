import type { MessageKind, NodeKind } from '../../types';

export const KIND_COLOR: Record<NodeKind, string> = {
  client: '#38bdf8',
  loadbalancer: '#a78bfa',
  service: '#34d399',
  database: '#fbbf24',
  cache: '#f472b6',
  queue: '#fb923c',
  worker: '#2dd4bf',
  external: '#94a3b8',
  vault: '#f5b942',
  key: '#c084fc',
  proxy: '#22d3ee',
  record: '#fb7185',
};

export const MSG_COLOR: Record<MessageKind, string> = {
  request: '#38bdf8',
  response: '#34d399',
  data: '#a78bfa',
  event: '#fb923c',
};
