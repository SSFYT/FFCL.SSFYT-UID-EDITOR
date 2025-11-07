function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(page + 'Page').classList.add('active');
  document.getElementById('currentUIDDisplayDelete').textContent = '';
  document.getElementById('currentUIDDisplayEdit').textContent = '';
}

function openChannel() {
  window.open('https://youtube.com/@ssfyt_777?si=9JBqTAd9bgnNvT8F', '_blank');
}

function encodeULEB128(value) {
  value = BigInt(value);
  const result = [];
  do {
    let byte = Number(value & 0x7Fn);
    value >>= 7n;
    if (value !== 0n) {
      byte |= 0x80;
    }
    result.push(byte);
  } while (value !== 0n);
  return new Uint8Array(result);
}

function toHexString(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function fromHexString(hex) {
  let arr = [];
  for (let i = 0; i < hex.length; i += 2) {
    arr.push(parseInt(hex.substr(i, 2), 16));
  }
  return new Uint8Array(arr);
}

function findLastIndexOfPatternBetween(hex, start, end) {
  let lastStartIndex = -1;
  let startPattern = new RegExp(start, 'g');
  let match;
  while ((match = startPattern.exec(hex)) !== null) {
    lastStartIndex = match.index;
  }
  if (lastStartIndex === -1) return null;
  let endIndex = hex.indexOf(end, lastStartIndex + start.length);
  if (endIndex === -1) return null;
  return { startIndex: lastStartIndex, endIndex: endIndex + end.length };
}

function extractUIDFromHex(hex, start, end) {
  let range = findLastIndexOfPatternBetween(hex, start, end);
  if (!range) return null;
  let bytesHex = hex.slice(range.startIndex + start.length, range.endIndex - end.length);
  if (!bytesHex) return null;
  // Deleted UID or empty UID ignore
  if (/^0+$/.test(bytesHex)) return null;
  return bytesHex;
}

function hexToULEB128Number(hexUID) {
  const bytes = fromHexString(hexUID);
  let result = 0n;
  let shift = 0n;
  for (let byte of bytes) {
    result |= BigInt(byte & 0x7F) << shift;
    if ((byte & 0x80) === 0) break;
    shift += 7n;
  }
  return result.toString();
}

document.getElementById('deleteFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) {
    document.getElementById('currentUIDDisplayDelete').textContent = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = function (ev) {
    let data = new Uint8Array(ev.target.result);
    let hex = toHexString(data);
    let uidHex = null;
    if (file.name.endsWith('.bytes')) {
      uidHex = extractUIDFromHex(hex, '0138', '42');
    } else if (file.name.endsWith('.meta')) {
      uidHex = extractUIDFromHex(hex, '03', 'A203');
    }
    if (uidHex) {
      let uid = hexToULEB128Number(uidHex);
      document.getElementById('currentUIDDisplayDelete').textContent = 'Current UID: ' + uid;
    } else {
      // यहाँ uidHex null है, तो ये दिखाओ
      document.getElementById('currentUIDDisplayDelete').textContent = 'UID not found in this file';
    }
  };
  reader.readAsArrayBuffer(file);
});

document.getElementById('editFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) {
    document.getElementById('currentUIDDisplayEdit').textContent = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = function (ev) {
    let data = new Uint8Array(ev.target.result);
    let hex = toHexString(data);
    let uidHex = null;
    if (file.name.endsWith('.bytes')) {
      uidHex = extractUIDFromHex(hex, '0138', '42');
    } else if (file.name.endsWith('.meta')) {
      uidHex = extractUIDFromHex(hex, '03', 'A203');
    }
    if (uidHex) {
      let uid = hexToULEB128Number(uidHex);
      document.getElementById('currentUIDDisplayEdit').textContent = 'Current UID: ' + uid;
    } else {
      document.getElementById('currentUIDDisplayEdit').textContent = 'UID not found in this file';
    }
  };
  reader.readAsArrayBuffer(file);
});
