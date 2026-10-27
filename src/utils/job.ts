export async function job(name: string, job: () => Promise<void>) {
    console.time(name);

    try {
        await job();
    } catch (error) {
        console.error(`Job "${name}" failed:`, error);
        // Fail the process, so CI does not deploy partial results.
        process.exitCode = 1;
    }

    console.timeEnd(name);
}
