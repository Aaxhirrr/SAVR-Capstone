import api from './api';

const shareService = {
  async createShareLink(listId: string, storeName: string): Promise<{ url: string; token: string }> {
    const response = await api.post(`/share/list/${encodeURIComponent(listId)}/store/${encodeURIComponent(storeName)}`);
    const data = response.data || {};
    const origin = window.location.origin;
    const absoluteUrl = data.url ? new URL(data.url, origin).href : origin;
    return { url: absoluteUrl, token: data.token };
  },

  async downloadStorePdf(listId: string, storeName: string): Promise<void> {
    const response = await api.get(`/lists/${encodeURIComponent(listId)}/stores/${encodeURIComponent(storeName)}/pdf`, {
      responseType: 'blob'
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `savr-${storeName}-${listId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
};

export default shareService;


