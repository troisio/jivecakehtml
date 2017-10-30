import TransactionService from '../service/TransactionService';

const currencies = TransactionService.getSupportedCurrencies();
const idToCurrency = {};

for (let currency of currencies) {
  idToCurrency[currency.id] = currency;
}

export default function() {
  return function(id) {
    return id in idToCurrency ? idToCurrency[id].symbol : '';
  };
}