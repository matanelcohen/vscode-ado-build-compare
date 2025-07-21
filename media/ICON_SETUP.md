# Extension Icon Setup

VS Code extensions require PNG icons with specific dimensions for optimal display across all interfaces.

## Icon Requirements

- **Format**: PNG (not SVG)
- **Recommended Size**: 128x128 pixels
- **Background**: Transparent or solid color
- **File Location**: `media/` directory

## Converting SVG to PNG

### Option 1: Online Converter
1. Go to an online SVG to PNG converter (e.g., [CloudConvert](https://cloudconvert.com/svg-to-png))
2. Upload `media/logo.svg`
3. Set dimensions to 128x128 pixels
4. Download as `media/logo.png`

### Option 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick (if not already installed)
brew install imagemagick  # macOS
# or
sudo apt-get install imagemagick  # Ubuntu/Debian

# Convert SVG to PNG
convert media/logo.svg -resize 128x128 media/logo.png
```

### Option 3: Using Inkscape (Command Line)
```bash
# Install Inkscape (if not already installed)
brew install inkscape  # macOS

# Convert SVG to PNG
inkscape --export-type=png --export-width=128 --export-height=128 media/logo.svg --export-filename=media/logo.png
```

### Option 4: Using Node.js (sharp library)
```bash
# Install sharp
npm install sharp

# Create conversion script
node -e "
const sharp = require('sharp');
sharp('media/logo.svg')
  .resize(128, 128)
  .png()
  .toFile('media/logo.png')
  .then(() => console.log('Icon converted successfully!'))
  .catch(err => console.error('Error:', err));
"
```

## After Converting

1. **Update package.json**:
   ```json
   {
     "icon": "media/logo.png"
   }
   ```

2. **Test the icon**:
   ```bash
   npm run package
   ```

3. **Verify** the icon appears correctly in the generated VSIX file

## Icon Best Practices

- **Simple Design**: Icons should be recognizable at small sizes
- **High Contrast**: Ensure visibility on both light and dark themes
- **Consistent Style**: Match VS Code's design language
- **Transparent Background**: Allows icon to work on any background color

## Current Status

- ✅ SVG logo exists (`media/logo.svg`)
- ❌ PNG icon needed (`media/logo.png`)
- ❌ Icon not configured in package.json

Once you convert the SVG to PNG, uncomment and update the icon path in package.json:

```json
{
  "icon": "media/logo.png"
}
```
