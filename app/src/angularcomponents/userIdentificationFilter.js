export default function() {
  return function(user, appendEmail, appendAccount) {
    let result = '';
    let emailAppended = false;

    if (typeof user === 'object' && user !== null) {

      if ('user_metadata' in user && user.user_metadata !== null && typeof user.user_metadata !== 'undefined' && (user.user_metadata.family_name || user.user_metadata.given_name)) {
        result = user.user_metadata.given_name + ' ' + user.user_metadata.family_name;
      } else if (user.given_name || user.family_name) {
        if ('given_name' in user) {
          result += user.given_name;
        }

        if (user.family_name) {
          result += ' ' + user.family_name;
        }
      } else if (user.email) {
        result = user.email;
        emailAppended = true;
      } else if (user.name) {
        result = user.name;
      }

      if (!emailAppended && appendEmail && user.email) {
        if (result === '') {
          result = user.email;
        } else {
          result += ' (' + user.email + ')';
        }
      }
    }

    return result;
  };
}