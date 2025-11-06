// जावास्क्रिप्ट फंक्शंस

// URL कोड चक करने वाला
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(page + 'Page').classList.add('active');
}

// यूट्यूब चैनल लिंक खोलने का
function openChannel() {
  window.open('https://youtube.com/@ssfyt_777?si=9JBqTAd9bgnNvT8F', '_blank');
}

// encodeULEB128
function encodeULEB128(value) {
  let result = [];
  let more = true;
  while (more) {
    let byte = value & 0x7F;
    value >>>= 7;
    if (value !== 0) {
      byte |= 0x80;
    } else {
      more = false;
    }
    result.push(byte);
  }
  return new Uint8Array(result);
}

// decodeULEB128
function decodeULEB128(bytes) {
  let result = 0;
  let shift = 0;
  for (let byte of bytes) {
    result |= (byte & 0x7F) << shift;
    if ((byte & 0x80) == 0) break;
    shift += 7;
  }
  return result;
}

// ArrayBuffer से Hex में बदलना
function toHexString(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Hex से Byte Array में बदलना
function fromHexString(hex) {
  let arr = [];
  for (let i = 0; i < hex.length; i += 2) {
    arr.push(parseInt(hex.substr(i, 2), 16));
  }
  return new Uint8Array(arr);
}

// फाइल को process करना: delete या edit
function processFile(file, mode, newUID = null) {
  const reader = new FileReader();
  reader.onload = function(e) {
    let data = new Uint8Array(e.target.result);
    let hex = toHexString(data);

    // delete mode
    if (mode === 'delete') {
      if (file.name.endsWith('.bytes')) {
        hex = deleteUID(hex, '38', '42');
      } else if (file.name.endsWith('.meta')) {
        hex = deleteUID(hex, '03', 'A203');
      }
    }
    // edit mode
    else if (mode === 'edit') {
      if (!newUID) return alert("कृपया नया UID दर्ज करें!");
      let uidBytes = encodeULEB128(Number(newUID));
      let uidHex = toHexString(uidBytes);
      if (file.name.endsWith('.bytes')) {
        hex = replaceUID(hex, '38', '42', uidHex);
      } else if (file.name.endsWith('.meta')) {
        hex = replaceUID(hex, '03', 'A203', uidHex);
      }
    }

    // नए Hex को फिर से File में change करना
    const modified = fromHexString(hex);
    const blob = new Blob([modified], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
  };
  reader.readAsArrayBuffer(file);
}

// UID को delete करने का function
function deleteUID(hex, start, end) {
  const pattern = new RegExp(start + '([0-9A-F]{10})' + end, 'g');
  return hex.replace(pattern, start + '00'.repeat(5) + end);
}

// UID को replace करने का function
function replaceUID(hex, start, end, newUIDHex) {
  const pattern = new RegExp(start + '([0-9A-F]{10})' + end, 'g');
  return hex.replace(pattern, start + newUIDHex + end);
}

// UID delete form
document.getElementById('deleteForm').addEventListener('submit', e => {
  e.preventDefault();
  const file = document.getElementById('deleteFile').files[0];
  if (!file) return alert("कृपया फाइल अपलोड करें!");
  processFile(file, 'delete');
});

// UID edit form
document.getElementById('editForm').addEventListener('submit', e => {
  e.preventDefault();
  const file = document.getElementById('editFile').files[0];
  const newUID = document.getElementById('newUID').value;
  if (!file) return alert("कृपया फाइल अपलोड करें!");
  processFile(file, 'edit', newUID);
});
