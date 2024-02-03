export function supplyAmount(supply: bcked.asset.Supply): number | null {
    return supply.total || supply.circulating || supply.issued || supply.max;
}
