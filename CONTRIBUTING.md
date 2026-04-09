# Contributing

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<short-description>` | `feature/push-notifications` |
| Bug fix | `fix/<short-description>` | `fix/login-crash-on-android` |
| Chore | `chore/<short-description>` | `chore/update-expo-sdk` |

Always branch off `main` and target `main` with your PR (or `develop` for preview builds).

## Commit Message Format

Use **Conventional Commits**:

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

**Types**: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`

**Examples**:
```
feat(auth): add Apple Sign-In support
fix(profile): resolve avatar upload crash on iOS 17
chore(deps): upgrade Expo SDK to 52
docs(readme): update quick start instructions
```

## PR Checklist

Before opening a PR, ensure:

- [ ] `npm run lint` passes with no errors
- [ ] `npm run test` passes
- [ ] New feature has at least one test
- [ ] New UI component is exported from `src/components/ui/index.ts`
- [ ] New feature follows the 6-file module convention (see `architecture.md`)
- [ ] Translation keys added to both `en.json` and `ar.json`
- [ ] `component-guidelines.md` updated if a new component was added

## Code Review Guidelines

- Prefer small, focused PRs over large ones
- Reviewers should check that no store is accessed directly from a screen (must go through a hook)
- Verify dark mode works by checking `dark:` variants are present on all coloured elements
- Ensure no `any` type is introduced — the ESLint rule `@typescript-eslint/no-explicit-any` is set to `error`
