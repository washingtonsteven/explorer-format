# Explorer Twine Format

I wanted to make a Twine story format for the idea of a story/game I had so here it is. I'm also learning how to make a Twine story format.

## Quick Start

Option 1 (Twine): View the [raw format.js file](https://raw.githubusercontent.com/washingtonsteven/explorer-format/main/dist/format.js), and copy the URL into `Twine > Story Format > Add`

Option 2 (CLI compilers like tweego): Download `format.js` from `dist` and place them in a proper directory (i.e. `storyformats` for [tweego](https://www.motoslave.net/tweego/docs/#getting-started-story-formats-search-directories)).

## Building the format

```shell
yarn build-format
```

This will:

1. Build the Typescript used to make up the format code (i.e. `/src/index.js`).
2. Inject that js into the HTML source (via handlebars: `/src/index.mustache`)
3. Inject that HTML into the `source` attribute in the format JSON and finally,
4. Write out that JSON (wrapped in a `window.storyFormat` JSON-P style call) to `dist/format.js`


