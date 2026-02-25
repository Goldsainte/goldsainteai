

# Remove "Influencer Program" and "Travel Agent Services" from Footer

## Scope
Remove two links from the Partners section of the footer: "Become a Travel Agent" (`becomeAgent`) and "Influencer Program" (`influencerProgram`). These appear in both the mobile accordion footer and the desktop column footer.

## Files to Edit

### 1. `src/components/Footer.tsx`
- **Line 70**: Remove `<li><Link to="/apply/agent" ...>{t('footer.becomeAgent')}</Link></li>` (mobile accordion)
- **Line 71**: Remove `<li><Link to="/creators" ...>{t('footer.influencerProgram')}</Link></li>` (mobile accordion)
- **Line 140**: Remove `<li><Link to="/apply/agent" ...>{t('footer.becomeAgent')}</Link></li>` (desktop column)
- **Line 141**: Remove `<li><Link to="/creators" ...>{t('footer.influencerProgram')}</Link></li>` (desktop column)

This leaves "List Your Company" as the sole item under Partners in both layouts.

### 2. `src/i18n/locales/en.json`
- Remove the `footer.becomeAgent` and `footer.influencerProgram` translation keys (lines 371-372) since they're no longer referenced anywhere in the footer.

