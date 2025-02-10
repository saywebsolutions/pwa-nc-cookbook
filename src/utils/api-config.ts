export class ApiConfig {
  private static _apiUrl: string = '';
  private static _apiToken: string = '';

  static get apiUrl(): string {
    return this._apiUrl;
  }

  static get apiToken(): string {
    return this._apiToken;
  }

  static load(): void {
    this._apiUrl = localStorage.getItem('nextcloud-api-url') || '';
    this._apiToken = localStorage.getItem('nextcloud-api-token') || '';
  }

  static save(apiUrl: string, apiToken: string): void {
    localStorage.setItem('nextcloud-api-url', apiUrl);
    localStorage.setItem('nextcloud-api-token', apiToken);
    this._apiUrl = apiUrl;
    this._apiToken = apiToken;
  }
}