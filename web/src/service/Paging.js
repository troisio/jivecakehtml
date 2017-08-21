import Page from '../class/Page';

export default class Paging {
  constructor(getTotal, getData) {
    this.getTotal = getTotal;
    this.getData = getData;
  }

  getPaging(page, pageSize) {
    return this.getData(pageSize, page * pageSize).then((data) => {
      return this.getTotal(data, page, pageSize).then((total) => {
        const result = new Page();

        result.data = data;
        result.total = total;
        result.pageCount = Math.ceil(total / pageSize);
        result.page = page;
        result.pageSize = pageSize;

        return result;
      });
    });
  }
}

Paging.$inject = [];