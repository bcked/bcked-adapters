/**
 * Circle's USDC reserves come from its attestation reports (Grant Thornton, Deloitte), which list the
 * reserves on two dates a month. scripts/attestations/update.sh adds new reports every week, see
 * scripts/attestations/README.md. Until 2025-11 the holdings of the Circle Reserve Fund were crawled
 * daily from BlackRock, whose terms do not allow that. The reports also include all cash, which the
 * transparency page figure did not.
 */
import fs from "fs";

const details: bcked.entity.Details = {
    name: "Circle",
    identifier: "circle",
    reference: "https://www.circle.com/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    recordsPath = `entities/${details.identifier}/records`;

    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {
        // The reserves are written by the attestation workflow.
        await fs.promises.mkdir(this.recordsPath, { recursive: true });
    }
}
