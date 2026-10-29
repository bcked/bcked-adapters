## What this adds or changes

<!-- e.g. Adds Tether Gold (XAUT) on Ethereum. Fixes the BUSD supply. -->

## Checklist

- [ ] `bun test`, `bun run check` and `bun run lint` pass
- [ ] Every value comes from a public source that the adapter or record names
- [ ] New tokens meet the [eligibility rules](https://github.com/bcked/bcked-adapters/blob/main/CONTRIBUTING.md#which-tokens-are-tracked)
- [ ] Backing is recorded in units of the underlying asset
- [ ] New assets, issuers and chains have an `icon.svg` that follows the [icon rules](https://github.com/bcked/bcked-adapters/blob/main/CONTRIBUTING.md#icons)
- [ ] New reports are listed in `evidence.csv` with their URL and hash (the PDFs go to the private bcked-evidence repository, not to `records`)
