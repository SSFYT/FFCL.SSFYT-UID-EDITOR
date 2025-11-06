function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(page + 'Page').classList.add('active');
}

function openChannel() {
  window.open('https://youtube.com/@ssfyt_777?si=9JBqTAd9bgnNvT8F', '_blank');
}

// Encode & Decode ULEB128 (BigInt support)
function encodeULEB128(value) {
  value = BigInt(value);
  const result = [];
  do {
    let byte = Number(value & 0x7Fn);   // lower 7 bits
    value >>= 7n;                       // right shift 7 bits
    if (value !== 0n) {
      byte |= 0x80;                    // set MSB if more bytes follow
    }
    result.push(byte);
  } while (value !== 0n);
  return new Uint8Array(result);
}

// Convert ArrayBuffer to hex string
function toHexString(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Convert hex string back to bytes
function fromHexString(hex) {
  let arr = [];
  for (let i = 0; i < hex.length; i += 2) {
    arr.push(parseInt(hex.substr(i, 2), 16));
  }
  return new Uint8Array(arr);
}

// Search and Replace UID in .bytes or .meta
function processFile(file, mode, newUID = null) {
  const reader = new FileReader();
  reader.onload = function(e) {
    let data = new Uint8Array(e.target.result);
    let hex = toHexString(data);

    if (mode === 'delete') {
      if (file.name.endsWith('.bytes')) {
        hex = deleteUID(hex, '38', '42');
      } else if (file.name.endsWith('.meta')) {
        hex = deleteUID(hex, '03', 'A203');
      }
    } 
    else if (mode === 'edit') {
      if (!newUID) return alert("Please enter new UID!");
      let uidBytes = encodeULEB128(BigInt(newUID));
      let uidHex = toHexString(uidBytes);
      if (file.name.endsWith('.bytes')) {
        hex = replaceUID(hex, '38', '42', uidHex);
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

// Delete UID logic
function deleteUID(hex, start, end) {
  const pattern = new RegExp(start + '([0-9A-F]{10})' + end, 'g');
  return hex.replace(pattern, start + '00'.repeat(5) + end);
}

// Replace UID logic
function replaceUID(hex, start, end, newUIDHex) {
  const pattern = new RegExp(start + '([0-9A-F]{10})' + end, 'g');
  return hex.replace(pattern, start + newUIDHex + end);
}

// Delete Form
document.getElementById('deleteForm').addEventListener('submit', e => {
  e.preventDefault();
  const file = document.getElementById('deleteFile').files[0];
  if (!file) return alert("Please upload a file!");
  processFile(file, 'delete');
});

// Edit Form
document.getElementById('editForm').addEventListener('submit', e => {
  e.preventDefault();
  const file = document.getElementById('editFile').files[0];
  const newUID = document.getElementById('newUID').value;
  if (!file) return alert("Please upload a file!");
  processFile(file, 'edit', newUID);
});
