import type { Meta, StoryObj } from '@storybook/react-vite';
import { DatabaseMigration } from './DatabaseMigration';

const meta: Meta<typeof DatabaseMigration> = {
  title: 'Engineering Change/Database Migration',
  component: DatabaseMigration,
};
export default meta;

export const ExpandMigrateContract: StoryObj<typeof DatabaseMigration> = {};
