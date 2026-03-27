

## Fix: Text Box Not Editable in Design Editor

### Problem
`FabricText` is a **static, non-editable** text object. You can move it but can't type into it. Fabric.js requires `IText` (or `Textbox`) for inline editing.

### Fix (1 file: `DesignEditorModal.tsx`)

1. Change import: `FabricText` → `IText` from `fabric`
2. In `addText`, replace `new FabricText(...)` with `new IText(...)`, then call `t.enterEditing()` and `t.hiddenTextarea?.focus()` so it's immediately editable on creation

That's it — one import swap, one constructor change, two extra lines.

| Action | File |
|--------|------|
| Edit | `src/components/storyboards/DesignEditorModal.tsx` |

