function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(page + 'Page').classList.add('active');
}

function openChannel() {
  window.open('https://youtube.com/@ssfyt_777?si=9JBqTAd9bgnNvT8F', '_blank');
}

// Encode & Decode ULEB128 with BigInt
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

// नया deleteUID function - पहला बाइट '30', बाकी 4 बाइट्स '00' से भरें
function deleteUID(hex, start, end) {
  // regex से pattern खोजो: start + 5 बाइटs (10 hex chars) + end
  const pattern = new RegExp(start + '([0-9A-F]{10})' + end, 'g');
  // रिप्लेसमेंट: start + '30' + '00000000' + end (पहला बाइट 30, बाकी चार 00)
  return hex.replace(pattern, start + '3000000000' + end);
}

function replaceUID(hex, start, end, newUIDHex) {
  if (newUIDHex.length < 10) {
    newUIDHex = newUIDHex.padEnd(10, '0');
  } else if (newUIDHex.length > 10) {
    newUIDHex = newUIDHex.slice(0, 10);
  }
  const pattern = new RegExp(start + '([0-9A-F]{10})' + end, 'g');
  return hex.replace(pattern, start + newUIDHex + end);
}

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
    } else if (mode === 'edit') {
      if (!newUID) return alert("कृपया नया UID दर्ज करें!");
      let uidBytes = encodeULEB128(BigInt(newUID));
      let uidHex = toHexString(uidBytes);
      if (uidHex.length < 10) uidHex = uidHex.padEnd(10, '0');
      else if (uidHex.length > 10) uidHex = uidHex.slice(0, 10);

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
