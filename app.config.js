export default {
  expo: {
    // ... otras configuraciones ...
    extra: {
      adobeClientId: process.env.ADOBE_CLIENT_ID,
      adobeClientSecret: process.env.ADOBE_CLIENT_SECRET,
    },
    "android": {
    "package": "com.skynnz.docscanner"
  }
  }
};
