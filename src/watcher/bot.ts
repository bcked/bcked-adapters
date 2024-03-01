import axios, { AxiosError } from "axios";
import TelegramBot from "node-telegram-bot-api";

const LOGS_CHANNEL = "@bcked_logs";

const bot = new TelegramBot(process.env["BCKED_WATCHER_BOT_TOKEN"]!, { polling: false });

export async function sendErrorReport(subject: string, error: any) {
    if (process.env["DEV_MODE"]) {
        console.info("Error report not sent in DEV_MODE");
        return;
    }
    try {
        let logMessage = "";
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            logMessage = [
                "Error Type: AxiosError",
                `Request: ${axiosError.config?.method} ${axiosError.config?.baseURL}${axiosError.config?.url}`,
                `Status Code: ${axiosError.response?.status ?? "Unknown"}`,
                `Status Text: ${axiosError.response?.statusText ?? "Unknown"}`,
                `Response Data: ${JSON.stringify(
                    axiosError.response?.data || "No response data",
                    null,
                    4
                )}`,
                `Error Message: ${axiosError.message || "Unknown error message"}`,
            ].join("\n");
        } else if (error instanceof Error) {
            logMessage = [
                `Error Type: ${error.name}`,
                `Message: ${error.message}`,
                `Stack Trace: ${error.stack}`,
            ].join("\n");
        } else {
            logMessage = error.toString();
        }

        logMessage = [
            `Subject: ${subject}`,
            `Date: ${new Date().toISOString()}`,
            `Log: ${logMessage}`,
        ].join("\n");

        await bot.sendMessage(LOGS_CHANNEL, logMessage);
    } catch (error) {
        console.error("Error sending Telegram message:", error);
    }
}
