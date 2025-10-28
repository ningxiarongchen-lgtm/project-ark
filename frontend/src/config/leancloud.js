import AV from 'leancloud-storage';

const APP_ID = "NrY9RsVuJJHOChA7gAmlWXcS-gzGzoHsz";
const APP_KEY = "Zbb0UTjv4h5jKKTWfLmyWYYP";
const SERVER_URL = "https://nry9rsvu.lc-cn-n1-shared.com";

AV.init({
  appId: APP_ID,
  appKey: APP_KEY,
  serverURL: SERVER_URL
});

export default AV;

