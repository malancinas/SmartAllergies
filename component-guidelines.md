# Component Guidelines

## Using UI Components

All components are exported from `src/components/ui/index.ts` and layout primitives from `src/components/layout/index.ts`.

```tsx
import { Button, Input, Card, Avatar } from '@/components/ui';
import { Screen, Stack, Row } from '@/components/layout';
```

## Component Reference

### Button

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `primary \| secondary \| outline \| ghost \| destructive` | `primary` | Visual style |
| `size` | `sm \| md \| lg` | `md` | Button size |
| `loading` | `boolean` | `false` | Shows Spinner, disables press |
| `disabled` | `boolean` | `false` | Disables interaction |
| `leftIcon` | `ReactNode` | — | Icon before text |
| `rightIcon` | `ReactNode` | — | Icon after text |
| `onPress` | `() => void` | — | Press handler |

```tsx
// ✅ Do
<Button variant="primary" onPress={handleSubmit} loading={isLoading}>
  Submit
</Button>

// ❌ Don't — don't nest a Button inside another Pressable
<Pressable onPress={...}>
  <Button>Click</Button>
</Pressable>
```

### Input

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Label above the input |
| `error` | `string` | Error message below |
| `secureTextEntry` | `boolean` | Password masking |
| `leftIcon` / `rightIcon` | `ReactNode` | Icon inside the field |

```tsx
<Input
  label="Email"
  placeholder="you@example.com"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
/>
```

### Card

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `variant` | `elevated \| outlined \| flat` | No | `flat` | Visual style |
| `onPress` | `() => void` | No | — | Makes the card pressable |
| `children` | `ReactNode` | Yes | — | Card content |
| `testID` | `string` | No | — | Test selector |

```tsx
// Pressable card
<Card variant="elevated" onPress={() => navigate('Detail')}>
  <Text>Content</Text>
</Card>

// Static card
<Card variant="outlined">
  <Text>Content</Text>
</Card>
```

### Avatar

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `uri` | `string` | No | — | Remote image URL |
| `name` | `string` | No | — | Fallback initials source |
| `size` | `sm \| md \| lg \| xl` | No | `md` | Avatar dimensions |
| `badge` | `boolean` | No | `false` | Shows online indicator |
| `testID` | `string` | No | — | Test selector |

```tsx
// With image
<Avatar uri={user.avatarUrl} size="lg" badge />

// Fallback to initials
<Avatar name="John Doe" size="md" />
```

### Modal

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `visible` | `boolean` | Yes | — | Controls visibility |
| `onClose` | `() => void` | Yes | — | Called on backdrop press or close action |
| `title` | `string` | No | — | Modal header title |
| `children` | `ReactNode` | Yes | — | Modal body content |
| `testID` | `string` | No | — | Test selector |

```tsx
<Modal visible={isOpen} onClose={() => setIsOpen(false)} title="Confirm">
  <Text>Are you sure?</Text>
  <Button onPress={handleConfirm}>Yes</Button>
</Modal>
```

### BottomSheet

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `visible` | `boolean` | Yes | — | Controls visibility |
| `onClose` | `() => void` | Yes | — | Called when dismissed |
| `snapPoints` | `string[]` | No | `['50%']` | Sheet snap positions |
| `children` | `ReactNode` | Yes | — | Sheet content |
| `testID` | `string` | No | — | Test selector |

```tsx
<BottomSheet visible={isOpen} onClose={() => setIsOpen(false)} snapPoints={['40%', '80%']}>
  <Text>Sheet content</Text>
</BottomSheet>
```

### Toast

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `message` | `string` | Yes | — | Message to display |
| `type` | `success \| error \| warning \| info` | No | `info` | Visual variant |
| `duration` | `number` | No | `3000` | Auto-dismiss time in ms |
| `onDismiss` | `() => void` | No | — | Called after dismiss |
| `testID` | `string` | No | — | Test selector |

```tsx
// Trigger imperatively via hook
const { showToast } = useToast();
showToast({ message: 'Saved!', type: 'success' });
```

### Loader

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `size` | `sm \| md \| lg` | No | `md` | Indicator size |
| `color` | `string` | No | primary token | Spinner color |
| `overlay` | `boolean` | No | `false` | Full-screen blocking overlay |
| `testID` | `string` | No | — | Test selector |

```tsx
// Inline
<Loader size="sm" />

// Full-screen overlay while fetching
<Loader overlay />
```

### Tabs

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `tabs` | `{ key: string; label: string }[]` | Yes | — | Tab definitions |
| `activeKey` | `string` | Yes | — | Currently active tab key |
| `onChange` | `(key: string) => void` | Yes | — | Called on tab press |
| `testID` | `string` | No | — | Test selector |

