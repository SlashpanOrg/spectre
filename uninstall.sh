#!/usr/bin/env bash
set -euo pipefail

# Spectre Uninstaller
# curl -fsSL https://raw.githubusercontent.com/SlashpanOrg/spectre/main/uninstall.sh | bash

INSTALL_DIR="${SPECTRE_INSTALL_DIR:-$HOME/.spectre}"
BIN_DIR="${SPECTRE_BIN_DIR:-/usr/local/bin}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

info()    { echo -e "${CYAN}ℹ  $1${NC}"; }
success() { echo -e "${GREEN}✓  $1${NC}"; }
warn()    { echo -e "${YELLOW}⚠  $1${NC}"; }

main() {
  echo ""
  info "Uninstalling Spectre..."
  echo ""

  if [ -L "$BIN_DIR/spectre" ]; then
    sudo rm -f "$BIN_DIR/spectre"
    success "Removed symlink: $BIN_DIR/spectre"
  fi

  if [ -d "$INSTALL_DIR" ]; then
    rm -rf "$INSTALL_DIR"
    success "Removed installation directory: $INSTALL_DIR"
  fi

  echo ""
  warn "Config directory ($HOME/.spectre) was NOT removed"
  info "To remove config and sessions: rm -rf $HOME/.spectre"
  echo ""
  success "Spectre uninstalled successfully!"
  echo ""
}

main "$@"
