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

function deleteUID(hex, start, end) {
  let range = findLastIndexOfPatternBetween(hex, start, end);
  if (!range) return hex;

  let bytesLength = range.endIndex - range.startIndex - start.length - end.length;
  let bytesHex = hex.slice(range.startIndex + start.length, range.endIndex - end.length);

  if (/^0+$/.test(bytesHex) || bytesLength < 7) {
    return null; // Deleted file or invalid
  }

  let replacement = start + '00' + end;
  return hex.slice(0, range.startIndex) + replacement + hex.slice(range.endIndex);
}

// नया Edit function जो Deleted UID हटाकर नया UID रिप्लेस करता है
function editUID(hex, start, end, newUIDHex) {
  let range = findLastIndexOfPatternBetween(hex, start, end);
  if (!range) return hex;

  let bytesHex = hex.slice(range.startIndex + start.length, range.endIndex - end.length);

  // यदि Deleted UID हो तो उसे हटा दो और नया UID स्थान पर डाल दो
  if (/^0+$/.test(bytesHex)) {
    // सीधे जगह लें start + newUIDHex + end
    let replacement = start + newUIDHex + end;
    return hex.slice(0, range.startIndex) + replacement + hex.slice(range.endIndex);
  } else {
    // अन्यथा पुराने replaceUID जैसा काम करें
    let lengthToReplace = range.endIndex - range.startIndex - start.length - end.length;

    if (newUIDHex.length < lengthToReplace) {
      newUIDHex = newUIDHex.padEnd(lengthToReplace, '0');
    } else if (newUIDHex.length > lengthToReplace) {
      newUIDHex = newUIDHex.slice(0, lengthToReplace);
    }

    let replacement = start + newUIDHex + end;
    return hex.slice(0, range.startIndex) + replacement + hex.slice(range.endIndex);
  }
}

function processFile(file, mode, newUID = null) {
  const reader = new FileReader();
  reader.onload = function (e) {
    let data = new Uint8Array(e.target.result);
    let hex = toHexString(data);

    if (mode === 'delete') {
      if (file.name.endsWith('.bytes')) {
        let newHex = deleteUID(hex, '0138', '42');
        if (newHex === null) {
          alert('UID already deleted.');
          return;
        }
        hex = newHex;
      } else if (file.name.endsWith('.meta')) {
        hex = deleteUID(hex, '03', 'A203');
      }
    } else if (mode === 'edit') {
      if (!newUID) return alert("कृपया नया UID दर्ज करें!");
      let uidBytes = encodeULEB128(BigInt(newUID));
      let uidHex = toHexString(uidBytes);
      if (file.name.endsWith('.bytes')) {
        hex = editUID(hex, '0138', '42', uidHex);
      } else if (file.name.endsWith('.meta')) {
        hex = replaceUID(hex, '03', 'A203', uidHex);
      }
    }

    const modified = fromHexString(hex);
    const blob = new Blob([modified], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
  };
  reader.readAsArrayBuffer(file);
}

document.getElementById('deleteForm').addEventListener('submit', e => {
  e.preventDefault();
  const file = document.getElementById('deleteFile').files[0];
  if (!file) return alert("कृपया फाइल अपलोड करें!");
  processFile(file, 'delete');
});

document.getElementById('editForm').addEventListener('submit', e => {
  e.preventDefault();
  const file = document.getElementById('editFile').files[0];
  const newUID = document.getElementById('newUID').value.trim();
  if (!file) return alert("कृपया फाइल अपलोड करें!");
  if (!newUID) return alert("कृपया नया UID डालें!");
  processFile(file, 'edit', newUID);
});

// UID डिस्प्ले वाले इवेंट लिसनर

document.getElementById('deleteFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) {
    document.getElementById('currentUIDDisplayDelete').textContent = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = function (ev) {
    const data = new Uint8Array(ev.target.result);
    const hex = toHexString(data);
    let uidHex = null;
    if (file.name.endsWith('.bytes')) {
      uidHex = extractUIDFromHex(hex, '0138', '42');
    } else if (file.name.endsWith('.meta')) {
      uidHex = extractUIDFromHex(hex, '03', 'A203');
    }
    if (uidHex) {
      const uid = hexToULEB128Number(uidHex);
      document.getElementById('currentUIDDisplayDelete').textContent = 'Current UID: ' + uid;
    } else {
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
    const data = new Uint8Array(ev.target.result);
    const hex = toHexString(data);
    let uidHex = null;
    if (file.name.endsWith('.bytes')) {
      uidHex = extractUIDFromHex(hex, '0138', '42');
    } else if (file.name.endsWith('.meta')) {
      uidHex = extractUIDFromHex(hex, '03', 'A203');
    }
    if (uidHex) {
      const uid = hexToULEB128Number(uidHex);
      document.getElementById('currentUIDDisplayEdit').textContent = 'Current UID: ' + uid;
    } else {
      document.getElementById('currentUIDDisplayEdit').textContent = 'UID not found in this file';
    }
  };
  reader.readAsArrayBuffer(file);
});
