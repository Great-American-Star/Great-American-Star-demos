
<script>
(function () {
  // ---- CONFIG (swap these for the client's real values at handoff) ----
  var CONFIG = {
    CLOUDINARY_CLOUD:  "dtj97xszw",
    CLOUDINARY_PRESET: "great_american_star",   // unsigned
    CLOUDINARY_FOLDER: "star_posters",
    VERCEL_ENDPOINT:   "https://star-poster-shopify.vercel.app/api/create-cart",
    SHOPIFY_VARIANT_ID: "45385731014854"         // numeric variant ID
  };

  // ---- Small UI helper so the customer sees progress ----
  function showOverlay(msg) {
    var o = document.getElementById("__orderOverlay");
    if (!o) {
      o = document.createElement("div");
      o.id = "__orderOverlay";
      o.style.cssText =
        "position:fixed;inset:0;z-index:99999;background:rgba(0,0,20,0.82);" +
        "display:flex;align-items:center;justify-content:center;color:#fff;" +
        "font-family:Georgia,serif;font-size:20px;text-align:center;padding:24px;";
      document.body.appendChild(o);
    }
    o.innerHTML = '<div><div style="font-size:42px;margin-bottom:14px;">⭐</div>' +
      '<div>' + msg + '</div></div>';
    o.style.display = "flex";
  }
  function hideOverlay() {
    var o = document.getElementById("__orderOverlay");
    if (o) o.style.display = "none";
  }

  // ---- Generate the print PNG by reusing the existing canvas path ----
  // We temporarily replace downloadFile() so the generated blob is captured
  // instead of being downloaded to the customer's computer.
  function generatePosterBlob() {
    return new Promise(function (resolve, reject) {
      if (typeof generateDownload !== "function" || typeof downloadFile !== "function") {
        reject(new Error("Poster generator not found on page."));
        return;
      }
      var originalDownloadFile = window.downloadFile;
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        window.downloadFile = originalDownloadFile;
        reject(new Error("Timed out while generating the poster image."));
      }, 30000);

      // Intercept: capture the blob, don't download it.
      window.downloadFile = function (blob /*, filename */) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        window.downloadFile = originalDownloadFile; // restore
        if (blob && blob.size) resolve(blob);
        else reject(new Error("Empty poster image."));
      };

      try {
        // 'png' + scale 2 = 18x24 at 600 DPI "Order Ready" file.
        generateDownload("png", 2);
      } catch (e) {
        if (!done) {
          done = true;
          clearTimeout(timer);
          window.downloadFile = originalDownloadFile;
          reject(e);
        }
      }
    });
  }

  // ---- Upload the blob to Cloudinary (unsigned) ----
  function uploadToCloudinary(blob) {
    var url = "https://api.cloudinary.com/v1_1/" + CONFIG.CLOUDINARY_CLOUD + "/image/upload";
    var fd = new FormData();
    fd.append("file", blob, "poster.png");
    fd.append("upload_preset", CONFIG.CLOUDINARY_PRESET);
    if (CONFIG.CLOUDINARY_FOLDER) fd.append("folder", CONFIG.CLOUDINARY_FOLDER);

    return fetch(url, { method: "POST", body: fd })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || !data.secure_url) {
          throw new Error("Cloudinary upload failed: " +
            (data && data.error ? data.error.message : "no URL returned"));
        }
        return data.secure_url;
      });
  }

  // ---- Ask the Vercel backend to create the order, get a checkout URL ----
  function createCart(fileUrl) {
    return fetch(CONFIG.VERCEL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variantId: CONFIG.SHOPIFY_VARIANT_ID,
        fileUrl: fileUrl,
        fileName: "Great American Star Poster"
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || !data.checkoutUrl) {
          throw new Error("Order creation failed: " +
            (data && data.error ? data.error : "no checkout URL returned"));
        }
        return data.checkoutUrl;
      });
  }

  // ---- The button handler ----
  window.orderMyPoster = function () {
    showOverlay("Preparing your poster…");
    generatePosterBlob()
      .then(function (blob) {
        showOverlay("Uploading your design…");
        return uploadToCloudinary(blob);
      })
      .then(function (fileUrl) {
        showOverlay("Creating your order…");
        return createCart(fileUrl);
      })
      .then(function (checkoutUrl) {
        showOverlay("Redirecting to checkout…");
        window.location.href = checkoutUrl;
      })
      .catch(function (err) {
        hideOverlay();
        alert("Sorry, something went wrong placing your order:\n\n" +
          err.message + "\n\nPlease try again.");
      });
  };
})();
</script>

