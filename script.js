function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(page + 'Page').classList.add('active');
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

// नीचे से ऊपर खोज कर सबसे आखिरी मैच वाला UID निकालो
function findLastIndexOfPattern(hex, start, end) {
  let lastIndex = -1;
  let pattern = new RegExp(start + '([0-9A-F]{10})' + end, 'g');
  let match;
  while ((match = pattern.exec(hex)) !== null) {
    lastIndex = match.index;
  }
  return lastIndex;
}

// Delete function: पहले बाइट को '00' से रिप्लेस karo,  
// बाकी 4 बाइट्स (8 hex chars) पूरी तरह हटा दो (remove from hex string)
function deleteUID(hex, start, end) {
  let lastIndex = findLastIndexOfPattern(hex, start, end);
  if (lastIndex === -1) return hex; // pattern न मिले तो वैसा ही लौटाओ

  // pattern के शुरू और खत्म स्थान से substring निकालो
  const len = start.length + 10 + end.length; // total matched length
  let fullMatch = hex.substr(lastIndex, len);

  // fullMatch: start + 5 bytes (10 hex) + end

  // 5 bytes hex start at start.length, length 10
  // first byte लेना है '00' से, बाकी substring से हटा देंगे

  // define replacement: start + '00' + end (remove other bytes)
  // इसलिए hex string से पूरी 5 bytes में से पहला 2 hex char ‘00’, बाकी 8 hex char remove
  let replacement = start + '00' + end;

  // hex को दो भागों में तोड़ो - पहले lastIndex तक, फिर replacement, फिर बाकी
  return hex.slice(0, lastIndex) + replacement + hex.slice(lastIndex + len);
}

function replaceUID(hex, start, end, newUIDHex) {
  if (newUIDHex.length < 10) {
    newUIDHex = newUIDHex.padEnd(10, '0');
  } else if (newUIDHex.length > 10) {
    newUIDHex = newUIDHex.slice(0, 10);
  }
  let lastIndex = findLastIndexOfPattern(hex, start, end);
  if (lastIndex === -1) return hex;

  const len = start.length + 10 + end.length;
  let replacement = start + newUIDHex + end;
  return hex.slice(0, lastIndex) + replacement + hex.slice(lastIndex + len);
}

function processFile(file, mode, newUID = null) {
  const reader = new FileReader();
  reader.onload = function (e) {
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
