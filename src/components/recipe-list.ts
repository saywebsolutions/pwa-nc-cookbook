import { LitElement, css, html } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { styles } from '../styles/shared-styles';

@customElement('recipe-list')
export class RecipeList extends LitElement {
  @property() apiUrl = '';
  @property() apiToken = '';
  @property() recipes: any[] = [];
  @property() currentPage = 1;
  @property() recipesPerPage = 20;
  @property() isLoading = false;

  async fetchRecipes() {
    try {
      this.isLoading = true;
      const response = await fetch(`${this.apiUrl}/api/v1/recipes`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${this.apiToken}`,
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) throw new Error('Failed to fetch recipes');
      const data = await response.json();
      this.recipes = data;
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
      this.dispatchEvent(new CustomEvent('fetch-error', {
        detail: 'Failed to fetch recipes'
      }));
    } finally {
      this.isLoading = false;
    }
  }

  private async fetchImage(recipeId: string) {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/recipes/${recipeId}/image`, {
        headers: {
          'Authorization': `Basic ${this.apiToken}`,
          'Accept': 'image/*'
        },
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) throw new Error('Failed to load image');
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to load image:', error);
      return ''; // Return empty string or placeholder image URL
    }
  }

  async loadRecipeImage(recipe: any) {
    recipe.blobUrl = await this.fetchImage(recipe.id);
    this.requestUpdate();
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('apiUrl') || changedProperties.has('apiToken')) {
      if (this.apiUrl && this.apiToken) {
        this.fetchRecipes();
      }
    }
    if (changedProperties.has('recipes')) {
      this.paginatedRecipes.forEach(recipe => {
        if (!recipe.blobUrl) {
          this.loadRecipeImage(recipe);
        }
      });
    }
  }

  get paginatedRecipes() {
    const start = (this.currentPage - 1) * this.recipesPerPage;
    return this.recipes.slice(start, start + this.recipesPerPage);
  }

  nextPage() {
    if ((this.currentPage * this.recipesPerPage) < this.recipes.length) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  render() {
    return html`
      ${this.isLoading ?
        html`<sl-spinner></sl-spinner>` :
        html`
          <div class="recipes-grid">
            ${this.paginatedRecipes.map(recipe => html`
              <sl-card class="recipe-card">
                <img
                  src="${recipe.blobUrl || ''}"
                  alt="${recipe.name}"
                  class="recipe-image"
                />
                <strong>${recipe.name}</strong>
              </sl-card>
            `)}
          </div>
          <div class="pagination">
            <sl-button
              @click=${this.previousPage}
              ?disabled=${this.currentPage === 1}>
              Previous
            </sl-button>
            <span>Page ${this.currentPage}</span>
            <sl-button
              @click=${this.nextPage}
              ?disabled=${(this.currentPage * this.recipesPerPage) >= this.recipes.length}>
              Next
            </sl-button>
          </div>
        `
      }
    `;
  }

  static styles = [
    styles,
    css`
      :host {
        display: block;
        width: 100%;
      }

      .recipes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
        margin: 1rem 0;
        width: 100%;
      }

      .recipe-card {
        height: 100%;
      }

      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        margin-top: 1rem;
      }

      sl-spinner {
        margin: 2rem auto;
        display: block;
      }

      .recipe-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
        border-radius: 4px;
        margin-bottom: 0.5rem;
      }

      .recipe-card strong {
        display: block;
        text-align: center;
      }
    `
  ];
}