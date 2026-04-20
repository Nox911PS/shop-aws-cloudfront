export interface IProduct {
  count: number;
  description: string;
  id: string;
  price: number;
  title: string;
}

export interface IProductsTableItem {
  id?: string;
  title: string;
  description: string;
  price: number;
}

export interface IStocksTableItem {
  product_id: string;
  count: number;
}
