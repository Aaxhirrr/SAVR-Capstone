import api from './api';

export interface FlyerDeal {
  id: string;
  store_brand: string;
  store_zone: string;
  product_name: string;
  brand: string | null;
  price: string;
  price_float: number | null;
  image_url: string | null;
  valid_from: string;
  valid_to: string;
  sale_story: string | null;
  pre_price_text: string | null;
  post_price_text: string | null;
  original_price: number | null;
}

export interface FlyerDealPage {
  deals: FlyerDeal[];
  total: number;
  page: number;
  page_size: number;
}

export interface FlyerParams {
  store_brand: string;
  search?: string;
  sort_by?: string;
  sort_dir?: string;
  page?: number;
  page_size?: number;
}

export interface FlyerAddToListParams {
  item_names: string[];
  list_id?: string;
  new_list_name?: string;
}

export interface FlyerAddToListResult {
  list_id: string;
  list_name: string;
  items_added: number;
  items_skipped: number;
}

const flyerService = {
  getFlyers: async (params: FlyerParams): Promise<FlyerDealPage> => {
    const response = await api.get('/flyers', { params });
    return response.data;
  },

  addToList: async (params: FlyerAddToListParams): Promise<FlyerAddToListResult> => {
    const response = await api.post('/flyers/add-to-list', params);
    return response.data;
  },
};

export default flyerService;
