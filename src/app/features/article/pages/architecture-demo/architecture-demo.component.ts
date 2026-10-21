import { JsonPipe } from "@angular/common";
import { Component, DestroyRef, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize, take, timeout } from "rxjs/operators";
import {
  ArticlesService,
  PythonArticle,
} from "../../services/articles.service";

@Component({
  selector: "app-architecture-demo",
  imports: [JsonPipe],
  template: `
    <div class="container page architecture-demo">
      <h1>Angular, PHP and Python API paths</h1>
      <p class="lead intro-copy">
        Both requests return articles from FastAPI, but they use different
        authentication and communication paths.
      </p>

      <div class="comparison-grid">
        <section class="card">
          <div class="card-block">
            <h2>Direct</h2>
            <code>Angular → Python</code>
            <p class="explanation">
              The browser uses the public Python URL and its user token.
            </p>
            <button
              class="btn btn-outline-primary"
              type="button"
              [disabled]="directLoading()"
              (click)="loadDirect()"
            >
              {{ directLoading() ? "Loading..." : "Call Python directly" }}
            </button>

            @if (directError(); as error) {
              <div class="alert alert-danger result-panel" role="alert">
                {{ error }}
              </div>
            }
            @if (directArticles(); as articles) {
              <div class="response-box" aria-live="polite">
                <h3>Response</h3>
                <pre>{{ articles | json }}</pre>
              </div>
            }
          </div>
        </section>

        <section class="card">
          <div class="card-block">
            <h2>Through PHP</h2>
            <code>Angular → PHP → Python</code>
            <p class="explanation">
              The browser uses the PHP user token. PHP authenticates to Python
              with a short-lived service JWT.
            </p>
            <button
              class="btn btn-primary"
              type="button"
              [disabled]="gatewayLoading()"
              (click)="loadThroughPhp()"
            >
              {{ gatewayLoading() ? "Loading..." : "Call Python through PHP" }}
            </button>

            @if (gatewayError(); as error) {
              <div class="alert alert-danger result-panel" role="alert">
                {{ error }}
              </div>
            }
            @if (gatewayArticles(); as articles) {
              <div class="response-box" aria-live="polite">
                <h3>Response</h3>
                <pre>{{ articles | json }}</pre>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `,
  styles: `
    .architecture-demo {
      padding-top: 2rem;
      padding-bottom: 2rem;
    }

    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .card-block {
      padding: 1.5rem;
    }

    .intro-copy,
    .explanation {
      color: #e1e8f0;
    }

    .explanation {
      min-height: 3rem;
    }

    code {
      display: inline-block;
      margin-bottom: 1rem;
      font-size: 1rem;
    }

    .result-panel,
    .response-box {
      max-height: 28rem;
      margin-top: 1rem;
      overflow: auto;
    }

    .response-box {
      padding: 1rem;
      border: 1px solid #536878;
      border-radius: 0.35rem;
      background: #0d1726;
      color: #f4f7fb;
      box-shadow: inset 0 0 0 1px rgb(255 255 255 / 4%);
    }

    .response-box h3 {
      margin: 0 0 0.75rem;
      color: #57f2a3;
      font-size: 0.9rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .response-box pre {
      margin: 0;
      color: inherit;
      font-size: 0.85rem;
      line-height: 1.45;
      white-space: pre-wrap;
      word-break: break-word;
    }
  `,
})
export default class ArchitectureDemoComponent {
  private readonly articlesService = inject(ArticlesService);
  private readonly destroyRef = inject(DestroyRef);

  readonly directArticles = signal<PythonArticle[] | null>(null);
  readonly gatewayArticles = signal<PythonArticle[] | null>(null);
  readonly directError = signal<string | null>(null);
  readonly gatewayError = signal<string | null>(null);
  readonly directLoading = signal(false);
  readonly gatewayLoading = signal(false);

  loadDirect(): void {
    this.directLoading.set(true);
    this.directError.set(null);
    this.directArticles.set(null);

    this.articlesService
      .getPythonArticlesDirect()
      .pipe(
        take(1),
        timeout(70000),
        finalize(() => this.directLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (articles) => {
          this.directArticles.set(articles);
          this.directLoading.set(false);
        },
        error: (error) => {
          this.directError.set(this.describeError(error));
        },
      });
  }

  loadThroughPhp(): void {
    this.gatewayLoading.set(true);
    this.gatewayError.set(null);
    this.gatewayArticles.set(null);

    this.articlesService
      .getPythonArticlesThroughPhp()
      .pipe(
        take(1),
        timeout(70000),
        finalize(() => this.gatewayLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ articles }) => {
          this.gatewayArticles.set(articles);
          this.gatewayLoading.set(false);
        },
        error: (error) => {
          this.gatewayError.set(this.describeError(error));
        },
      });
  }

  private describeError(error: unknown): string {
    if (error && typeof error === "object" && "name" in error) {
      if (error.name === "TimeoutError") {
        return "The API did not finish within 70 seconds. Try again and check the backend logs.";
      }
    }

    if (typeof error === "string") {
      return error;
    }

    if (error && typeof error === "object" && "error" in error) {
      return String(error.error);
    }

    return "The request failed. Check the API logs and configuration.";
  }
}
