export default class TransactionLoader {
  constructor($window, itemService, transactionService, token, pageSize) {
    this.$window = $window;
    this.itemService = itemService;
    this.transactionService = transactionService;
    this.token = token;
    this.pageSize = pageSize;

    this.reset();
    this.loading = false;
  }

  getItemAtIndex(index) {
    const pageNumber = this.$window.Math.floor(index / this.pageSize);
    let page;

    if (index < this.count || this.count === 0) {
      if (pageNumber < this.pages.length) {
        page = this.pages[pageNumber][index % this.pageSize];
      } else {
        page = null;

        if (!this.loading) {
          this.loadPage(pageNumber);
        }
      }
    }

    return page;
  }

  getLength() {
    return this.count;
  }

  loadPage(page) {
    this.loading = true;

    const query = {
      offset: page * this.pageSize,
      limit: this.pageSize
    };

    for (let key in this.query) {
      query[key] = this.query[key];
    }

    return this.transactionService.getTransactionData(this.itemService, this.token, query).then((paging) => {
      this.pages[page] = paging.entity;
      this.count = paging.count;
    }).finally(() => {
      this.loading = false;
    });
  }

  reset() {
    this.pages = [];
    this.count = 0;
    this.query = {};
  }
}