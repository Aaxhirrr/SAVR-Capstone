{
  description = "Expo / React Native development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";

      pkgs = import nixpkgs {
        inherit system;

        config = {
          allowUnfree = true;
          android_sdk.accept_license = true;
        };
      };

      androidComposition = pkgs.androidenv.composeAndroidPackages {
        platformVersions = [ "35" ];

        buildToolsVersions = [ "35.0.0" ];

        includeEmulator = true;

        systemImageTypes = [ "google_apis" ];
        abiVersions = [ "x86_64" ];

        includeNDK = true;
      };

      androidSdk = androidComposition.androidsdk;
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = with pkgs; [
          # JavaScript / TypeScript
          nodejs_24

          # Java / Android
          jdk17
          androidSdk

          # Useful tooling
          git
          watchman

          # Native build tools
          gcc
          gnumake
          cmake
          ninja
          pkg-config
        ];

        ANDROID_HOME = "${androidSdk}/libexec/android-sdk";
        ANDROID_SDK_ROOT = "${androidSdk}/libexec/android-sdk";

        JAVA_HOME = "${pkgs.jdk17}";

        shellHook = ''
          export PATH="$ANDROID_HOME/platform-tools:$PATH"
          export PATH="$ANDROID_HOME/emulator:$PATH"

          echo
          echo "Expo / React Native development environment"
          echo "Node:    $(node --version)"
          echo "npm:     $(npm --version)"
          echo "Java:    $(java -version 2>&1 | head -n 1)"
          echo "Android: $ANDROID_HOME"
          echo
        '';
      };
    };
}

