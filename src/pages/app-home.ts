import { LitElement, css, html } from 'lit';
import { property, customElement } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import { styles } from '../styles/shared-styles';
import '../components/recipe-list';
import '../components/app-header';

@customElement('app-home')
export class AppHome extends LitElement {
  @property() message = 'Nextcloud Cookbook';
  @property() recipes: any[] = [];
  @property() isLoading = false;

  static styles = [
    styles,
    css`
      main {
        margin-top: 0;
        padding: 1rem;
      }

      .alert-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1000;
      }
    `
  ];

  render() {
    return html`
      <app-header></app-header>
      <main>
        <recipe-list
          @fetch-error=${(e: CustomEvent) => {
            const alert = Object.assign(document.createElement('sl-alert'), {
              variant: 'error',
              closable: true,
              duration: 3000,
              innerHTML: e.detail
            });
            const container = this.shadowRoot?.querySelector('.alert-container');
            container?.appendChild(alert);
            alert.toast();
          }}>
        </recipe-list>
      </main>

      <div class="alert-container"></div>
    `;
  }
}
