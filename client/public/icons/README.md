# PWA Icon Generation Instructions

## Quick Setup (Using Online Tool)

The easiest way to generate all PWA icons is to use an online generator:

1. Go to **https://www.pwabuilder.com/imageGenerator**
2. Upload your logo image (`shirur-express-logo.png`)
3. Download the generated icon pack
4. Extract and copy all icons to `client/public/icons/`

## Required Icons

The following icons are required for full PWA compatibility:

### Standard Icons (any purpose)
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png` (required)
- `icon-384x384.png`
- `icon-512x512.png` (required)

### Maskable Icons (for Android adaptive icons)
- `maskable-icon-192x192.png`
- `maskable-icon-512x512.png`

### Favicon sizes
- `icon-16x16.png`
- `icon-32x32.png`

### Shortcut Icons (optional)
- `shortcut-food.png` (96x96)
- `shortcut-orders.png` (96x96)

## Screenshots

For better app store listing, add screenshots:

- `screenshots/screenshot-wide.png` (1280x720) - Desktop view
- `screenshots/screenshot-mobile.png` (750x1334) - Mobile view

## Using Sharp (Node.js)

If you prefer to generate icons programmatically:

```bash
npm install sharp
```

```javascript
const sharp = require('sharp');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  sharp('shirur-express-logo.png')
    .resize(size, size)
    .toFile(`icons/icon-${size}x${size}.png`);
});
```

## Icon Design Guidelines

1. **Safe Zone**: For maskable icons, keep important content within the center 80%
2. **Background**: Use a solid background color (#1a1a2e recommended)
3. **Minimum Size**: Ensure the icon is recognizable at 48x48 pixels
4. **Format**: PNG with transparency (for standard icons) or solid background (for maskable)

## Testing

After adding icons, test your PWA at:
- https://www.pwabuilder.com/
- Chrome DevTools > Application > Manifest
- Lighthouse PWA audit
