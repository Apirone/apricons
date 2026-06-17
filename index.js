import { SVGIcons2SVGFontStream } from 'svgicons2svgfont';
import { createReadStream, existsSync, mkdirSync, writeFile } from 'node:fs';
import { writeFile as writeFileAsync } from 'node:fs/promises';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';
import svg2ttf from 'svg2ttf';
import wawoff2 from 'wawoff2';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CODEPOINT_START = 0xEA01;

/**
 * Converts a set of SVG icon files into a WOFF2 font + CSS + HTML preview.
 *
 * @param {string} fontName
 * @param {string} svgPattern - glob pattern relative to cwd, e.g. "icons/*.svg"
 * @param {string} outputDir  - output directory relative to project root
 */
async function generateAndCreateFiles(fontName, svgPattern, outputDir) {
  try {
    const outDir = join(__dirname, outputDir);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    const files = globSync(svgPattern).sort((a, b) => {
      return parseInt(basename(a)) - parseInt(basename(b));
    });

    if (files.length === 0) {
      console.error(`No SVG files found for pattern: ${svgPattern}`);
      return;
    }

    const { svgFont, glyphsData } = await buildSvgFont(fontName, files);

    const ttf = svg2ttf(svgFont).buffer;
    const woff2 = await wawoff2.compress(Buffer.from(ttf));

    await Promise.all([
      writeFileAsync(join(outDir, `${fontName}.svg`), svgFont),
      writeFileAsync(join(outDir, `${fontName}.ttf`), Buffer.from(ttf)),
      writeFileAsync(join(outDir, `${fontName}.woff2`), woff2),
    ]);

    const result = { fontName, glyphsData };
    const cssContent = generateCssContent(result);
    const htmlTags = generateHtmlTags(result);
    const htmlText = generateHtmlText(result, htmlTags);

    writeToFile(join(outDir, `${fontName}.css`), cssContent, 'CSS');
    writeToFile(join(outDir, `${fontName}.html`), htmlText, 'HTML');
  } catch (error) {
    console.error('Error generating fonts:', error);
  }
}

/**
 * Builds an SVG font from individual icon files using SVGIcons2SVGFontStream.
 * Returns the SVG font string and a glyphsData map keyed by icon name.
 *
 * @param {string} fontName
 * @param {string[]} files - sorted list of SVG file paths
 * @returns {Promise<{ svgFont: string, glyphsData: Record<string, { name: string, codepointHexa: string }> }>}
 */
function buildSvgFont(fontName, files) {
  return new Promise((resolve, reject) => {
    let svgFont = '';
    const glyphsData = {};
    let codepoint = CODEPOINT_START;

    const stream = new SVGIcons2SVGFontStream({
      fontName,
      normalize: true,
      fontHeight: 1000,
      log: () => {},
    });

    stream.on('data', (chunk) => { svgFont += chunk.toString(); });
    stream.on('end', () => resolve({ svgFont, glyphsData }));
    stream.on('error', reject);

    for (const file of files) {
      const name = basename(file, '.svg');
      const codepointHexa = codepoint.toString(16).toUpperCase();

      glyphsData[name] = { name, codepointHexa };

      const glyph = createReadStream(file);
      glyph.metadata = { name, unicode: [String.fromCodePoint(codepoint)] };
      stream.write(glyph);

      codepoint++;
    }

    stream.end();
  });
}

/**
 * Generates CSS content: @font-face declaration, base class, animations,
 * and per-icon :before pseudo-element rules.
 */
function generateCssContent(result) {
  let cssContent = `@font-face {
  font-family: "${result.fontName}";
  src: url("./${result.fontName}.woff2") format("woff2");
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
  let htmlTags = '';
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
  writeFile(filePath, content, (err) => {
    if (err) {
      console.error(`Error writing ${fileType} file:`, err);
    } else {
      console.log(`${fileType} file created at ${filePath}`);
    }
  });
}

generateAndCreateFiles('apricons', 'icons/*.svg', 'dist');
