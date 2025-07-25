const fs = require('fs');
const path = require('path');

// SVGファイルを読み込む
const svgPath = path.join(__dirname, '../public/GaijinHub-logo-icon.svg');
const outputPath = path.join(__dirname, '../app/apple-icon.png');

// Next.jsはapple-iconとしてSVGをサポートしているので、
// SVGファイルを直接コピーして拡張子を変更
const svgContent = fs.readFileSync(svgPath, 'utf8');

// apple-icon.svgとして保存
const svgOutputPath = path.join(__dirname, '../app/apple-icon.svg');
fs.writeFileSync(svgOutputPath, svgContent);

console.log('Created apple-icon.svg');

// PNGが必要な場合は、手動でSVGをPNGに変換する必要があります
console.log('Note: If PNG is required, please convert SVG to PNG manually or use a service like CloudConvert.');