# Development

## Building Rvx
```bash
# Install dependencies:
npm ci

# Build & watch for changes:
npm start

# Build for production:
npm run build
```

## Running Tests
Running tests requires rvx to be already built.
```bash
npm test
```

## Building the Documentation
Building the docs also requires python and [mkdocs-material](https://squidfunk.github.io/mkdocs-material/)
```bash
# Install requirements:
pip install mkdocs-material

# Build examples:
npm run build --prefix examples

# Build the documentation:
mkdocs build --site-dir docs_out
```
