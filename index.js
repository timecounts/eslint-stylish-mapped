/**
 * @fileoverview Stylish reporter
 * @author Sindre Sorhus
 */
"use strict";

var chalk = require("chalk"),
  table = require("text-table");

var fs = require('fs');
var path = require('path');
var SourceMapConsumer = require('source-map').SourceMapConsumer;

// based on https://github.com/evanw/node-source-map-support
var cache = {};
function mapSourcePosition(position) {
  var base64 = false;
  var dataUrlPrefix = "data:application/json;base64,";
  var sourceMap = cache[position.source];
  if (!sourceMap && fs.existsSync(position.source)) {
    // Get the URL of the source map
    var fileData = fs.readFileSync(position.source, 'utf8');
    var match = /\/\/[#@]\s*sourceMappingURL=(.*)\s*$/m.exec(fileData);
    if (!match) {
      return position;
    }
    var sourceMappingURL = match[1];

    // Read the contents of the source map
    var sourceMapData;
    if (sourceMappingURL.slice(0, dataUrlPrefix.length).toLowerCase() === dataUrlPrefix) {
      // Support source map URL as a data url
      sourceMapData = new Buffer(sourceMappingURL.slice(dataUrlPrefix.length), "base64").toString();
      base64 = true;
    }
    else {
      // Support source map URLs relative to the source URL
      var dir = path.dirname(position.source);
      sourceMappingURL = path.resolve(dir, sourceMappingURL);

      if (fs.existsSync(sourceMappingURL)) {
        sourceMapData = fs.readFileSync(sourceMappingURL, 'utf8');
      }
    }
    sourceMap = {
      url: sourceMappingURL,
      base64: base64
    };
    if (sourceMapData) {
      sourceMap.map = new SourceMapConsumer(sourceMapData);
    }
    cache[position.source] = sourceMap;
  }

  // Resolve the source URL relative to the URL of the source map
  if (sourceMap && sourceMap.map) {
    var originalPosition = sourceMap.map.originalPositionFor(position);

    // Only return the original position if a matching line was found. If no
    // matching line is found then we return position instead, which will cause
    // the stack trace to print the path and line for the compiled file. It is
    // better to give a precise location in the compiled file than a vague
    // location in the original file.
    if (originalPosition.source !== null) {
      if (sourceMap.base64) {
        originalPosition.source = dataUrlPrefix + originalPosition.source;
      }
      else {
        originalPosition.source = path.resolve(path.dirname(sourceMap.url), originalPosition.source);
      }
      return originalPosition;
    }
  }

  return position;
}


//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Given a word and a count, append an s if count is not one.
 * @param {string} word A word in its singular form.
 * @param {int} count A number controlling whether word should be pluralized.
 * @returns {string} The original word with an s on the end if count is not one.
 */
function pluralize(word, count) {
  return (count === 1 ? word : word + "s");
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

module.exports = function(results) {

  var output = "\n",
    total = 0,
    errors = 0,
    warnings = 0,
    summaryColor = "yellow";

  results.forEach(function(result) {
    var messages = result.messages;

    if (messages.length === 0) {
      return;
    }

    total += messages.length;
    output += chalk.underline(result.filePath) + "\n";

    output += table(
      messages.map(function(message) {
        var messageType;

        if (message.fatal || message.severity === 2) {
          messageType = chalk.red("error");
          summaryColor = "red";
          errors++;
        } else {
          messageType = chalk.yellow("warning");
          warnings++;
        }

        return [
          "",
          message.line || 0,
          message.column || 0,
          messageType,
          message.message.replace(/\.$/, ""),
          chalk.gray(message.ruleId || "")
        ];
      }),
      {
        align: ["", "r", "l"],
        stringLength: function(str) {
          return chalk.stripColor(str).length;
        }
      }
    ).split("\n").map(function(el) {
      return el.replace(/(\d+)\s+(\d+)/, function(m, p1, p2) {
        return chalk.gray(p1 + ":" + p2);
      });
    }).join("\n") + "\n\n";
  });

  if (total > 0) {
    output += chalk[summaryColor].bold([
      "\u2716 ", total, pluralize(" problem", total),
      " (", errors, pluralize(" error", errors), ", ",
      warnings, pluralize(" warning", warnings), ")\n"
    ].join(""));
  }

  return total > 0 ? output : "";
};
