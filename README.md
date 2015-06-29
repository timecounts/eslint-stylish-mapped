ESLint Stylish Mapped Formatter
===============================

This module is a hybrid between Sindre Sorhus' stylish formatter for
ESLint and Bart van der Schoor's eslint-path-formatter to give you
stylishly formatted and source-mapped eslint results.


Usage:
------

Install with:

`npm install eslint-stylish-mapped`

Then add it to ESLint via the formatter option, e.g. for grunt:

```js
grunt.initConfig({
    // when using eslint-grunt:
    eslint: {
        options: {
            formatter: require('eslint-stylish-mapped')
        }),
        source: {
            //..
        }
    },
    // when using grunt-eslint:
    eslint: {
        options: {
            format: require('eslint-stylish-mapped')
        }),
        source: {
            //..
        }
    }
});
```
