/**
 * A JSON-RPC provider for RPCs with a strict rate limit. TronGrid without an API key allows 300
 * credits per second and then suspends the client for a few seconds ("request credit rate exceeded
 * ..., and the query server is suspended for 5 s"). Bursts of calls, as the crawler makes them,
 * failed one after another, since ethers retries too fast to outlast the suspension.
 *
 * Requests go out one at a time with a gap between them, for all providers of the same URL. A
 * rate-limit answer waits out the suspension the RPC names, then the request is sent again.
 * Measured on TronGrid on 2026-11-26: single eth_calls 350 ms apart all passed, three back to back
 * or a batch of two triggered the suspension.
 */
import {
    FetchRequest,
    JsonRpcProvider,
    type JsonRpcApiProviderOptions,
    type JsonRpcPayload,
    type JsonRpcResult,
    type Networkish,
} from "ethers";

const ATTEMPTS = 6;

/** The error as text. ethers puts the HTTP status and response body into the message. */
function describe(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/** Whether an error is the RPC's rate limit (HTTP 429 or TronGrid's credit message). */
export function isRateLimit(error: unknown): boolean {
    const text = describe(error);
    return text.includes("429") || text.includes("credit rate exceeded");
}

/** Milliseconds to wait after a rate-limit error: the suspension it names plus a second. */
export function suspension(error: unknown): number {
    const text = describe(error);
    const seconds = /suspended for (\d+) s/.exec(text)?.[1];
    return ((seconds ? Number(seconds) : 5) + 1) * 1000;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The request before the next one may go out, per RPC URL.
const QUEUES = new Map<string, Promise<void>>();

export class ThrottledProvider extends JsonRpcProvider {
    constructor(
        private readonly url: string,
        network: Networkish,
        options: JsonRpcApiProviderOptions,
        private readonly gap: number
    ) {
        super(url, network, options);
    }

    /** A request without ethers' own fast retries, which only burn more of the rate limit. */
    override _getConnection(): FetchRequest {
        const request = super._getConnection();
        request.setThrottleParams({ maxAttempts: 1 });
        return request;
    }

    override async _send(payload: JsonRpcPayload | JsonRpcPayload[]): Promise<JsonRpcResult[]> {
        const previous = QUEUES.get(this.url) ?? Promise.resolve();
        let release!: () => void;
        QUEUES.set(this.url, new Promise((resolve) => (release = resolve)));
        await previous;
        try {
            for (let attempt = 1; ; attempt++) {
                try {
                    return await super._send(payload);
                } catch (error) {
                    if (attempt >= ATTEMPTS || !isRateLimit(error)) throw error;
                    await sleep(suspension(error));
                }
            }
        } finally {
            setTimeout(release, this.gap);
        }
    }
}
