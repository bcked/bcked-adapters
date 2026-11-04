/**
 * PYUSDx on Ethereum, issued by MoonPay Digital Assets Limited on M0. PYUSDx backs Saturn Dollar
 * (USDat): the USDat contract holds it. MoonPay describes PYUSDx as backed by PayPal USD (PYUSD)
 * held in reserve: https://www.moonpay.com/enterprise/pyusdx
 *
 * Supply is the token's totalSupply, read on-chain. PYUSDx moves between chains by burning on one
 * chain and minting on the other. There is no Chainlink feed for PYUSDx, so there is no price.
 *
 * The backing is not recorded. The PYUSD reserves are not held by the PYUSDx contract, and no
 * reserve address or report for PYUSDx was found on MoonPay's pages. The icon is generic.
 */
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "PYUSDx",
    symbol: "PYUSDx",
    identifier: {
        address: "0xeBDB0942cE16386Ab90718C7BD10C91CDb66b14d",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "moonpay",
    },
    reference: "https://www.moonpay.com/enterprise/pyusdx",
    tags: ["stablecoin"],
};

export default class Adapter implements bcked.asset.Adapter {
    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        return [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        const circulating = await onChainSupply(
            details.identifier.address,
            details.identifier.system
        );
        return [
            {
                timestamp: toISOString(Date.now()),
                circulating,
                burned: null,
                total: null,
                issued: null,
                max: null,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        return [];
    }
}
