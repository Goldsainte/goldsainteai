

## Change Input Border Color to Goldsainte Green

The Post Trip page defines a shared input class on **line 417** of `PostTripPage.tsx`:

```
border-[#E5DFC6]  →  border-[#0c4d47]
```

### Change

**`src/pages/trips/PostTripPage.tsx`** — Update the `inputCls` constant to use Goldsainte green (`#0c4d47`) for the border color instead of the current cream/gold (`#E5DFC6`). This single change applies to all text inputs, date inputs, textareas, and select fields across all 6 steps of the form.

