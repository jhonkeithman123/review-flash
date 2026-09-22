/**
 * Storybook CSF (Component Story Format) helper utilities for Pressbook
 */
export interface StoryMeta<T = any> {
  title: string;
  component?: any;
  parameters?: Record<string, any>;
  args?: Partial<T>;
  decorators?: Array<(story: () => any, context: any) => any>;
}

export interface StoryFn<T = any> {
  (): any;
  args?: Partial<T>;
  parameters?: Record<string, any>;
  storyName?: string;
}

/**
 * Normalizes and extracts story information for programmatic checking
 */
export function getStoryMetadata(storyMeta: StoryMeta, storyFn: StoryFn) {
  return {
    title: storyMeta.title,
    storyName: storyFn.storyName || storyFn.name,
    combinedArgs: { ...(storyMeta.args || {}), ...(storyFn.args || {}) },
    parameters: {
      ...(storyMeta.parameters || {}),
      ...(storyFn.parameters || {}),
    },
  };
}
