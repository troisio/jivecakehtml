export default class TransactionLoader {
  constructor($window, itemService, transactionService, token, pageSize) {
    this.$window = $window;
    this.itemService = itemService;
    this.transactionService = transactionService;
    this.token = token;
    this.pageSize = pageSize;

    this.query = {};
    this.pages = [];
    this.loading = false;
  }

  getItemAtIndex(index) {
    const pageNumber = this.$window.Math.floor(index / this.pageSize);
    let page;

    if (pageNumber < this.pages.length) {
      page = this.pages[pageNumber][index % this.pageSize];
    } else {
      page = null;

      if (!this.loading) {
        this.loadPage(pageNumber);
      }
    }

    return page;
  }

  getLength() {
    return this.pages.reduce((previous, pages) => previous + pages.length, 0);
  }

  loadPage(page) {
    this.loading = true;

    const offset = page * this.pageSize;
    const query = {
      offset: offset,
      limit: this.pageSize
    };

    for (let key in this.query) {
      query[key] = this.query[key];
    }

    this.transactionService.getTransactionData(this.itemService, this.token, query).then((paging) => {
      this.pages[page] = paging.entity;
    }).finally(() => {
      this.loading = false;
    });
  }

  reset() {
    this.pages = [];
  }
}