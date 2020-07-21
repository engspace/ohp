export default {
    dbHost: process.env.DB_HOST,
    dbPort: process.env.DB_PORT,
    dbUser: process.env.DB_USER,
    dbPass: process.env.DB_PASS,
    dbName: process.env.DB_NAME,
    dbFormat: process.env.DB_FORMAT,
    serverPort: process.env.SERVER_PORT,
    storePath: process.env.STORE_PATH,
    googleRecaptchaSecret: process.env.GOOGLE_RECAPTCHA_SECRET,
    googleSigninClientId: process.env.GOOGLE_SIGNIN_CLIENT_ID,
    jwtSecret: process.env.JWT_SECRET,
};
