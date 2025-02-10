import { LitElement, css, html } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ApiConfig } from '../utils/api-config';

@customElement('recipe-detail')
export class RecipeDetail extends LitElement {
  @property() recipeId = '';
  @property() recipe: any = null;
  @property() imageUrl: string | null = null;
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
    .recipe-header {
      margin-bottom: 2rem;
    }
    .recipe-header img {
      width: 100%;
      height: 300px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    .recipe-meta {
      display: flex;
      gap: 2rem;
      margin: 1rem 0;
      color: #666;
    }
    .ingredients, .instructions {
      margin-bottom: 2rem;
    }
    .ingredients ul {
      list-style: none;
      padding-left: 0;
    }
    .ingredients li {
      padding: 0.5rem 0;
      border-bottom: 1px solid #eee;
    }
    .instructions ol {
      padding-left: 1.5rem;
    }
    .instructions li {
      margin-bottom: 1rem;
    }
  `;

  async firstUpdated() {
    await ApiConfig.load();  // Wait for config to load
    await this.fetchRecipe();
  }

  async fetchRecipe() {
    try {
      this.isLoading = true;
      const response = await fetch(`${ApiConfig.apiUrl}/api/v1/recipes/${this.recipeId}`, {
        headers: {
          'Authorization': `Basic ${ApiConfig.apiToken}`,
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) throw new Error('Failed to fetch recipe');
      this.recipe = await response.json();
      await this.fetchImage();
    } catch (error) {
      this.error = 'Failed to load recipe';
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  private async fetchImage() {
    try {
      const response = await fetch(`${ApiConfig.apiUrl}/api/v1/recipes/${this.recipeId}/image`, {
        headers: {
          'Authorization': `Basic ${ApiConfig.apiToken}`
        },
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) return;
      const blob = await response.blob();
      this.imageUrl = URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to load image:', error);
    }
  }

  render() {
    return html`
      <app-header></app-header>
      <main>
        ${!ApiConfig.apiUrl || !ApiConfig.apiToken ? html`
          <p>Please configure API settings first</p>
        ` : this.isLoading ? html`
          <sl-spinner></sl-spinner>
        ` : this.error ? html`
          <p>${this.error}</p>
        ` : !this.recipe ? html`
          <p>Recipe not found</p>
        ` : html`
          <article>
            <div class="recipe-header">
              <h1>${this.recipe.name}</h1>
              ${this.imageUrl ? html`
                <img src="${this.imageUrl}" alt="${this.recipe.name}">
              ` : ''}
              <p>${this.recipe.description}</p>
              <div class="recipe-meta">
                ${this.recipe.prepTime ? html`
                  <span>Prep: ${this.formatTime(this.recipe.prepTime)}</span>
                ` : ''}
                ${this.recipe.totalTime ? html`
                  <span>Total: ${this.formatTime(this.recipe.totalTime)}</span>
                ` : ''}
                ${this.recipe.recipeYield ? html`
                  <span>Serves: ${this.recipe.recipeYield}</span>
                ` : ''}
              </div>
            </div>

            <div class="ingredients">
              <h2>Ingredients</h2>
              <ul>
                ${this.recipe.recipeIngredient?.map(ingredient => html`
                  <li>${ingredient}</li>
                `)}
              </ul>
            </div>

            <div class="instructions">
              <h2>Instructions</h2>
              <ol>
                ${this.recipe.resipeInstructions?.map(step => html`
                  <li>${step}</li>
                `)}
              </ol>
            </div>
          </article>
        `}
      </main>
    `;
  }

  private formatTime(duration: string): string {
    const matches = duration.match(/PT(\d+H)?(\d+M)?/);
    if (!matches) return duration;

    const hours = matches[1] ? parseInt(matches[1]) : 0;
    const minutes = matches[2] ? parseInt(matches[2]) : 0;

    const parts = [];
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);

    return parts.join(' ');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl);
    }
  }
}