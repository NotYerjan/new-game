# New Game

Desktop game project built with Tauri, Vite, TypeScript, and Phaser.

## Stack

- Tauri 2
- Vite
- TypeScript
- Phaser 3
- Rust

## Prerequisites

You need these installed before running the project:

1. Node.js and npm
2. Rust via `rustup`
3. Tauri system dependencies for your OS

Important: this repo already includes the Tauri CLI as a local dev dependency in `package.json`, so you do not need to install Tauri globally.

## Install Node.js

Install a current LTS release of Node.js that includes npm.

Check your install:

```bash
node --version
npm --version
```

## Install Rust

### Linux / macOS

```bash
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

Restart your terminal after install, then verify:

```bash
rustc --version
cargo --version
```

### Windows

Install Rust with `rustup-init.exe` from `https://rustup.rs/`, then verify:

```powershell
rustc --version
cargo --version
```

## Install Tauri System Dependencies

Tauri uses the OS webview:

- Linux: WebKit via `webkit2gtk`
- macOS: WKWebView
- Windows: Microsoft Edge WebView2

### Linux

Install the required packages for your distro.

#### Debian / Ubuntu

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

#### Arch Linux

```bash
sudo pacman -Syu
sudo pacman -S --needed \
  webkit2gtk-4.1 \
  base-devel \
  curl \
  wget \
  file \
  openssl \
  appmenu-gtk-module \
  libappindicator-gtk3 \
  librsvg \
  xdotool
```

#### Fedora

```bash
sudo dnf check-update
sudo dnf install webkit2gtk4.1-devel \
  openssl-devel \
  curl \
  wget \
  file \
  libappindicator-gtk3-devel \
  librsvg2-devel \
  libxdo-devel
sudo dnf group install "c-development"
```

### macOS

For desktop development, install Xcode Command Line Tools:

```bash
xcode-select --install
```

If you plan to build for iOS too, install full Xcode and open it once to complete setup.

### Windows

Install these before running Tauri:

1. Microsoft C++ Build Tools
2. Microsoft Edge WebView2 Runtime

Notes:

- WebView2 is already installed on Windows 10 version 1803+ and on Windows 11 in most cases.
- If you plan to build MSI installers, Windows may also require the VBSCRIPT optional feature enabled.

## Project Setup

Clone the repo, then install frontend dependencies:

```bash
npm install
```

## Run In Development

Start the Tauri desktop app:

```bash
npm run tauri dev
```

This starts the Vite dev server and launches the desktop window through Tauri.

## Build

Build the frontend bundle:

```bash
npm run build
```

Build the desktop app bundle:

```bash
npm run tauri build
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- [Tauri VS Code extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## References

- Tauri prerequisites: https://v2.tauri.app/start/prerequisites/
- Tauri webview runtimes: https://v2.tauri.app/reference/webview-versions/
- Rust installation: https://doc.rust-lang.org/book/ch01-01-installation.html
