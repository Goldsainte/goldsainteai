

# Update Swiss Alps Cover Image

## Problem
The current Swiss Alps cover image (`photo-1531366936337`) is actually a northern lights/aurora borealis photo -- not representative of the Swiss Alps at all.

## Fix
Update the `cover_image_url` for the Swiss Alps trip (ID: `ae0ba7ec-39b7-4cd1-8419-fae30b732a30`) in the `packaged_trips` table to a proper Swiss Alps landscape photo.

**New image:** `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80`

This is a stunning high-altitude Swiss Alps panorama with snow-capped peaks, green valleys, and clear skies -- matches the luxury alpine retreat aesthetic perfectly.

**Database update:**
```sql
UPDATE packaged_trips
SET cover_image_url = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80'
WHERE id = 'ae0ba7ec-39b7-4cd1-8419-fae30b732a30';
```

No code changes needed -- the component will automatically display the new image.

