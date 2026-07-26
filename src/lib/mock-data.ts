import type { Place, Story, User } from './types';

export const USERS: User[] = [
  { id: 'u1', handle: 'aurora.dev', displayName: 'Aurora Lindqvist', avatarUrl: 'https://i.pravatar.cc/150?img=1' },
  { id: 'u2', handle: 'kenji_frames', displayName: 'Kenji Watanabe', avatarUrl: 'https://i.pravatar.cc/150?img=12' },
  { id: 'u3', handle: 'mara.codes', displayName: 'Mara Okafor', avatarUrl: 'https://i.pravatar.cc/150?img=5' },
  { id: 'u4', handle: 'diego_trail', displayName: 'Diego Ferreira', avatarUrl: 'https://i.pravatar.cc/150?img=15' },
  { id: 'u5', handle: 'lena.shoots', displayName: 'Lena Petrova', avatarUrl: 'https://i.pravatar.cc/150?img=9' },
  { id: 'u6', handle: 'sam_builds', displayName: 'Sam Whitaker', avatarUrl: 'https://i.pravatar.cc/150?img=33' },
  { id: 'u7', handle: 'noor.pixel', displayName: 'Noor Haddad', avatarUrl: 'https://i.pravatar.cc/150?img=20' },
  { id: 'u8', handle: 'theo_wanders', displayName: 'Theo Brandt', avatarUrl: 'https://i.pravatar.cc/150?img=52' },
];

const CAPTIONS = [
  'Golden hour hits different when the build finally passes.',
  'Shipping from a coffee shop in Lisbon today.',
  'This trail took four hours but the view paid for itself.',
  'Prototype v3 of the pocket synth is alive!',
  'Studio day. New series dropping next week.',
  'Sometimes the best debugging tool is a long walk.',
  'Handmade pasta night — recipe in comments.',
  'Caught the northern lights on the drive home.',
  'City looks unreal from the rooftop at 6am.',
  'Weekend project: rebuilt my desk setup from scratch.',
  'First cold plunge of the season. Zero regrets.',
  'Found this bookshop hidden behind a courtyard.',
  'Race day! Personal best by 42 seconds.',
  'The new lens absolutely slaps in low light.',
  'Plants are thriving, and so am I.',
  'Late night sketching session turned into sunrise.',
];

const COMMENT_BODIES = [
  'This is incredible!',
  'Where is this? Adding it to my list.',
  'Tutorial when?',
  'The colors here are unreal.',
  'Been waiting for this one!',
  'Absolute masterclass.',
  'Saving this for later.',
  'You make it look so easy.',
  'Insane detail, zoom in y’all.',
  'Congrats, well deserved!',
];

export function seededRandom(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export type SeedPost = {
  id: string;
  authorId: string;
  caption: string;
  imageUrl: string;
  imageAspectRatio: number;
  likeCount: number;
  createdAt: number;
};

export type SeedComment = {
  id: string;
  postId: string;
  authorHandle: string;
  body: string;
  createdAt: number;
};

export function generateSeedData(count = 48): { posts: SeedPost[]; comments: SeedComment[] } {
  const rand = seededRandom(1337);
  const now = Date.now();
  const posts: SeedPost[] = [];
  const comments: SeedComment[] = [];

  for (let i = 0; i < count; i++) {
    const author = USERS[Math.floor(rand() * USERS.length)];
    const postId = `post-${i + 1}`;
    const aspect = [1, 4 / 5, 4 / 3][Math.floor(rand() * 3)];
    posts.push({
      id: postId,
      authorId: author.id,
      caption: CAPTIONS[Math.floor(rand() * CAPTIONS.length)],
      imageUrl: `https://picsum.photos/seed/bench-${i}/900/${Math.round(900 / aspect)}`,
      imageAspectRatio: aspect,
      likeCount: Math.floor(rand() * 4200),
      createdAt: now - Math.floor(rand() * 14 * 24 * 3600 * 1000),
    });

    const commentCount = Math.floor(rand() * 6);
    for (let c = 0; c < commentCount; c++) {
      const commenter = USERS[Math.floor(rand() * USERS.length)];
      comments.push({
        id: `comment-${i}-${c}`,
        postId,
        authorHandle: commenter.handle,
        body: COMMENT_BODIES[Math.floor(rand() * COMMENT_BODIES.length)],
        createdAt: now - Math.floor(rand() * 7 * 24 * 3600 * 1000),
      });
    }
  }

  return { posts, comments };
}

export const STORIES: Story[] = USERS.map((user, index) => ({
  id: `story-${user.id}`,
  authorHandle: user.handle,
  avatarUrl: user.avatarUrl,
  seen: index > 4,
}));

/** Places around San Francisco used by the Discover map. */
export const PLACES: Place[] = [
  { id: 'p1', name: 'Ferry Building Market', category: 'Food hall', latitude: 37.7955, longitude: -122.3937, rating: 4.7 },
  { id: 'p2', name: 'Golden Gate Overlook', category: 'Viewpoint', latitude: 37.8324, longitude: -122.4795, rating: 4.9 },
  { id: 'p3', name: 'Mission Dolores Park', category: 'Park', latitude: 37.7596, longitude: -122.4269, rating: 4.6 },
  { id: 'p4', name: 'Exploratorium', category: 'Museum', latitude: 37.8017, longitude: -122.3973, rating: 4.8 },
  { id: 'p5', name: 'Twin Peaks Summit', category: 'Viewpoint', latitude: 37.7544, longitude: -122.4477, rating: 4.7 },
  { id: 'p6', name: 'Ritual Coffee Roasters', category: 'Cafe', latitude: 37.7565, longitude: -122.4216, rating: 4.5 },
  { id: 'p7', name: 'Ocean Beach Fire Pits', category: 'Beach', latitude: 37.7594, longitude: -122.5107, rating: 4.4 },
  { id: 'p8', name: 'City Lights Booksellers', category: 'Bookstore', latitude: 37.7976, longitude: -122.4066, rating: 4.8 },
];

export const MAP_INITIAL_CAMERA = {
  coordinates: { latitude: 37.7793, longitude: -122.4293 },
  zoom: 11.5,
};

export function randomCommentBody(rand: () => number = Math.random) {
  return COMMENT_BODIES[Math.floor(rand() * COMMENT_BODIES.length)];
}
