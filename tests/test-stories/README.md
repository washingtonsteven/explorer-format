# Test Stories

This is a collection of stories I manually test on. These aren't being used for automated tests yet (As of writing this, automated tests don't exist).

## Running Tests

### Using Tweego

1. Include the Explorer story format in a folder where tweego will look
    a. What may be easier is to set up a symlink in the `storyformats` dir where you installed tweego: `ln -s explorer-format/dist/format.js bin/tweego/storyformats/explorer-1/format.js`
2. Run `yarn build-basic` to build the basic story (tests/test-stories/basic.twee)
3. Run `npx serve tests/test-stories/output` to view the output in your browser.

### Using Twine

Haven't tried this, but you can probably point to `dist/format.js` in this repo when you go to `Twine > Story Format > Add`
