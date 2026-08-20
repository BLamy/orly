import type { Meta, StoryObj } from '@storybook/react-vite';
import { EntityRelationshipModel } from './EntityRelationshipModel';

const meta: Meta<typeof EntityRelationshipModel> = {
  title: 'Engineering Change/Entity Relationship Model',
  component: EntityRelationshipModel,
};
export default meta;

export const NormalizeAndRelate: StoryObj<typeof EntityRelationshipModel> = {};
