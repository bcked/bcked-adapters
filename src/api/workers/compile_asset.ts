import path from "path";
import { parentPort } from "worker_threads";
import { FILES, PATHS } from "../../constants";
import { sendErrorReport } from "../../watcher/bot";
import { ASSET_RESOURCES } from "../resources/assets";
import { compileHistory } from "../utils/history";
import { compileDetails, compileIcons } from "../utils/compile";

parentPort?.on("message", async (id: bcked.asset.Id) => {
    console.log(`Compile asset ${id}`);
    try {
        await Promise.all([
            ASSET_RESOURCES.asset(id),
            compileDetails(ASSET_RESOURCES, PATHS.assets, id),
            compileIcons(ASSET_RESOURCES, PATHS.assets, id),
            compileHistory<typeof id, bcked.asset.Price, "usd">(
                path.join(PATHS.assets, id, PATHS.records, FILES.csv.price),
                id,
                "usd",
                ASSET_RESOURCES.priceHistory,
                ASSET_RESOURCES.priceYear,
                ASSET_RESOURCES.priceMonth,
                ASSET_RESOURCES.priceDay,
                ASSET_RESOURCES.priceHour
            ),
            compileHistory<typeof id, bcked.asset.SupplyAmount, "amount">(
                path.join(PATHS.assets, id, PATHS.records, FILES.csv.supplyAmount),
                id,
                "amount",
                ASSET_RESOURCES.supplyHistory,
                ASSET_RESOURCES.supplyYear,
                ASSET_RESOURCES.supplyMonth,
                ASSET_RESOURCES.supplyDay,
                ASSET_RESOURCES.supplyHour
            ),
            compileHistory<typeof id, bcked.asset.MarketCap, "usd">(
                path.join(PATHS.assets, id, PATHS.records, FILES.csv.marketCap),
                id,
                "usd",
                ASSET_RESOURCES.marketCapHistory,
                ASSET_RESOURCES.marketCapYear,
                ASSET_RESOURCES.marketCapMonth,
                ASSET_RESOURCES.marketCapDay,
                ASSET_RESOURCES.marketCapHour
            ),
            compileHistory<typeof id, bcked.asset.Relationships, "usd">(
                path.join(PATHS.assets, id, PATHS.records, FILES.csv.underlyingAssets),
                id,
                "usd",
                ASSET_RESOURCES.underlyingAssetsHistory,
                ASSET_RESOURCES.underlyingAssetsYear,
                ASSET_RESOURCES.underlyingAssetsMonth,
                ASSET_RESOURCES.underlyingAssetsDay,
                ASSET_RESOURCES.underlyingAssetsHour
            ),
            compileHistory<typeof id, bcked.asset.Collateralization, "ratio">(
                path.join(PATHS.assets, id, PATHS.records, FILES.csv.collateralizationRatio),
                id,
                "ratio",
                ASSET_RESOURCES.collateralizationRatioHistory,
                ASSET_RESOURCES.collateralizationRatioYear,
                ASSET_RESOURCES.collateralizationRatioMonth,
                ASSET_RESOURCES.collateralizationRatioDay,
                ASSET_RESOURCES.collateralizationRatioHour
            ),
        ]);

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(`/${PATHS.assets}/${id}`, error);
        await sendErrorReport(`/${PATHS.assets}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
