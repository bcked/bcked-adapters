# Icons

## General Considerations

-   Original image is stored in SVG format
-   Original image must have a minimum resolution of 256
-   If the original is only available as PNG or JPEG, either embed the SVG
    or trace the image.

## Rules for SVGs

-   Square view box
-   All text should be presented as outlines
-   File name `icon.svg`
-   File size <=20kb
-   Transparent background
-   Prettified markup (not minified)
-   Remove any unnecessary content like doctype, XML instructions, comments, editor data
-   Include xmlns for HTML embedding

To simplify the SVG, use the VS Code jock.svg extension command
to minify the SVG as configured in the projects settings.
Afterwards format with prettier.

## Generated and Published Versions

-   Original SVG (`icon.svg`)
-   All rasterized images in PNG format with transparent background
-   PNG resolutions: 16, 32, 48, 64, 128, 256 (`icon16.png`, `icon32.png`, ...)

## Helpful Libraries

-   [@resvg/resvg-js](https://www.npmjs.com/package/@resvg/resvg-js)
-   [sharp](https://www.npmjs.com/package/sharp)

## Helpful Resources

-   [coinwink/crypto-logos-cc](https://github.com/coinwink/crypto-logos-cc)
-   [yearn/yearn-assets](https://github.com/yearn/yearn-assets)
-   [curvefi/curve-assets](https://github.com/curvefi/curve-assets)
