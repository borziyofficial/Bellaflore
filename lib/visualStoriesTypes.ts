export type VisualStoryDestinationType =
  | "product"
  | "category"
  | "catalog"
  | "url";

export type VisualStory = {
  id: string;
  imageUrl: string;
  eyebrow: string;
  title: string;
  destinationType: VisualStoryDestinationType;
  destinationValue: string;
  isEnabled: boolean;
  sortOrder: number;
};

export type VisualStoriesSettings = {
  stories: VisualStory[];
  updatedAt: string;
};
