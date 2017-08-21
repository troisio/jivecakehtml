export default function() {
  return function(date) {
    const string = date.toString();
    let result = '';

    if (string.endsWith(')')) {
      for (let index = string.length - 2; index > -1; index--) {
          const character = string[index];

          if (character === '(') {
              break;
          } else {
              result = character + result;
          }
      }

    }

    return result;
  };
}