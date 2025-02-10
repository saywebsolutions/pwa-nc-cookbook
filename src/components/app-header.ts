import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ApiConfig } from '../utils/api-config';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/tag/tag.js';

@customElement('app-header')
export class AppHeader extends LitElement {
  @property() connectionStatus: 'disconnected' | 'connected' | 'error' = 'disconnected';
  @property() apiVersion = '';
  @property({ type: Boolean }) enableBack = false;

  static styles = css`
    :host {
      display: block;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--sl-color-neutral-0);
      border-bottom: 1px solid var(--sl-color-neutral-200);
    }
    .left-section {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .home-link {
      color: var(--sl-color-neutral-600);
      text-decoration: none;
      display: flex;
      align-items: center;
    }
    .home-link sl-icon {
      font-size: 1.4rem;
    }
    .home-link:hover {
      color: var(--sl-color-neutral-800);
    }
    .status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--sl-color-neutral-600);
      font-size: 1rem;
    }
    .status sl-icon {
      font-size: 1.2rem;
    }
    .status.connected sl-icon {
      color: var(--sl-color-success-600);
    }
    .status.error sl-icon {
      color: var(--sl-color-danger-600);
    }
    .input-group {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .settings-icon {
      color: var(--sl-color-neutral-600);
      cursor: pointer;
      display: flex;
      align-items: center;
      font-size: 1.4rem;
    }
    .settings-icon:hover {
      color: var(--sl-color-neutral-800);
    }
  `;

  async firstUpdated() {
    ApiConfig.load();
    await this.checkConnection();
  }

  async checkConnection() {
    try {
      if (!ApiConfig.apiUrl || !ApiConfig.apiToken) {
        this.connectionStatus = 'disconnected';
        return;
      }

      const response = await fetch(`${ApiConfig.apiUrl}/api/version`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${ApiConfig.apiToken}`,
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
      window.dispatchEvent(new CustomEvent('api-connected'));
    } catch (error) {
      console.error('Connection check failed:', error);
      this.connectionStatus = 'error';
    }
  }

  handleApiUrlChange(e: any) {
    const url = e.target.value;
    ApiConfig.save(url, ApiConfig.apiToken);
  }

  handleApiTokenChange(e: any) {
    const token = e.target.value;
    ApiConfig.save(ApiConfig.apiUrl, token);
  }

  async saveConfiguration() {
    try {
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

  showAlert(variant: 'success' | 'error', message: string) {
    const alert = Object.assign(document.createElement('sl-alert'), {
      variant,
      closable: true,
      duration: 3000,
      innerHTML: message
    });

    document.body.append(alert);
    alert.toast();
  }

  render() {
    return html`
      <header>
        <div class="left-section">
          <a href="/" class="home-link">
            <sl-icon name="house"></sl-icon>
          </a>
          <div class="status ${this.connectionStatus}">
            ${this.connectionStatus === 'connected' ? html`
              <sl-icon name="check-circle-fill"></sl-icon>
              <span>v${this.apiVersion}</span>
            ` : this.connectionStatus === 'error' ? html`
              <sl-icon name="exclamation-circle-fill"></sl-icon>
              <span>Connection Error</span>
            ` : html`
              <sl-icon name="dash-circle-fill"></sl-icon>
              <span>Not Connected</span>
            `}
          </div>
        </div>
        <sl-icon
          name="gear"
          class="settings-icon"
          @click=${() => {
            const dialog = this.shadowRoot?.querySelector('sl-dialog');
            if (dialog) dialog.show();
          }}
        ></sl-icon>
      </header>

      <sl-dialog label="Nextcloud Cookbook Settings" class="dialog-overview">
        <div class="input-group">
          <sl-input
            label="Nextcloud Cookbook API URL"
            type="url"
            .value="${ApiConfig.apiUrl}"
            @sl-input="${this.handleApiUrlChange}"
            placeholder="https://your-nextcloud.com/apps/cookbook/api"
          ></sl-input>

          <sl-input
            label="API Auth Token"
            type="password"
            .value="${ApiConfig.apiToken}"
            @sl-input="${this.handleApiTokenChange}"
            placeholder="Enter your API token"
          ></sl-input>
        </div>

        <sl-button slot="footer" variant="primary" @click=${this.saveConfiguration}>
          Save
        </sl-button>
      </sl-dialog>
    `;
  }
}