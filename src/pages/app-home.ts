import { LitElement, css, html } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { resolveRouterPath } from '../router';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import { styles } from '../styles/shared-styles';
import '../components/recipe-list';

@customElement('app-home')
export class AppHome extends LitElement {

  // For more information on using properties and state in lit
  // check out this link https://lit.dev/docs/components/properties/
  @property() message = 'Nextcloud Cookbook';
  @property() apiUrl = '';
  @property() apiToken = '';
  @property() connectionStatus: 'disconnected' | 'connected' | 'error' = 'disconnected';
  @property() apiVersion = '';
  @property() recipes: any[] = [];
  @property() isLoading = false;

  static styles = [
    styles,
    css`
      main {
        margin-top: 0;
        padding: 1rem;
      }

      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
      }

      .connection-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        max-width: 200px;
        margin-right: 1rem;
      }

      .input-group {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      sl-input {
        width: 100%;
      }

      .settings-button {
        position: fixed;
        bottom: 1rem;
        right: 1rem;
      }

      sl-dialog::part(body) {
        min-width: 300px;
      }

      .alert-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1000;
      }
    `];

  async checkConnection() {
    try {
      if (!this.apiUrl || !this.apiToken) {
        this.connectionStatus = 'disconnected';
        return;
      }

      const response = await fetch(`${this.apiUrl}/api/version`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${this.apiToken}`,
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error('Connection failed');
      }

      const data = await response.json();
      this.apiVersion = data.cookbook_version || 'Unknown';
      this.connectionStatus = 'connected';
    } catch (error) {
      console.error('Connection error:', error);
      this.connectionStatus = 'error';
      this.showAlert('error', 'Failed to connect to Nextcloud Cookbook. Please check CORS settings in your Nextcloud instance.');
    }
  }

  async firstUpdated() {
    // this method is a lifecycle even in lit
    // for more info check out the lit docs https://lit.dev/docs/components/lifecycle/
    console.log('This is your home page');
    // Load saved values when component first updates
    this.apiUrl = localStorage.getItem('nextcloud-api-url') || '';
    this.apiToken = localStorage.getItem('nextcloud-api-token') || '';
    await this.checkConnection();
  }

  showSettings() {
    const dialog = this.shadowRoot?.querySelector<any>('sl-dialog');
    if (dialog) {
      dialog.show();
    }
  }

  showAlert(type: 'success' | 'error', message: string) {
    const alert = Object.assign(document.createElement('sl-alert'), {
      variant: type,
      closable: true,
      duration: 3000,
      innerHTML: `
        <sl-icon slot="icon" name="${type === 'success' ? 'check2-circle' : 'exclamation-circle'}"></sl-icon>
        ${message}
      `
    });

    const container = this.shadowRoot?.querySelector('.alert-container');
    container?.appendChild(alert);
    alert.toast();
  }

  async saveConfiguration() {
    try {
      localStorage.setItem('nextcloud-api-url', this.apiUrl);
      localStorage.setItem('nextcloud-api-token', this.apiToken);
      const dialog = this.shadowRoot?.querySelector<any>('sl-dialog');
      if (dialog) {
        dialog.hide();
      }
      await this.checkConnection();
      this.showAlert('success', 'Settings saved successfully');
    } catch (error) {
      this.showAlert('error', 'Failed to save settings');
    }
  }

  share() {
    if ((navigator as any).share) {
      (navigator as any).share({
        title: 'PWABuilder pwa-starter',
        text: 'Check out the PWABuilder pwa-starter!',
        url: 'https://github.com/pwa-builder/pwa-starter',
      });
    }
  }

  handleApiUrlChange(e: any) {
    this.apiUrl = e.target.value;
  }

  handleApiTokenChange(e: any) {
    this.apiToken = e.target.value;
  }

  async fetchRecipes() {
    try {
      this.isLoading = true;
      const response = await fetch(`${this.apiUrl}/recipes`, {
        headers: {
          'Authorization': `Basic ${this.apiToken}`,
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch recipes');
      const data = await response.json();
      this.recipes = data;
      this.isLoading = false;
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
      this.showAlert('error', 'Failed to fetch recipes');
      this.isLoading = false;
    }
  }

  render() {
    return html`
      <header>
        <div class="connection-status">
          <sl-icon
            name="${this.connectionStatus === 'connected' ? 'check-circle-fill' :
                   this.connectionStatus === 'error' ? 'exclamation-circle-fill' :
                   'dash-circle-fill'}"
            style="color: ${this.connectionStatus === 'connected' ? 'var(--sl-color-success-500)' :
                          this.connectionStatus === 'error' ? 'var(--sl-color-danger-500)' :
                          'var(--sl-color-neutral-500)'}"
          ></sl-icon>
          ${this.connectionStatus === 'connected' ?
            html`<span>Connected (v${this.apiVersion})</span>` :
            html`<span>${this.connectionStatus}</span>`}
        </div>
        <sl-button variant="text" size="small" @click=${this.showSettings}>
          <sl-icon slot="prefix" name="gear"></sl-icon>
          Settings
        </sl-button>
      </header>

      <div class="alert-container"></div>

      <main>
        <recipe-list
          .apiUrl=${this.apiUrl}
          .apiToken=${this.apiToken}
          @fetch-error=${(e: CustomEvent) => this.showAlert('error', e.detail)}>
        </recipe-list>
      </main>

      <sl-dialog label="Nextcloud Cookbook Settings" class="dialog-overview">
        <div class="input-group">
          <sl-input
            label="Nextcloud Cookbook API URL"
            type="url"
            .value="${this.apiUrl}"
            @sl-input="${this.handleApiUrlChange}"
            placeholder="https://your-nextcloud.com/apps/cookbook/api"
          ></sl-input>

          <sl-input
            label="API Auth Token"
            type="password"
            .value="${this.apiToken}"
            @sl-input="${this.handleApiTokenChange}"
            placeholder="Enter your API token"
          ></sl-input>
        </div>

        <sl-button slot="footer" variant="primary" @click="${this.saveConfiguration}">
          Save Configuration
        </sl-button>
      </sl-dialog>
    `;
  }
}
