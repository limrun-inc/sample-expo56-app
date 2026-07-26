export type User = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string;
};

export type Post = {
  id: string;
  authorId: string;
  authorHandle: string;
  authorName: string;
  avatarUrl: string;
  caption: string;
  imageUrl: string;
  imageAspectRatio: number;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: number;
};

export type Comment = {
  id: string;
  postId: string;
  authorHandle: string;
  body: string;
  createdAt: number;
};

export type Story = {
  id: string;
  authorHandle: string;
  avatarUrl: string;
  seen: boolean;
};

export type Place = {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  rating: number;
};

export type ActivityEvent = {
  id: number;
  kind: string;
  detail: string;
  createdAt: number;
};
