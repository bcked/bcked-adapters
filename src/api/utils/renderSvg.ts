import { renderAsync, type ResvgRenderOptions } from "@resvg/resvg-js";
import { writeBuffer } from "../../utils/files";

export async function renderSvgToPng(svg: Buffer, size: number, filePath: string | undefined) {
    const opts: ResvgRenderOptions = {
        dpi: 300,
        shapeRendering: 2,
        textRendering: 2,
        imageRendering: 0,
        fitTo: {
            mode: "width",
            value: size,
        },
        crop: {
            left: size,
            top: size,
            right: size,
            bottom: size,
        },
        logLevel: "error",
    };
    const resvg = await renderAsync(svg, opts);
    const pngBuffer = resvg.asPng();

    if (filePath) {
        await writeBuffer(filePath, pngBuffer);
    }
}
