# Setup Deno

GitHub Actions to set up Deno.

# Usage

Basic:

```yml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Deno
        uses: maximousblk/setup-deno@v1 # Installs latest version

      - run: deno -V
```

Matrix:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        deno: ['v1.5', 'v1.6', 'v1.7', 'v1', 'canary']
    steps:
      - uses: actions/checkout@v2

      - name: Setup Deno (${{ matrix.deno }})
        uses: maximousblk/setup-deno@v2
        with:
          version: ${{ matrix.deno }}

      - run: deno -V
```

## License

This project is licensed under [The MIT License](./LICENSE)
