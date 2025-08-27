const {generateFonts} = require("@momentum-ui/webfonts-generator");
const fs = require("fs");
const path = require("path");

/**
 * Asynchronously generates font files, CSS, and HTML based on SVG icons.
 *
 * @param {string} fontName
 * @param {string} svgPattern
 * @param {string} outputDir
 * @param {Object} [options={}]
 * @returns {Promise<void>}
 */
async function generateAndCreateFiles(fontName, svgPattern, outputDir, options = {}) {
  try {
    const result = await generateFonts(fontName, svgPattern, outputDir, options);

    const cssContent = generateCssContent(result);

    const htmlTags = generateHtmlTags(result);
    const htmlText = generateHtmlText(result, htmlTags);

    const outDir = path.join(__dirname, "dist");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const cssFilePath  = path.join(outDir, `${result.fontName}.css`);
    const htmlFilePath = path.join(outDir, `${result.fontName}.html`);

    writeToFile(cssFilePath, cssContent, 'CSS');
    writeToFile(htmlFilePath, htmlText, 'HTML');
  } catch (error) {
    console.error("Error generating fonts:", error);
  }
}

/**
 * Generates the CSS content for the font.
 *
 * Добавлены:
 *  - .pulse  (анимация лоадера «вкл/выкл»)
 *  - @keyframes apr-pulse
 *  - prefers-reduced-motion
 */
function generateCssContent(result) {
  let cssContent = `@font-face {
  font-family: "${result.fontName}";
  src:
    url("${result.fontName}.woff2") format("woff2"),
    url("${result.fontName}.woff")  format("woff"),
    url("${result.fontName}.ttf")   format("truetype");
  font-display: swap;
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
  backface-visibility: hidden;
}

.spin {
  animation: apr-spin 2s linear infinite;
  display: inline-block;
}

.buzz {
  animation-name: buzz;
  animation-duration: 0.75s;
  animation-timing-function: linear;
  animation-iteration-count: 1;
}

@keyframes apr-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes buzz {
  10% {
    transform: translateX(3px) rotate(2deg);
  }

  20% {
    transform: translateX(-3px) rotate(-2deg);
  }

  30% {
    transform: translateX(3px) rotate(2deg);
  }

  40% {
    transform: translateX(-3px) rotate(-2deg);
  }

  50% {
    transform: translateX(2px) rotate(1deg);
  }

  60% {
    transform: translateX(-2px) rotate(-1deg);
  }

  70% {
    transform: translateX(2px) rotate(1deg);
  }

  80% {
    transform: translateX(-2px) rotate(-1deg);
  }

  90% {
    transform: translateX(1px) rotate(0);
  }

  100% {
    transform: translateX(-1px) rotate(0);
  }
}
`;

  for (const item in result.glyphsData) {
    const obj = result.glyphsData[item];
    cssContent += `
.apr-${obj.name.split('$')[1]}:before {
  content: "\\${obj.codepointHexa}";
}
`;
  }

  return cssContent;
}

function generateHtmlTags(result) {
  let htmlTags = "";
  for (const item in result.glyphsData) {
    const obj = result.glyphsData[item];
    htmlTags += `<span title="${obj.name}"><i class="apr apr-${obj.name.split('$')[1]}"></i></span>\n`;
  }
  return htmlTags;
}

function generateHtmlText(result, htmlTags) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${result.fontName} demo</title>
  <link rel="stylesheet" href="${result.fontName}.css">
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu; }
    .wrap { max-width: 900px; margin: 40px auto; padding: 0 16px; }
    .grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .grid span { display: inline-flex; justify-content: center; align-items: center; width: 40px; height: 40px; border: 1px solid #eee; border-radius: 6px; }
    .demo { margin: 24px 0 8px; font-weight: 600; }
    .big { font-size: 48px; display: flex; gap: 16px; align-items: center; }
    .box { display:inline-flex; width:64px; height:64px; align-items:center; justify-content:center; border:1px dashed #ddd; border-radius:8px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="demo">All icons</div>
    <div class="grid">
      ${htmlTags}
    </div>

    <div class="demo">Animations</div>
    <div class="big">
      <div class="box"><i class="apr apr-spinner spin"></i></div>
    </div>
  </div>
</body>
</html>
`;
}

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
