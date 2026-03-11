const fs = require('fs');
const css = fs.readFileSync('app/globals.css', 'utf8');
if (css.includes('text-align: right')) console.log('FIX IS IN CSS');
if (css.includes('min-width: 28px')) console.log('MIN WIDTH IS 28');
