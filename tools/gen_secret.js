var crypto = require('crypto');

let size = 64;
if (process.argv.length == 3) {
    size = parseInt(process.argv[2]);
}

crypto.randomBytes(size, function (err, buf) {
    if (err) {
        console.error(err);
    } else {
        console.log(buf.toString('base64'));
    }
});
