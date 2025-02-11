import { LitElement, css, html } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ApiConfig } from '../utils/api-config';

@customElement('search-results')
export class SearchResults extends LitElement {
  @property() query = '';
  @property() results: any[] = [];
  @property() isLoading = true;
  @property() error = '';

  static styles = css`
    :host {
      display: block;
    }
    main {
      padding: 1rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .recipe-card {
      padding: 1rem;
      margin-bottom: 1rem;
      border: 1px solid var(--sl-color-neutral-200);
      border-radius: 8px;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
      display: block;
      background: var(--sl-color-neutral-0);
      box-shadow: var(--sl-shadow-x-small);
    }
    .recipe-card:hover {
      background: var(--sl-color-neutral-50);
      box-shadow: var(--sl-shadow-small);
    }
    .recipe-card h3 {
      margin: 0 0 0.5rem 0;
      color: var(--sl-color-neutral-900);
    }
    .recipe-card p {
      margin: 0;
      color: var(--sl-color-neutral-700);
    }
    h2 {
      margin: 0 0 1rem 0;
    }
  `;

  async firstUpdated() {
    await ApiConfig.load();
    await this.searchRecipes();
  }

  async searchRecipes() {
    try {
      this.isLoading = true;
      const searchQuery = encodeURIComponent(this.query);
      const response = await fetch(`${ApiConfig.apiUrl}/api/v1/search/${searchQuery}`, {
        headers: {
          'Authorization': `Basic ${ApiConfig.apiToken}`,
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) throw new Error('Search failed');
      this.results = await response.json();
    } catch (error) {
      this.error = 'Failed to search recipes';
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    return html`
      <app-header></app-header>
      <main>
        <h2>Search Results for "${decodeURIComponent(this.query || '')}"</h2>
        ${this.isLoading ? html`
          <sl-spinner></sl-spinner>
        ` : this.error ? html`
          <p>${this.error}</p>
        ` : this.results.length === 0 ? html`
          <p>No recipes found</p>
        ` : html`
          ${this.results.map(recipe => html`
            <a href="/recipe/${recipe.id}" class="recipe-card">
              <h3>${recipe.name}</h3>
              ${recipe.description ? html`
                <p>${recipe.description}</p>
              ` : ''}
            </a>
          `)}
        `}
      </main>
    `;
  }
}