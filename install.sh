#!/usr/bin/env bash
set -euo pipefail

# Spectre Installer
# curl -fsSL https://raw.githubusercontent.com/SlashpanOrg/spectre/main/install.sh | bash

SPECTRE_REPO="SlashpanOrg/spectre"
SPECTRE_VERSION="latest"
INSTALL_DIR="${SPECTRE_INSTALL_DIR:-$HOME/.spectre}"
BIN_DIR="${SPECTRE_BIN_DIR:-$HOME/.local/bin}"
NODE_MIN_VERSION=20

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${CYAN}ℹ  $1${NC}"; }
success() { echo -e "${GREEN}✓  $1${NC}"; }
warn()    { echo -e "${YELLOW}⚠  $1${NC}"; }
error()   { echo -e "${RED}✗  $1${NC}" >&2; }

logo() {
  echo -e "${CYAN}"
  cat << 'EOF'
  ███████╗██████╗ ███████╗ ██████╗████████╗██████╗ ███████╗
  ██╔════╝██╔══██╗██╔════╝██╔════╝╚══██╔══╝██╔══██╗██╔════╝
  ███████╗██████╔╝█████╗  ██║        ██║   ██████╔╝█████╗  
  ╚════██║██╔═══╝ ██╔══╝  ██║        ██║   ██╔══██╗██╔══╝  
  ███████║██║     ███████╗╚██████╗   ██║   ██║  ██║███████╗
  ╚══════╝╚═╝     ╚══════╝ ╚═════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝
EOF
  echo -e "  v0.2.0${NC}"
}

check_node() {
  if ! command -v node &> /dev/null; then
    error "Node.js is not installed"
    echo ""
    echo "Install Node.js >= ${NODE_MIN_VERSION}:"
    echo "  macOS: brew install node"
    echo "  Linux: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo "  Or visit: https://nodejs.org"
    exit 1
  fi

  local node_version
  node_version=$(node -e "console.log(process.version.slice(1).split('.')[0])")
  if [ "$node_version" -lt "$NODE_MIN_VERSION" ]; then
    error "Node.js version ${node_version} found, but >= ${NODE_MIN_VERSION} is required"
    echo "Current: $(node --version)"
    echo "Required: >= ${NODE_MIN_VERSION}.0"
    exit 1
  fi
  success "Node.js $(node --version) found"
}

check_npm() {
  if ! command -v npm &> /dev/null; then
    error "npm is not installed"
    exit 1
  fi
  success "npm $(npm --version) found"
}

check_git() {
  if ! command -v git &> /dev/null; then
    error "git is not installed"
    echo "Install git: brew install git (macOS) or apt-get install git (Linux)"
    exit 1
  fi
  success "git found"
}

check_build_tools() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v xcodebuild &> /dev/null; then
      warn "Xcode command line tools not found (needed for native modules)"
      info "Installing Xcode command line tools..."
      xcode-select --install 2>/dev/null || true
    fi
  fi
}

create_install_dir() {
  local src_dir="$INSTALL_DIR/src"

  if [ -d "$src_dir" ]; then
    info "Updating existing installation in $src_dir..."
    rm -rf "$src_dir"
    success "Cleared source directory"
  fi

  mkdir -p "$src_dir"
  success "Created source directory: $src_dir"
}

clone_repo() {
  local src_dir="$INSTALL_DIR/src"
  
  info "Cloning Spectre repository..."
  if [ "$SPECTRE_VERSION" = "latest" ]; then
    git clone --depth 1 "https://github.com/${SPECTRE_REPO}.git" "$src_dir"
  else
    git clone --depth 1 --branch "v${SPECTRE_VERSION}" "https://github.com/${SPECTRE_REPO}.git" "$src_dir"
  fi
  success "Cloned Spectre repository"
}

install_deps() {
  local src_dir="$INSTALL_DIR/src"
  cd "$src_dir"
  
  info "Installing dependencies..."
  npm install --ignore-scripts 2>&1 | tail -5
  success "Dependencies installed"
}

build() {
  local src_dir="$INSTALL_DIR/src"
  cd "$src_dir"
  
  info "Building Spectre..."
  npm run build 2>&1 | tail -3
  success "Build complete"
}

create_symlink() {
  local src_dir="$INSTALL_DIR/src"
  local bin_path="$src_dir/dist/index.js"
  
  if [ ! -f "$bin_path" ]; then
    error "Build output not found: $bin_path"
    exit 1
  fi

  chmod +x "$bin_path"

  mkdir -p "$BIN_DIR"

  if [ -L "$BIN_DIR/spectre" ] || [ -f "$BIN_DIR/spectre" ]; then
    rm -f "$BIN_DIR/spectre"
  fi

  ln -s "$bin_path" "$BIN_DIR/spectre"
  success "Created symlink: $BIN_DIR/spectre"

  if ! echo "$PATH" | grep -q "$BIN_DIR"; then
    warn "$BIN_DIR is not in your PATH"
    echo "  Add this to your shell config: export PATH=\"$BIN_DIR:\$PATH\""
  fi
}

setup_config_dir() {
  local config_dir="$HOME/.spectre/config"
  if [ ! -d "$config_dir" ]; then
    mkdir -p "$config_dir"
    chmod 700 "$HOME/.spectre"
    success "Created config directory: $HOME/.spectre"
  fi
}

show_success() {
  echo ""
  logo
  echo -e "${BOLD}Spectre installed successfully!${NC}"
  echo ""
  echo -e "${GREEN}Quick Start:${NC}"
  echo "  spectre              # Launch Spectre"
  echo "  spectre --version    # Show version"
  echo ""
  echo -e "${GREEN}First Time Setup:${NC}"
  echo "  Run 'spectre' and type '/setup' to configure your AI provider"
  echo ""
  echo -e "${GREEN}Update:${NC}"
  echo "  curl -fsSL https://raw.githubusercontent.com/${SPECTRE_REPO}/main/install.sh | bash"
  echo ""
  echo -e "${GREEN}Uninstall:${NC}"
  echo "  curl -fsSL https://raw.githubusercontent.com/${SPECTRE_REPO}/main/uninstall.sh | bash"
  echo ""
  echo -e "${CYAN}Built by Slashpan Technologies Private Limited${NC}"
  echo -e "${CYAN}https://github.com/${SPECTRE_REPO}${NC}"
  echo ""
}

# Main installation flow
main() {
  echo ""
  info "Installing Spectre..."
  echo ""
  
  check_node
  check_npm
  check_git
  check_build_tools
  create_install_dir
  clone_repo
  install_deps
  build
  create_symlink
  setup_config_dir
  show_success
}

main "$@"
