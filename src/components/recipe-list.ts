import { LitElement, css, html } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { styles } from '../styles/shared-styles';
import { resolveRouterPath } from '../router';
import { ApiConfig } from '../utils/api-config';

@customElement('recipe-list')
export class RecipeList extends LitElement {
  @property() recipes: any[] = [];
  @property() recipeImages: Map<string, string> = new Map();
  @property() currentPage = 1;
  @property() recipesPerPage = 20;
  @property() isLoading = false;

  static styles = css`
    .setup-prompt {
      text-align: center;
      padding: 2rem;
    }
    .recipe-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
      padding: 1rem;
    }
    sl-card {
      cursor: pointer;
    }
    .recipe-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    window.addEventListener('api-connected', () => this.fetchRecipes());
    // If we're already connected, fetch recipes immediately
    if (ApiConfig.apiUrl && ApiConfig.apiToken) {
      this.fetchRecipes();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('api-connected', () => this.fetchRecipes());
    // Clean up blob URLs
    this.recipeImages.forEach(url => URL.revokeObjectURL(url));
  }

  async fetchRecipes() {
    try {
      this.isLoading = true;
      const response = await fetch(`${ApiConfig.apiUrl}/api/v1/recipes`, {
        headers: {
          'Authorization': `Basic ${ApiConfig.apiToken}`,
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) throw new Error('Failed to fetch recipes');
      const data = await response.json();
      this.recipes = data;

      // Fetch images for all recipes
      await Promise.all(this.recipes.map(recipe =>
        this.fetchRecipeImage(recipe.recipe_id)
      ));
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
      const event = new CustomEvent('fetch-error', {
        detail: 'Failed to fetch recipes',
        bubbles: true,
        composed: true
      });
      this.dispatchEvent(event);
    } finally {
      this.isLoading = false;
    }
  }

  private async fetchRecipeImage(recipeId: string) {
    try {
      const response = await fetch(`${ApiConfig.apiUrl}/api/v1/recipes/${recipeId}/image`, {
        headers: {
          'Authorization': `Basic ${ApiConfig.apiToken}`
        },
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) return;
      const blob = await response.blob();
      this.recipeImages.set(recipeId, URL.createObjectURL(blob));
      this.requestUpdate(); // Trigger re-render with new image
    } catch (error) {
      console.error('Failed to load image:', error);
    }
  }

  handleRecipeClick(recipeId: string) {
    window.location.href = `/recipe/${recipeId}`;
  }

  render() {
    if (!ApiConfig.apiUrl || !ApiConfig.apiToken) {
      return html`
        <div class="setup-prompt">
          <h2>Welcome to Nextcloud Cookbook</h2>
          <p>Please configure your API credentials in settings to get started.</p>
        </div>
      `;
    }

    if (this.isLoading) {
      return html`<sl-spinner></sl-spinner>`;
    }

    return html`
      <div class="recipe-grid">
        ${this.recipes.map(recipe => html`
          <sl-card @click=${() => this.handleRecipeClick(recipe.recipe_id)}>
            ${this.recipeImages.get(recipe.recipe_id) ? html`
              <img
                slot="image"
                src=${this.recipeImages.get(recipe.recipe_id)}
                alt="${recipe.name}"
                class="recipe-image"
              >
            ` : ''}
            <h3>${recipe.name}</h3>
            ${recipe.description ? html`<p>${recipe.description}</p>` : ''}
          </sl-card>
        `)}
      </div>
    `;
  }
}