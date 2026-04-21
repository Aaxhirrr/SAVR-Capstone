import axios from 'axios';
import { API_BASE_URL } from './api';
import { getToken } from './auth';

export type FlyerDeal = {
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
};

export type FlyerDealPage = {
  deals: FlyerDeal[];
  total: number;
  page: number;
  page_size: number;
};

export type FlyerParams = {
  store_brand: string;
  search?: string;
  sort_by?: string;
  sort_dir?: string;
  page?: number;
  page_size?: number;
};

async function getAuthHeaders() {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getFlyers(
  params: FlyerParams
): Promise<FlyerDealPage> {
  const headers = await getAuthHeaders();
  const response = await axios.get<FlyerDealPage>(`${API_BASE_URL}/flyers`, {
    headers,
    params,
  });
  return response.data;
}

