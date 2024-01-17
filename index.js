const {generateFonts} = require("@momentum-ui/webfonts-generator");
const fs = require("fs");
const path = require("path");

/**
 * Asynchronously generates font files, CSS, and HTML based on SVG icons.
 *
 * @param {string} fontName - The name of the font.
 * @param {string} svgPattern - The pattern for SVG icons.
 * @param {string} outputDir - The output directory for generated files.
 * @param {Object} [options={}] - Additional options for font generation.
 * @returns {Promise<void>} A Promise that resolves when the files are generated.
 */
async function generateAndCreateFiles(fontName, svgPattern, outputDir, options = {}) {
  try {
    const result = await generateFonts(fontName, svgPattern, outputDir, options);

    // Generate CSS content
    let cssContent = generateCssContent(result);

    // Generate HTML content
    let htmlTags = generateHtmlTags(result);

    // Generate HTML text
    const htmlText = generateHtmlText(result, htmlTags);

    // Define file paths
    const cssFilePath = path.join(__dirname, `dist/${result.fontName}.css`);
    const htmlFilePath = path.join(__dirname, `dist/${result.fontName}.html`);

    // Write CSS file
    writeToFile(cssFilePath, cssContent, 'CSS');

    // Write HTML file
    writeToFile(htmlFilePath, htmlText, 'HTML');
  } catch (error) {
    console.error("Error generating fonts:", error);
  }
}

/**
 * Generates the CSS content for the font.
 *
 * @param {Object} result - The result object from font generation.
 * @returns {string} The CSS content.
 */
function generateCssContent(result) {
  let cssContent = `@font-face {
  font-family: "${result.fontName}";
  src: url("${result.fontName}.ttf") format("embedded-opentype"),
       url("${result.fontName}.woff2") format("woff2"),
       url("${result.fontName}.woff") format("woff");
}

.apr {
  font-family: ${result.fontName};
  speak: none;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  display: inline-block;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.apr:before {
  --webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}
`;

  for (const item in result.glyphsData) {
    const obj = result.glyphsData[item];
    const addIcon = `
.apr-${obj.name.split('$')[1]}:before {
    content: "\\${obj.codepointHexa}";
 }
`;
    cssContent += addIcon;
  }

  return cssContent;
}

/**
 * Generates HTML tags for each icon.
 *
 * @param {Object} result - The result object from font generation.
 * @returns {string} HTML tags for each icon.
 */
function generateHtmlTags(result) {
  let htmlTags = "";

  for (const item in result.glyphsData) {
    const obj = result.glyphsData[item];
    htmlTags += `<span><i class="apr apr-${obj.name.split('$')[1]}"></i></span>`;
  }

  return htmlTags;
}

/**
 * Generates the complete HTML text.
 *
 * @param {Object} result - The result object from font generation.
 * @param {string} htmlTags - HTML tags for each icon.
 * @returns {string} The complete HTML text.
 */
function generateHtmlText(result, htmlTags) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <link rel="stylesheet" href="${result.fontName}.css">
    <style>
        div {
            max-width: 600px;
            width: 100%;
            margin: auto;
        }
        
        span {
            display: inline-block; padding: 6px;
        }
    </style>
</head>
  <body>
    <div>
      ${htmlTags}
    </div>
  </body>
</html>
`;
}

/**
 * Writes content to a file and logs success or error message.
 *
 * @param {string} filePath - The path of the file to write.
 * @param {string} content - The content to write to the file.
 * @param {string} fileType - The type of the file (e.g., "CSS" or "HTML").
 */
function writeToFile(filePath, content, fileType) {
  fs.writeFile(filePath, content, (err) => {
    if (err) {
      console.error(`Error writing ${fileType} file:`, err);
    } else {
      console.log(`${fileType} file created at ${filePath}`);
    }
  });
}

generateAndCreateFiles("apricons", "icons/*.svg", "dist");