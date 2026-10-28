# Contributing

Any contribution is welcome.

To avoid reliance on third party services, this project will require community support to extend
and maintain the list of tracked asset backings.

For the most part this only requires adding or updating data files.

## How do I get set up?

The project runs on [Bun](https://bun.sh/), which executes the TypeScript sources directly.

Install Bun:

```shell
curl -fsSL https://bun.sh/install | bash
```

Switch to the project folder and install the dependencies.

```shell
cd bcked-adapters
bun install
```

API keys for the data sources are read from a `.env` file in the project root
(`ALCHEMY_ETHEREUM`, `ALCHEMY_POLYGON`, `ALCHEMY_SOLANA`, `ALCHEMY_ARBITRUM`, `ETHERSCAN_API_KEY`).
Bun loads it automatically.

## How to locally run the adapters?

Collected records are stored on the `records` branch. To work with existing data, copy the
`records` folders from that branch into the matching `assets/`, `entities/` and `systems/` folders.
They are ignored by git on `main`.

Run the crawler, which queries all adapters and appends new records:

```shell
bun run crawler
```

Build the API resources from the records into `./api`:

```shell
bun run api
```

## How do I run tests and checks?

```shell
bun test
bun run check
bun run lint
```

## Icons

### General considerations

- Original image is stored in SVG format
- Original image must have a minimum resolution of 256
- If the original is only available as PNG or JPEG, either embed the SVG
  or trace the image.

### Rules for SVGs

- Square view box
- Optional: Normalized view box of 256x256
- All text should be presented as outlines
- File name `icon.svg`
- File size <=30kb
- Transparent background
- Prettified markup (not minified)
- Remove any unnecessary content like doctype, XML instructions, comments, editor data
- Include xmlns for HTML embedding

#### How to resize view box?

1.  Open SVG in Inkscape.
2.  Select all objects in the SVG (STRG + A).
3.  Navigate to "Object" -> "Transform" -> "Scale"
4.  Select "px"
5.  Select "Scale propertionally"
6.  Enter 256 for width and height
7.  Press apply
8.  Open "File" -> "Document Properties"
9.  Adjust "Custom size" width and height to 256 and close window
10. "File" -> Save a Copy

#### How to prettify SVG?

To simplify the SVG, use the VS Code jock.svg extension command "Minify SVG"
to minify the SVG as configured in the projects settings.
Afterwards format with prettier.

### Helpful resources

#### Crypo related

- [coinwink/crypto-logos-cc](https://github.com/coinwink/crypto-logos-cc)
- [yearn/yearn-assets](https://github.com/yearn/yearn-assets)
- [curvefi/curve-assets](https://github.com/curvefi/curve-assets)
- [logotyp.us](https://logotyp.us/)

#### General SVG icons

- [publicdomainvectors.org](https://publicdomainvectors.org/)
- [SVG Repo](https://www.svgrepo.com/)

## License of contributions

The project is licensed for non-commercial use, and commercial licenses are sold separately (see the
[README](README.md#license)). By submitting a contribution you confirm that you have the right to
submit it, and you grant Sebastian Penhouet a perpetual, worldwide, royalty-free license to use,
modify and relicense your contribution, including under commercial licenses.
