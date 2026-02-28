

## Add username and email search to messaging recipient finder

### Change: `src/components/messaging/RecipientSearchModal.tsx`

**Line 58** — Expand the `.or()` filter to also match `username` and `email`:
```
.or(`display_name.ilike.%${search}%,full_name.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`)
```

**Line 56** — Add `username` to the select:
```
.select("id, display_name, full_name, username, avatar_url, account_type, is_verified")
```

**Line 14** — Add `username` to the `Recipient` interface:
```ts
username: string | null;
```

**Lines 109, 155, 161, 167** — Update UI to show username when available:
- Placeholder: `"Search by name, username, or email..."`
- Below display name, show `@username` if present
- Show matched email hint if the search looks like an email

