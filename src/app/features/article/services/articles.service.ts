import { Injectable } from "@angular/core";
import { HttpClient, HttpContext, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ArticleListConfig } from "../models/article-list-config.model";
import { USE_PYTHON_API } from "../../../core/interceptors/api-context.token";

export interface UnsplashImage {
  id: string;
  url_small: string;
  url_regular: string;
  alt: string;
  user_name: string;
  user_url: string;
  photo_url: string;
  download_location: string | null;
}

export interface PythonArticle {
  slug: string;
  title: string;
  description: string | null;
  body: string | null;
}
import { Article } from "../models/article.model";

@Injectable({ providedIn: "root" })
export class ArticlesService {
  constructor(private readonly http: HttpClient) {}

  query(
    config: ArticleListConfig,
  ): Observable<{ articles: Article[]; articlesCount: number }> {
    // Convert any filters over to Angular's URLSearchParams
    let params = new HttpParams();

    Object.keys(config.filters).forEach((key) => {
      // params = params.set(key, config.filters[key as keyof ArticleListConfig["filters"]] as string | number | boolean);
    });

    return this.http.get<{ articles: Article[]; articlesCount: number }>(
      "/articles" + (config.type === "feed" ? "/feed" : ""),
      { params },
    );
  }

  get(slug: string): Observable<Article> {
    return this.http
      .get<{ article: Article }>(`/articles/${slug}`)
      .pipe(map((data) => data.article));
  }

  delete(slug: string): Observable<void> {
    return this.http.delete<void>(`/articles/${slug}`);
  }

  create(article: Partial<Article>): Observable<Article> {
    return this.http
      .post<{ article: Article }>("/articles", { article: article })
      .pipe(map((data) => data.article));
  }

  update(payload: Partial<Article> & { slug: string }): Observable<Article> {
    return this.http
      .put<{
        article: Article;
      }>(`/articles/${payload.slug}`, { article: payload })
      .pipe(map((data) => data.article));
  }

  favorite(slug: string): Observable<Article> {
    return this.http
      .post<{ article: Article }>(`/articles/${slug}/favorite`, {})
      .pipe(map((data) => data.article));
  }

  unfavorite(slug: string): Observable<void> {
    return this.http.delete<void>(`/articles/${slug}/favorite`);
  }

  searchImages(query: string): Observable<{ images: UnsplashImage[] }> {
    // Usamos HttpParams para añadir ?q=...
    const params = new HttpParams().set("q", query);

    // Usamos la URL relativa /images/search
    // El interceptor de la app debería añadir el prefijo /api
    return this.http.get<{ images: UnsplashImage[] }>("/images/search", {
      params,
    });
  }

  trackImageSelection(imageId: string): Observable<void> {
    return this.http.post<void>(`/images/${imageId}/download`, {});
  }

  getPythonArticlesDirect(): Observable<PythonArticle[]> {
    const context = new HttpContext().set(USE_PYTHON_API, true);
    return this.http.get<PythonArticle[]>("/articles", { context });
  }

  getPythonArticlesThroughPhp(): Observable<{
    articles: PythonArticle[];
    path: string;
  }> {
    return this.http.get<{
      articles: PythonArticle[];
      path: string;
    }>("/python/articles");
  }
}
