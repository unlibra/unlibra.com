// Restore text and mailto links without inserting HTML or making a request.
(() => {
  const decode = (encoded) => {
    const bytes = encoded.match(/../g).map((byte) => parseInt(byte, 16));
    const key = bytes.shift();
    return new TextDecoder().decode(
      Uint8Array.from(bytes, (byte) => byte ^ key),
    );
  };
  for (const element of document.querySelectorAll("[data-email-text]")) {
    element.textContent = decode(element.dataset.emailText);
    // Keep textContent usable by the donation copy button too.
    if (element.nextElementSibling?.tagName === "NOSCRIPT") {
      element.nextElementSibling.remove();
    }
    element.removeAttribute("data-email-text");
  }
  for (const element of document.querySelectorAll("[data-email-href]")) {
    element.setAttribute("href", decode(element.dataset.emailHref));
    element.removeAttribute("data-email-href");
  }
})();
