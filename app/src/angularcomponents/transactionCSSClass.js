export default function() {
  return function(transaction) {
    let result = '';

    if (transaction.status === 1 || transaction.status === 6 || transaction.status === 8 || transaction.status === 7) {
      result = 'payment-pending';
    } else if (transaction.status === 2 || transaction.status === 3 || transaction.status === 5) {
      result = 'payment-bad';
    } else if (transaction.status === 5 || transaction.status === 4) {
      result = 'payment-refund';
    } else if (transaction.status === 0) {
      result = 'payment-complete';
    }

    return result;
  };
}