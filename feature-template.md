# Feature Template

Step-by-step guide to add a new feature module.

## Example: Adding a `posts` feature

### Step 1 — Create folder structure

```bash
mkdir -p src/features/posts/{screens,components,hooks/__tests__}
touch src/features/posts/types.ts
touch src/features/posts/api.ts
touch src/features/posts/store.ts
```

### Step 2 — Define `types.ts`

```ts
// src/features/posts/types.ts
export interface Post {
  id: string;
  title: string;
  body: string;
  authorId: string;
  createdAt: string;
}

export interface CreatePostValues {
  title: string;
  body: string;
}
```

### Step 3 — Write service functions + TanStack Query hooks in `api.ts`

```ts
// src/features/posts/api.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/api/client';
import { Post, CreatePostValues } from './types';

// Raw service function
async function fetchPosts(): Promise<Post[]> {
  const { data } = await apiClient.get<Post[]>('/posts');
  return data;
}

// TanStack Query hook
export function usePostsQuery() {
  return useQuery({ queryKey: ['posts'], queryFn: fetchPosts });
}

export function useCreatePostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CreatePostValues) =>
      apiClient.post<Post>('/posts', values).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });
}
```

### Step 4 — Set up `store.ts`

```ts
// src/features/posts/store.ts
import { create } from 'zustand';

interface PostsState {
  selectedPostId: string | null;
  setSelectedPostId: (id: string | null) => void;
}

export const usePostsStore = create<PostsState>((set) => ({
  selectedPostId: null,
  setSelectedPostId: (selectedPostId) => set({ selectedPostId }),
}));
```

### Step 5 — Write feature hook in `hooks/usePosts.ts`

```ts
// src/features/posts/hooks/usePosts.ts
import { usePostsQuery, useCreatePostMutation } from '../api';
import { usePostsStore } from '../store';

export function usePosts() {
  const { data: posts = [], isLoading } = usePostsQuery();
  const createMutation = useCreatePostMutation();
  const selectedPostId = usePostsStore((s) => s.selectedPostId);
  const setSelectedPostId = usePostsStore((s) => s.setSelectedPostId);

  return { posts, isLoading, createPost: createMutation.mutate, selectedPostId, setSelectedPostId };
}
```

### Step 6 — Build screens in `screens/`

```tsx
// src/features/posts/screens/PostsScreen.tsx
import React from 'react';
import { FlatList } from 'react-native';
import { Screen } from '@/components/layout';
import { ListItem } from '@/components/ui';
import { usePosts } from '../hooks/usePosts';

export default function PostsScreen() {
  const { posts, isLoading } = usePosts();
  return (
    <Screen padding={false}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ListItem title={item.title} subtitle={item.body} />}
      />
    </Screen>
  );
}
```

### Step 7 — Register screen in navigator

Add `Posts` to `TabParamList` in `src/types/navigation.ts` and add the screen to `TabNavigator.tsx`.

### Step 8 — Add translations

Add `posts` namespace keys to `src/locales/en.json` and `src/locales/ar.json`.

### Step 9 — Write tests

```ts
// src/features/posts/hooks/__tests__/usePosts.test.ts
```

Follow the pattern in `src/features/auth/hooks/__tests__/useAuth.test.ts`.
