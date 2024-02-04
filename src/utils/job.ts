import "dotenv/config";
import { REGISTER_INSTANCE } from "ts-node";

export async function job(name: string, job: () => Promise<void>) {
    console.time(name);

    if (process[REGISTER_INSTANCE]) {
        process.env.DEV_MODE = "true";
    }

    await job();

    console.timeEnd(name);
}
