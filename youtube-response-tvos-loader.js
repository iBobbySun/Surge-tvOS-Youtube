// YouTube Enhance tvOS compatibility loader for Surge
// Loads the upstream response.js and provides TextEncoder/TextDecoder polyfills
// for Surge tvOS, where only the JavaScriptCore engine is available.

(() => {
  function Utf8TextEncoder() {}
  Utf8TextEncoder.prototype.encode = function (input) {
    input = String(input);
    const out = [];
    for (let i = 0; i < input.length; i++) {
      let cp = input.charCodeAt(i);
      if (cp >= 0xD800 && cp <= 0xDBFF) {
        if (i + 1 < input.length) {
          const lo = input.charCodeAt(i + 1);
          if (lo >= 0xDC00 && lo <= 0xDFFF) {
            cp = 0x10000 + ((cp - 0xD800) << 10) + (lo - 0xDC00);
            i++;
          } else cp = 0xFFFD;
        } else cp = 0xFFFD;
      } else if (cp >= 0xDC00 && cp <= 0xDFFF) {
        cp = 0xFFFD;
      }

      if (cp <= 0x7F) out.push(cp);
      else if (cp <= 0x7FF) {
        out.push(0xC0 | (cp >> 6), 0x80 | (cp & 0x3F));
      } else if (cp <= 0xFFFF) {
        out.push(0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F));
      } else {
        out.push(
          0xF0 | (cp >> 18),
          0x80 | ((cp >> 12) & 0x3F),
          0x80 | ((cp >> 6) & 0x3F),
          0x80 | (cp & 0x3F)
        );
      }
    }
    return new Uint8Array(out);
  };

  function Utf8TextDecoder(label, options) {
    this.fatal = !!(options && options.fatal);
  }
  Utf8TextDecoder.prototype.decode = function (bytes) {
    if (bytes == null) return "";
    if (!(bytes instanceof Uint8Array))
      bytes = new Uint8Array(bytes.buffer || bytes, bytes.byteOffset || 0, bytes.byteLength);

    let out = "";
    for (let i = 0; i < bytes.length;) {
      const b0 = bytes[i++];
      let cp, need, min;

      if (b0 <= 0x7F) {
        cp = b0; need = 0; min = 0;
      } else if (b0 >= 0xC2 && b0 <= 0xDF) {
        cp = b0 & 0x1F; need = 1; min = 0x80;
      } else if (b0 >= 0xE0 && b0 <= 0xEF) {
        cp = b0 & 0x0F; need = 2; min = 0x800;
      } else if (b0 >= 0xF0 && b0 <= 0xF4) {
        cp = b0 & 0x07; need = 3; min = 0x10000;
      } else {
        if (this.fatal) throw new TypeError("Invalid UTF-8");
        out += "\uFFFD";
        continue;
      }

      if (i + need > bytes.length) {
        if (this.fatal) throw new TypeError("Truncated UTF-8");
        out += "\uFFFD";
        break;
      }

      let valid = true;
      for (let j = 0; j < need; j++) {
        const bx = bytes[i + j];
        if ((bx & 0xC0) !== 0x80) { valid = false; break; }
        cp = (cp << 6) | (bx & 0x3F);
      }
      if (!valid || cp < min || cp > 0x10FFFF || (cp >= 0xD800 && cp <= 0xDFFF)) {
        if (this.fatal) throw new TypeError("Invalid UTF-8");
        out += "\uFFFD";
        continue;
      }
      i += need;

      if (cp <= 0xFFFF) out += String.fromCharCode(cp);
      else {
        cp -= 0x10000;
        out += String.fromCharCode(0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF));
      }
    }
    return out;
  };

  // Install only when JSC doesn't provide them.
  if (typeof TextEncoder === "undefined") globalThis.TextEncoder = Utf8TextEncoder;
  if (typeof TextDecoder === "undefined") globalThis.TextDecoder = Utf8TextDecoder;

  const upstream =
    "https://raw.githubusercontent.com/gholts/surge/main/scripts/youtube/response.js";

  $httpClient.get(upstream, (error, response, body) => {
    if (error || !body) {
      console.log("[YouTube Enhance tvOS] Failed to load upstream response.js: " + String(error));
      $done({});
      return;
    }
    try {
      // Execute the upstream script with the polyfills available globally.
      (0, eval)(body);
    } catch (e) {
      console.log("[YouTube Enhance tvOS] Upstream execution failed: " + String(e));
      $done({});
    }
  });
})();
