import { CommonModule } from "@angular/common";
import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { combineLatest } from "rxjs";
import { Errors } from "../../../../core/models/errors.model";
import {
  ArticlesService,
  UnsplashImage,
} from "../../services/articles.service";
import { UserService } from "../../../../core/auth/services/user.service";
import { ListErrorsComponent } from "../../../../shared/components/list-errors.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

// Angular Material Datepicker
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatNativeDateModule } from "@angular/material/core";
import { MatIconModule } from "@angular/material/icon";

interface ArticleForm {
  title: FormControl<string>;
  description: FormControl<string>;
  body: FormControl<string>;
  publishDate: FormControl<Date | null>;
  image: FormControl<string>;
}

@Component({
  selector: "app-editor-page",
  templateUrl: "./editor.component.html",
  styleUrl: "./editor.component.css",
  // Añade  a los imports
  imports: [
    CommonModule, // <-- 2. AÑADE CommonModule AQUÍ
    ListErrorsComponent,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true, // <-- ASEGÚRATE DE QUE ESTA LÍNEA ESTÉ (si no estaba)
})
export default class EditorComponent implements OnInit {
  tagList: string[] = [];
  articleForm: FormGroup<ArticleForm> = new FormGroup<ArticleForm>({
    title: new FormControl("", {
      validators: [Validators.required],
      nonNullable: true,
    }),
    description: new FormControl("", {
      validators: [Validators.required],
      nonNullable: true,
    }),
    body: new FormControl("", {
      validators: [Validators.required],
      nonNullable: true,
    }),
    publishDate: new FormControl<Date | null>(null),
    image: new FormControl("", { nonNullable: true }),
  });
  tagField = new FormControl<string>("", { nonNullable: true });

  errors: Errors | null = null;
  isSubmitting = false;
  destroyRef = inject(DestroyRef);
  imageSearchResults: UnsplashImage[] = [];
  isSearchingImages = false;
  imageSearchError: string | null = null;

  constructor(
    private readonly articleService: ArticlesService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userService: UserService,
  ) {}

  ngOnInit() {
    if (this.route.snapshot.params["slug"]) {
      combineLatest([
        this.articleService.get(this.route.snapshot.params["slug"]),
        this.userService.getCurrentUser(),
      ])
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(([article, { user }]) => {
          if (user.username === article.author.username) {
            this.tagList = article.tagList;

            let publishDateForForm: Date | null = null;

            if (article.publishDate) {
              // El string que llega es "2025-09-10T00:00:00.000Z"
              // 1. Tomamos solo la parte de la fecha: "2025-09-10"
              const datePart = article.publishDate.split("T")[0];

              // 2. Creamos un nuevo objeto Date usando esa parte. Al no tener
              // información de zona horaria, JavaScript lo crea en la zona local.
              publishDateForForm = new Date(datePart + "T00:00:00");
            }

            const articleForForm = {
              ...article,
              image: article.image ?? "",
              publishDate: publishDateForForm,
            };

            this.articleForm.patchValue(articleForForm);
          } else {
            void this.router.navigate(["/"]);
          }
        });
    }
  }

  addTag() {
    // retrieve tag control
    const tag = this.tagField.value;
    // only add tag if it does not exist yet
    if (tag != null && tag.trim() !== "" && this.tagList.indexOf(tag) < 0) {
      this.tagList.push(tag);
    }
    // clear the input
    this.tagField.reset("");
  }

  removeTag(tagName: string): void {
    this.tagList = this.tagList.filter((tag) => tag !== tagName);
  }

  submitForm(): void {
    const formValue = this.articleForm.getRawValue();
    this.isSubmitting = true;
    this.addTag();
    const slug = this.route.snapshot.params["slug"];

    // Construimos el objeto de datos asegurando que el tipo sea correcto.
    const articleData = {
      title: formValue.title,
      description: formValue.description,
      body: formValue.body,
      image: formValue.image,
      tagList: this.tagList,
      // Si hay fecha, la formateamos. Si no, asignamos 'undefined'.
      publishDate: formValue.publishDate
        ? new Date(formValue.publishDate).toLocaleDateString("en-CA") // 'en-CA' da el formato YYYY-MM-DD
        : undefined,
    };

    const observable = slug
      ? this.articleService.update({ ...articleData, slug })
      : this.articleService.create(articleData);

    observable.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (article) => this.router.navigate(["/article", article.slug]),
      error: (err) => {
        this.errors = err;
        this.isSubmitting = false;
      },
    });
  }

  /**
   * Llama al servicio para buscar imágenes
   */
  searchForImage(query: string): void {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      this.imageSearchResults = [];
      this.imageSearchError = null;
      return;
    }

    this.isSearchingImages = true;
    this.imageSearchError = null;

    this.articleService
      .searchImages(normalizedQuery)
      .pipe(takeUntilDestroyed(this.destroyRef)) // Usamos el patrón que ya tienes
      .subscribe({
        next: (data) => {
          this.imageSearchResults = data.images;
          this.imageSearchError =
            data.images.length === 0 ? "No se encontraron imágenes." : null;
          this.isSearchingImages = false;
        },
        error: (err) => {
          console.error("Error al buscar imágenes:", err);
          this.imageSearchError =
            "No se pudieron cargar las imágenes. Intente de nuevo.";
          this.isSearchingImages = false;
          this.imageSearchResults = [];
        },
      });
  }

  /**
   * Pone la URL de la imagen seleccionada en el formulario
   */
  selectImage(image: UnsplashImage): void {
    this.articleForm.patchValue({ image: image.url_regular });
    this.imageSearchResults = [];

    // Unsplash asks API applications to report when a photo is selected for use.
    this.articleService
      .trackImageSelection(image.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error) =>
          console.warn("No se pudo registrar la selección en Unsplash", error),
      });
  }
}
