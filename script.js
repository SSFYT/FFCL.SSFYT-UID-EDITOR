function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(page + 'Page').classList.add('active');
  // क्लियर UID डिस्प्ले जब पेज बदले
  document.getElementById('currentUIDDisplayDelete').textContent = '';
  document.getElementById('currentUIDDisplayEdit').textContent = '';
}

function openChannel() {
  window.open('https://youtube.com/@ssfyt_777?si=9JBqTAd9bgnNvT8F', '_blank');
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

function findLastIndexOfPattern(hex, start, end) {
  let lastIndex = -1;
  let pattern = new RegExp(start + '([0-9A-F]{10})' + end, 'g');
  let match;
  while ((match = pattern.exec(hex)) !== null) {
    lastIndex = match.index;
  }
  return lastIndex;
}

function extractUIDFromHex(hex, start, end) {
  let lastIndex = findLastIndexOfPattern(hex, start, end);
  if (lastIndex === -1) return null;
  return hex.substr(lastIndex + start.length, 10);
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

// अपलोड फाइल से UID निकाल के दिखाओ - Delete फॉर्म
document.getElementById('deleteFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    let data = new Uint8Array(ev.target.result);
    let hex = toHexString(data);
    let uidHex = null;
    if (file.name.endsWith('.bytes')) {
      uidHex = extractUIDFromHex(hex, '38', '42');
    } else if (file.name.endsWith('.meta')) {
      uidHex = extractUIDFromHex(hex, '03', 'A203');
    }
    if (uidHex) {
      let uid = hexToULEB128Number(uidHex);
      document.getElementById('currentUIDDisplayDelete').textContent = 'Current UID: ' + uid;
    } else {
      document.getElementById('currentUIDDisplayDelete').textContent = 'UID not found in this file';
    }
  };
  reader.readAsArrayBuffer(file);
});

// अपलोड फाइल से UID निकाल के दिखाओ - Edit फॉर्म
document.getElementById('editFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    let data = new Uint8Array(ev.target.result);
    let hex = toHexString(data);
    let uidHex = null;
    if (file.name.endsWith('.bytes')) {
      uidHex = extractUIDFromHex(hex, '38', '42');
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
