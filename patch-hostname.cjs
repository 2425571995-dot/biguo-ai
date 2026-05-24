const os = require('os')
const orig = os.hostname
os.hostname = function () {
  try {
    const h = orig.call(os)
    if (/[^\x00-\x7F]/.test(h)) return 'DESKTOP'
    return h
  } catch (e) {
    return 'DESKTOP'
  }
}
