export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number>;
  signal?: AbortSignal;
};
export class ApiClient {
  private readonly baseUrl: string;
  private readonly token?: string;
  private readonly unauthorized?: () => void;
  private readonly fetcher: typeof fetch;
  constructor(
    baseUrl: string,
    token?: string,
    unauthorized?: () => void,
    fetcher: typeof fetch = fetch,
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = token;
    this.unauthorized = unauthorized;
    // Calling window.fetch as a class method changes its receiver on the web.
    this.fetcher = (input, init) => fetcher(input, init);
  }
  async request(path: string, options: RequestOptions = {}): Promise<unknown> {
    const url = new URL(`${this.baseUrl}/${path.replace(/^\/+/, '')}`);
    for (const [key, value] of Object.entries(options.query ?? {}))
      url.searchParams.set(key, String(value));
    const controller = new AbortController();
    const cancel = () => controller.abort();
    options.signal?.addEventListener('abort', cancel, { once: true });
    if (options.signal?.aborted) cancel();
    const timeout = setTimeout(cancel, 60_000);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    const form = options.body instanceof FormData;
    if (options.body !== undefined && !form)
      headers['Content-Type'] = 'application/json';
    try {
      const response = await this.fetcher(url.toString(), {
        method: options.method ?? 'GET',
        headers,
        signal: controller.signal,
        body:
          options.body === undefined
            ? undefined
            : form
              ? (options.body as FormData)
              : JSON.stringify(options.body),
      });
      const text = await response.text();
      let data: unknown;
      try {
        data = text ? JSON.parse(text) : undefined;
      } catch {
        data = undefined;
      }
      if (!response.ok) {
        if (response.status === 401 && this.token) this.unauthorized?.();
        const detail =
          data && typeof data === 'object'
            ? ((data as Record<string, unknown>).detail ??
              (data as Record<string, unknown>).message)
            : undefined;
        const message =
          typeof detail === 'string'
            ? detail
            : Array.isArray(detail)
              ? detail
                  .map((item) =>
                    typeof item?.msg === 'string' ? item.msg : '',
                  )
                  .filter(Boolean)
                  .join('\n')
              : '';
        throw new ApiError(
          response.status,
          message || `Request failed (${response.status}). Please try again.`,
        );
      }
      if (text && data === undefined)
        throw new Error('The server returned an unreadable response.');
      return data;
    } catch (error) {
      if (controller.signal.aborted)
        throw new Error(
          options.signal?.aborted
            ? 'Request cancelled.'
            : 'The request timed out. Please try again.',
        );
      if (error instanceof TypeError)
        throw new Error(
          'Could not connect to SAVR. Check your connection and try again.',
        );
      throw error;
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener('abort', cancel);
    }
  }
}
export const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
