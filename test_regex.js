const html = `
.set('tooltips', [
    "<b>NA-134</b><br /><a href=\\"https://www.dx-world.net/ox3lx-greenland/\\" target=\\"_blank\\">Read more</a><br /><br />",
    "<b>MARTINIQUE</b><br /><a href=\\"https://www.dx-world.net/to3e-martinique/\\" target=\\"_blank\\">Read more</a><br /><br />",
])
`;
const tooltipsMatch = html.match(/\.set\('tooltips',\s*\[([\s\S]*?)\]\)/);
if (tooltipsMatch) {
    const rawTooltips = Array.from(tooltipsMatch[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)).map(m => m[1]);
    console.log(rawTooltips);
    rawTooltips.forEach(tt => {
        const urlMatch = tt.match(/href=\\?["'](.*?)\\?["']/i);
        console.log(urlMatch ? urlMatch[1] : "NO URL");
    });
}
