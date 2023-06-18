# Contributing

Any contribution is welcome.

To avoid reliance on third party services, this project will require community support to extend and maintain the list of tracked asset backings.

For the most part this only requires adding or updating data files.

## How do I get set up?

### Install nvm

For the package management, we need to install Node. To install a specific version of Node, we will first install the [Node Version Management (nvm)](https://github.com/nvm-sh/nvm).

Download and install nvm:

```shell
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
```

Reload the .bashrc:

```shell
source ~/.bashrc
```

### Install Node

You should now be able to list all available Node versions like this (``--lts`` for versions with long term support):

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
