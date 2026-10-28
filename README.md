<p align="center">
  <a href="https://github.com/bcked/bcked-adapters/actions/workflows/build.yml"><img src="https://github.com/bcked/bcked-adapters/actions/workflows/build.yml/badge.svg" alt="Code Build and Deployment"></a><a href="https://github.com/bcked/bcked-adapters/actions/workflows/crawler.yml"><img src="https://github.com/bcked/bcked-adapters/actions/workflows/crawler.yml/badge.svg" alt="Crawler Execution"></a><a href="https://github.com/bcked/bcked-adapters/actions/workflows/api.yml"><img src="https://github.com/bcked/bcked-adapters/actions/workflows/api.yml/badge.svg" alt="API Build and Deployment"></a>
</p>

<p align="center"> The official data adapters and API for <a href="https://bcked.com/">bcked.com</a> - a community driven resource on cryptocurrency backing.</p>

<p align="center"><em>Check the API docs out at <a href="https://api.bcked.com/docs/">api.bcked.com/docs</a>.</em></p>

## Contributing

bcked grows with every token someone adds. Pick the route that fits:

1. **Request a token.** Open the [token request form](https://github.com/bcked/bcked-adapters/issues/new?template=add-token.yml) with a link to where the backing is published.
2. **Pick up a request.** Open requests carry the label [`token-request`](https://github.com/bcked/bcked-adapters/issues?q=is%3Aissue+is%3Aopen+label%3Atoken-request).
3. **Report wrong data** with the [correction form](https://github.com/bcked/bcked-adapters/issues/new?template=correction.yml).

Tokens need a circulating market cap of at least $100M and backing that can be checked from public sources. Smaller tokens are kept in [`watchlist.csv`](watchlist.csv). The [contribution guide](CONTRIBUTING.md) explains the rules and how a token is defined.

## License

- **Code:** [PolyForm Noncommercial 1.0.0](LICENSE). Free for personal use, research, education, and
  for non-profit and public organizations. Everything outside the data below.
- **Data:** [CC BY-NC 4.0](LICENSE-DATA). Covers the records on the `records` branch, the stored evidence
  index and the API at [api.bcked.com](https://api.bcked.com). Attribution: "Data: bcked.com".
- **Commercial use** of the code or the data needs a separate license. Contact [contact@bcked.com](mailto:contact@bcked.com).

Versions released before this change stay available under the GNU General Public License, Version 3.
Attestation reports in `records/evidence` belong to their issuers and auditors and are not covered by
these licenses. The icons are property of their respective copyright holders.

## Legal Notice

See our Terms and Conditions [here](LEGAL_NOTICE.md).
