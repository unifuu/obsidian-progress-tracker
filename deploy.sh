#!/usr/bin/env bash

# Build this plugin and install only its runtime files into an Obsidian vault.
# Set the vault path in .vault-path, or override it for one run:
#   OBSIDIAN_VAULT="/path/to/My Vault" ./deploy.sh

set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
vault_config="$script_dir/.vault-path"
configured_vault=""
if [[ -f "$vault_config" ]]; then
  configured_vault="$(< "$vault_config")"
fi

vault_dir="${OBSIDIAN_VAULT:-$configured_vault}"
if [[ -z "$vault_dir" ]]; then
  echo "Set the vault path in .vault-path or provide OBSIDIAN_VAULT." >&2
  exit 1
fi

plugin_dir="$vault_dir/.obsidian/plugins/obsidian-progress-tracker"

if [[ ! -d "$vault_dir/.obsidian" ]]; then
  echo "Obsidian vault not found: $vault_dir" >&2
  exit 1
fi

cd "$script_dir"
echo "Building Progress Tracker…"
npm run build

mkdir -p "$plugin_dir"
for runtime_file in main.js manifest.json styles.css; do
  if [[ -f "$runtime_file" ]]; then
    cp -p "$runtime_file" "$plugin_dir/$runtime_file"
  fi
done

echo "Deployed to: $plugin_dir"
echo "Reload Obsidian or toggle the plugin off and on to use the new version."