```tsx
<Tabs
  tabs={[{ key: 'feed', label: 'Feed' }, { key: 'explore', label: 'Explore' }]}
  activeKey={activeTab}
  onChange={setActiveTab}
/>
```

### ListItem

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | Yes | — | Primary text |
| `subtitle` | `string` | No | — | Secondary text |
| `leftElement` | `ReactNode` | No | — | Left slot (icon/avatar) |
| `rightElement` | `ReactNode` | No | — | Right slot (badge/chevron) |
| `onPress` | `() => void` | No | — | Makes row pressable |
| `testID` | `string` | No | — | Test selector |

```tsx
<ListItem
  title="Jane Doe"
  subtitle="Last message preview"
  leftElement={<Avatar name="Jane Doe" size="sm" />}
  onPress={() => navigate('Chat')}
/>
```

### Switch

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `boolean` | Yes | — | Current toggle state |
| `onValueChange` | `(val: boolean) => void` | Yes | — | Called on toggle |
| `disabled` | `boolean` | No | `false` | Disables interaction |
| `label` | `string` | No | — | Accessible label |
| `testID` | `string` | No | — | Test selector |

```tsx
<Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} label="Notifications" />
```

### Checkbox

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `checked` | `boolean` | Yes | — | Checked state |
| `onChange` | `(val: boolean) => void` | Yes | — | Called on press |
| `label` | `string` | No | — | Text label |
| `disabled` | `boolean` | No | `false` | Disables interaction |
| `testID` | `string` | No | — | Test selector |

```tsx
<Checkbox checked={agreed} onChange={setAgreed} label="I agree to the terms" />
```

### Radio

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `options` | `{ value: string; label: string }[]` | Yes | — | Radio options |
| `value` | `string` | Yes | — | Selected value |
| `onChange` | `(val: string) => void` | Yes | — | Called on selection |
| `disabled` | `boolean` | No | `false` | Disables all options |
| `testID` | `string` | No | — | Test selector |

```tsx
<Radio
  options={[{ value: 'ios', label: 'iOS' }, { value: 'android', label: 'Android' }]}
  value={platform}
  onChange={setPlatform}
/>
```

### Slider

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `number` | Yes | — | Current value |
| `onValueChange` | `(val: number) => void` | Yes | — | Called during drag |
| `min` | `number` | No | `0` | Minimum value |
| `max` | `number` | No | `100` | Maximum value |
| `step` | `number` | No | `1` | Increment step |
| `disabled` | `boolean` | No | `false` | Disables interaction |
| `testID` | `string` | No | — | Test selector |

```tsx
<Slider value={volume} onValueChange={setVolume} min={0} max={100} step={5} />
```

### Divider

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `orientation` | `horizontal \| vertical` | No | `horizontal` | Line direction |
| `color` | `string` | No | neutral token | Line color |
| `thickness` | `number` | No | `1` | Line width in px |
| `testID` | `string` | No | — | Test selector |

```tsx
<Divider />
<Divider orientation="vertical" thickness={2} />
```

### Badge

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string \| number` | Yes | — | Badge text or count |
| `variant` | `primary \| success \| warning \| error \| neutral` | No | `primary` | Color variant |
| `size` | `sm \| md` | No | `md` | Badge size |
| `testID` | `string` | No | — | Test selector |

```tsx
<Badge label={unreadCount} variant="error" />
<Badge label="New" variant="success" size="sm" />
```

### Spinner

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `size` | `sm \| md \| lg` | No | `md` | Spinner dimensions |
| `color` | `string` | No | primary token | Spinner color |
| `testID` | `string` | No | — | Test selector |

```tsx
// Inline loading indicator
<Spinner size="sm" />
```

## Theming Guide

All theme tokens are in `src/theme/tokens.ts`. Use them via Tailwind classes:

```tsx
// ✅ Use Tailwind classes (NativeWind)
<View className="bg-primary-500 rounded-lg p-4" />

// ✅ When you need JS values (e.g. react-native-reanimated)
import { colors } from '@/theme/tokens';
const style = { backgroundColor: colors.primary[500] };

// ❌ Don't use StyleSheet.create for new components
```

Dark mode is automatic via `dark:` variants:

```tsx
<Text className="text-neutral-900 dark:text-white">Hello</Text>
```

## Creating a New Component

1. Create `src/components/ui/MyComponent.tsx`
2. Export a typed `MyComponentProps` interface
3. Accept `testID` prop for testing
4. Use NativeWind classes exclusively — no `StyleSheet.create`
5. Add export to `src/components/ui/index.ts`
6. Document it in this file

## Extending an Existing Component

Add new variants or sizes through the existing `variantClasses` / `sizeClasses` maps — don't add conditional `if` branches inside JSX.
