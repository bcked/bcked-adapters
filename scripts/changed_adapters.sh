#!/usr/bin/env bash
# Prints the adapter folders a pull request touches, for scripts/verify_adapter.ts --strict.
#
# Usage: scripts/changed_adapters.sh <base ref>
# Lists every assets/<id> and tokens/<id> folder with a changed file that still exists. When shared
# code changes (src/, the attestation scripts or the verifier), adds a fixed sample of existing
# adapters that covers the main chains, Chainlink prices and report-based backing.
set -euo pipefail

files=$(git diff --name-only "$1"...HEAD)
SAMPLE=(
    "assets/ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    "assets/ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7"
    "assets/ethereum:0x45804880De22913dAFE09f4980848ECE6EcbAf78"
    "assets/solana:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    "assets/tron:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
    "tokens/usdc"
)

{
    echo "$files" | grep -oE '^(assets|tokens)/[^/]+' || true
    if echo "$files" | grep -qE '^(src/|scripts/attestations/|scripts/verify_adapter\.ts|package\.json|bun\.lock)'; then
        printf '%s\n' "${SAMPLE[@]}"
    fi
} | sort -u | while read -r dir; do
    if [ -f "$dir/index.ts" ]; then echo "$dir"; fi
done
