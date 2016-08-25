export default function() {
  return function(user, appendEmail, appendAccount) {
    let result = '';
    let emailAppended = false;

    if (typeof user === 'object' && user !== null) {
      if ('user_metadata' in user && ('family_name' in user.user_metadata || 'given_name' in user.user_metadata)) {
        result = user.user_metadata.given_name + ' ' + user.user_metadata.family_name;
      } else if ('given_name' in user || 'family_name' in user) {
        if ('given_name' in user) {
          result += user.given_name;
        }

        if ('family_name' in user) {
          result += ' ' + user.family_name;
        }
      } else if ('email' in user) {
        result = user.email;
        emailAppended = true;
      } else if ('name' in user) {
        result = user.name;
      }

      if (!emailAppended && appendEmail && 'email' in user) {
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