import { Logger } from '@src/common/logger';

type Config = {
  charToCode: {
    [key: string]: number;
  };
  codeToChar: string[];
};
// Generate rotation delta
const delta = function (x, secret) {
  const chars = secret.split('');
  let value = 0;
  for (let i = 0; i < chars.length; i++) {
    const charVal = chars[i].charCodeAt();
    value += x + i * charVal;
  }
  return value;
};

// Rotate
const rotate = function (config, value, x, secret, revese) {
  const size = config.codeToChar.length;
  let d = delta(x, secret);
  value = config.charToCode[value];
  d %= size;
  if (revese) {
    value += size - d;
  } else {
    value += d;
  }
  value %= size;
  return config.codeToChar[value];
};

const twist = function (
  pattern: RegExp,
  value: string,
  secret: string,
  reverse: boolean,
) {
  let twistValue = '';
  let error;
  try {
    const config: Config = {
      charToCode: {},
      codeToChar: [],
    };
    for (let i = 32; i <= 382; i++) {
      const char = String.fromCharCode(i);
      if (pattern.test(char)) {
        config.charToCode[char] = config.codeToChar.length;
        config.codeToChar.push(char);
      }
    }
    const splitValue = value.split('');
    for (let j = value.length - 1; j >= 0; j--) {
      splitValue[j] = rotate(config, value[j], j + 1, secret, reverse);
    }
    twistValue = splitValue.join('');
  } catch (err) {
    Logger.error(err);
    error = err;
  }
  if (error) throw 'Message does not fit pattern';
  return twistValue;
};

export default {
  encrypt: twist,
  decrypt: function (pattern: RegExp, value: string, secret: string) {
    return twist(pattern, value, secret, true);
  },
};
