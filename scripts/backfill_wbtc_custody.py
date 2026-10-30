"""Daily WBTC custodian holdings over a gap, from current balances minus later flows.

Usage: python3 backfill_wbtc_custody.py <addrs.json> <from YYYY-MM-DD> <out.csv>

<addrs.json> is https://wbtc.network/api/chain/eth/token/wbtc/addresses?type=custodial, saved on the day
of the run. Its balances add up to the holdings of the WBTC API. For every address, the bitcoin
transactions since <from> come from the Esplora API (Blockstream, mempool.space as fallback). The
holdings at the end of a day are the current total minus the net flows after that day.
Results per address are cached in <out.csv>.cache.jsonl, so an interrupted run resumes.

Used for the crawler gap from 2025-11-30 to 2026-10-27. The rebuilt holdings matched the recorded
ones on both ends of the gap (124,966.8601707 and 116,144.64916289 BTC). Addresses that left the
custodian list before the run are not covered, which is why both ends must be checked.
"""
import csv, datetime, json, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

addrs_file, start, out = sys.argv[1], sys.argv[2], sys.argv[3]
start_ts = int(datetime.datetime.fromisoformat(start + "T00:00:00+00:00").timestamp())
# Current balances from the WBTC custodian list. Their sum equals the holdings of the WBTC API.
balances = {a["address"]: int(a["balance"]) for a in json.load(open(addrs_file))["result"] if a["address"] not in ("0", "")}
addrs = list(balances)
# Results per address, so an interrupted run resumes.
cache_file = out + ".cache.jsonl"
done = {}
try:
    for line in open(cache_file):
        entry = json.loads(line)
        done[entry["addr"]] = entry["flows"]
except FileNotFoundError:
    pass

HOSTS = ["https://blockstream.info/api", "https://mempool.space/api"]

def get(path):
    """Esplora API, Blockstream first, mempool.space if it fails or is slow."""
    for attempt in range(8):
        host = HOSTS[attempt % len(HOSTS)]
        try:
            req = urllib.request.Request(host + path, headers={"User-Agent": "bcked-backfill"})
            return json.load(urllib.request.urlopen(req, timeout=10))
        except Exception:
            time.sleep(min(2 ** (attempt // 2), 16))
    raise RuntimeError(path)

def flows(addr):
    """Current confirmed balance and (timestamp, net sats) of every tx since start."""
    balance = balances[addr]
    if addr in done:
        return addr, balance, [tuple(f) for f in done[addr]]
    result, url = [], f"/address/{addr}/txs/chain"
    while True:
        txs = get(url)
        if not txs: return addr, balance, result
        for tx in txs:
            t = tx["status"].get("block_time", 0)
            if t < start_ts: return addr, balance, result
            net = sum(o["value"] for o in tx["vout"] if o.get("scriptpubkey_address") == addr)
            net -= sum(i["prevout"]["value"] for i in tx["vin"] if i.get("prevout") and i["prevout"].get("scriptpubkey_address") == addr)
            result.append((t, net))
        if len(txs) < 25: return addr, balance, result
        url = f"/address/{addr}/txs/chain/{txs[-1]['txid']}"

with ThreadPoolExecutor(6) as pool:
    results = []
    for i, r in enumerate(pool.map(flows, addrs)):
        results.append(r)
        if r[0] not in done:
            with open(cache_file, "a") as f:
                f.write(json.dumps({"addr": r[0], "flows": r[2]}) + "\n")
        if i % 50 == 0: print(i, time.strftime("%H:%M:%S"), flush=True)

total_now = sum(b for _, b, _ in results)
events = sorted((t, n) for _, _, fl in results for t, n in fl)
# Balance at the end of each day = current total - net flows after that day.
day = datetime.date.fromisoformat(start)
today = datetime.datetime.now(datetime.timezone.utc).date()
rows = []
while day <= today:
    end = int(datetime.datetime.combine(day + datetime.timedelta(days=1), datetime.time(), datetime.timezone.utc).timestamp())
    after = sum(n for t, n in events if t >= end)
    rows.append((day.isoformat(), (total_now - after) / 1e8))
    day += datetime.timedelta(days=1)
with open(out, "w", newline="") as f:
    w = csv.writer(f); w.writerow(["date", "btc"]); w.writerows(rows)
print("now", total_now / 1e8, "events", len(events), "first", rows[0], "last", rows[-1])
