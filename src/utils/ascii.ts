export function normalize(str: string) {
  if (!str) {
    return '';
  }

  const from = 'ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâªèéëêìíïîòóöôºùúüûÑñÇç';
  const to = 'AAAAAEEEEIIIIOOOOUUUUaaaaaaeeeeiiiiooooouuuunnCc';
  const mapping = {};

  for (let i = 0, j = from.length; i < j; i++) {
    mapping[from.charAt(i)] = to.charAt(i);
  }

  const ret: string[] = [];

  for (let i = 0, j = str.length; i < j; i++) {
    const c = str.charAt(i);

    if (mapping.hasOwnProperty(str.charAt(i))) {
      ret.push(mapping[c]);
    } else if (str.charCodeAt(i) > 127) {
      ret.push('?');
    } else {
      ret.push(c);
    }
  }

  return ret.join('');
}
