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
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
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
  let bytesHex = hex.slice(range.startIndex + start.length, range.endIndex - end.length);

  if (/^0+$/.test(bytesHex)) {
    return null; // UID already deleted
  }
  let replacement = start + '00'.padEnd(bytesHex.length, '0') + end;
  return hex.slice(0, range.startIndex) + replacement + hex.slice(range.endIndex);
}

function editUID(hex, start, end, newUIDHex) {
  let range = findLastIndexOfPatternBetween(hex, start, end);
  if (!range) return hex;
  let bytesHex = hex.slice(range.startIndex + start.length, range.endIndex - end.length);

  if (/^0+$/.test(bytesHex) || (bytesHex.length / 2) < 7) {
    let replacement = start + newUIDHex + end;
    return hex.slice(0, range.startIndex) + replacement + hex.slice(range.endIndex);
  } else {
    let lenToReplace = range.endIndex - range.startIndex - start.length - end.length;
    if (newUIDHex.length < lenToReplace) newUIDHex = newUIDHex.padEnd(lenToReplace, '0');
    else if (newUIDHex.length > lenToReplace) newUIDHex = newUIDHex.slice(0, lenToReplace);

    let replacement = start + newUIDHex + end;
    return hex.slice(0, range.startIndex) + replacement + hex.slice(range.endIndex);
  }
}

function processFile(file, mode, newUID = null) {
  const reader = new FileReader();
  reader.onload = function (e) {
    let data = new Uint8Array(e.target.result);
    let hex = toHexString(data);
    let newHex = null;
    let displayElem =
      mode === 'delete' ? document.getElementById('currentUIDDisplayDelete') : document.getElementById('currentUIDDisplayEdit');

    if (file.name.endsWith('.bytes')) {
      // .bytes फाइल के लिए पहले जैसा सिस्टम
      if (mode === 'delete') {
        newHex = deleteUID(hex, '0138', '42');
        if (newHex === null) {
          displayElem.textContent = 'UID already deleted.';
          return;
        }
        hex = newHex;
      } else if (mode === 'edit') {
        if (!newUID) return alert('कृपया नया UID दर्ज करें!');
        let uidBytes = encodeULEB128(BigInt(newUID));
        let uidHex = toHexString(uidBytes);

        hex = editUID(hex, '0138', '42', uidHex);
      }
    } else if (file.name.endsWith('.meta')) {
      // .meta फाइल के लिए अलग रेंज और लोजिक
      if (mode === 'delete') {
        newHex = deleteUID(hex, '03', 'A203');
        if (newHex === null) {
          displayElem.textContent = 'UID already deleted.';
          return;
        }
        hex = newHex;
      } else if (mode === 'edit') {
        if (!newUID) return alert('कृपया नया UID दर्ज करें!');
        let uidBytes = encodeULEB128(BigInt(newUID));
        let uidHex = toHexString(uidBytes);

        hex = editUID(hex, '03', 'A203', uidHex);
      }
    } else {
      displayElem.textContent = 'This file type not supported. Please upload only .bytes or .meta file.';
      return;
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

function displayCurrentUIDFromFile(file, displayElem, type) {
  const reader = new FileReader();
  reader.onload = function (ev) {
    let data = new Uint8Array(ev.target.result);
    let hex = toHexString(data);
    let uidHex;

    if (type === '.bytes') {
      uidHex = extractUIDFromHex(hex, '0138', '42');
    } else if (type === '.meta') {
      uidHex = extractUIDFromHex(hex, '03', 'A203');
    }

    if (uidHex) {
      let uid = hexToULEB128Number(uidHex);
      displayElem.textContent = 'Current UID: ' + uid;
    } else {
      displayElem.textContent = 'UID not found in this file';
    }
  };
  reader.readAsArrayBuffer(file);
}

document.getElementById('deleteForm').addEventListener('submit', e => {
  e.preventDefault();
  const file = document.getElementById('deleteFile').files[0];
  if (!file) return alert('कृपया फाइल अपलोड करें!');
  processFile(file, 'delete');
});

document.getElementById('editForm').addEventListener('submit', e => {
  e.preventDefault();
  const file = document.getElementById('editFile').files[0];
  const newUID = document.getElementById('newUID').value.trim();
  if (!file) return alert('कृपया फाइल अपलोड करें!');
  if (!newUID) return alert('कृपया नया UID डालें!');
  processFile(file, 'edit', newUID);
});

document.getElementById('deleteFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) {
    document.getElementById('currentUIDDisplayDelete').textContent = '';
    return;
  }
  if (!(file.name.endsWith('.bytes') || file.name.endsWith('.meta'))) {
    document.getElementById('currentUIDDisplayDelete').textContent = "This file type not supported, please upload only .bytes or .meta file";
    e.target.value = '';
    return;
  }
  displayCurrentUIDFromFile(file, document.getElementById('currentUIDDisplayDelete'), file.name.endsWith('.bytes') ? '.bytes' : '.meta');
});

document.getElementById('editFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) {
    document.getElementById('currentUIDDisplayEdit').textContent = '';
    return;
  }
  if (!(file.name.endsWith('.bytes') || file.name.endsWith('.meta'))) {
    document.getElementById('currentUIDDisplayEdit').textContent = "This file type not supported, please upload only .bytes or .meta file";
    e.target.value = '';
    return;
  }
  displayCurrentUIDFromFile(file, document.getElementById('currentUIDDisplayEdit'), file.name.endsWith('.bytes') ? '.bytes' : '.meta');
});
