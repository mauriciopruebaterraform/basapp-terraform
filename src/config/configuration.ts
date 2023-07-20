export default () => ({
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    from: process.env.SENDGRID_FROM || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'secret',
    expiration: process.env.JWT_EXPIRATION || '10y',
  },
  password: {
    // in seconds
    resetExpiration: process.env.PASSWORD_RESET_EXPIRATION
      ? parseInt(process.env.PASSWORD_RESET_EXPIRATION)
      : 86400,
  },
  googleGeocoding: {
    url: 'https://maps.googleapis.com/maps/api/geocode/json',
    key: process.env.GOOGLE_GEOCODING_API_KEY,
  },
  s3: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    bucket: process.env.S3_BUCKET || '',
  },
  port: process.env.PORT || 3000,
  expoToken: process.env.EXPO_ACCESS_TOKEN,
  sms: {
    cryptKey: process.env.CRYPT_KEY || '',
    smsMasivos: {
      endpoint: process.env.MASIVO_ENDPOINT || '',
      user: process.env.MASIVO_USER || '',
      password: process.env.MASIVO_PASSWORD || '',
      keyword: process.env.MASIVO_KEYWORD || 'c5f',
    },
    aws: {
      description: 'SMS by AWS, using AWS SNS service',
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
      topicArn: '',
    },
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  },
  csvDelimiter: ';',
  uuids: {
    EMITIDO: process.env.EMITIDO_ID || '',
    ATENDIDO: process.env.ATENDIDO_ID || '',
    ALERTA_EMITIDA_ID: process.env.ALERTA_EMITIDA_ID || '',
    ALERTA_VECINAL_ID: process.env.ALERTA_VECINAL_ID || '',
  },
});
