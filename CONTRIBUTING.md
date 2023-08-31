# Contributing

Any contribution is welcome.

To avoid reliance on third party services, this project will require community support to extend
and maintain the list of tracked asset backings.

For the most part this only requires adding or updating data files.

## How do I get set up?

### Install nvm

For the package management, we need to install Node. To install a specific version of Node,
we will first install the [Node Version Management (nvm)](https://github.com/nvm-sh/nvm).

Download and install nvm:

```shell
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
```

Reload the .bashrc:

```shell
source ~/.bashrc
```

### Install Node

You should now be able to list all available Node versions like this (`--lts` for versions with long term support):

```shell
nvm list-remote --lts
```

You can find some information about the major versions and their long term support on the [release page of Node.js](https://nodejs.org/en/about/releases/).

You can install the latest v16 version with long term support with this command:

```shell
nvm install v16 --lts
```

Switch to the project folder and install the dependencies.

```shell
cd portal
npm install
```

## How to locally run the adapters?

To see if everything is working you can run the adapters like that.

```shell
npm run dev
```

## How do I run tests?

Execute:

```shell
npm test
```

## Icons

### General Considerations

-   Original image is stored in SVG format
-   Original image must have a minimum resolution of 256
-   If the original is only available as PNG or JPEG, either embed the SVG
    or trace the image.

### Rules for SVGs

-   Square view box (if not already, can be done using Inkscape)
-   Optional: Normalized view box of 256x256 (can be done using Inkscape)
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

### Helpful Resources

#### Crypo related

-   [coinwink/crypto-logos-cc](https://github.com/coinwink/crypto-logos-cc)
-   [yearn/yearn-assets](https://github.com/yearn/yearn-assets)
-   [curvefi/curve-assets](https://github.com/curvefi/curve-assets)
-   [logotyp.us](https://logotyp.us/)

#### General SVG icons

-   [publicdomainvectors.org](https://publicdomainvectors.org/)
-   [SVG Repo](https://www.svgrepo.com/)
