import { Routes } from "@angular/router";
import { inject } from "@angular/core";
import { UserService } from "./core/auth/services/user.service";
import { map } from "rxjs/operators";

export const APP_ROUTES = {
  HOME: "",
  LOGIN: "login",
  REGISTER: "register",
  SETTINGS: "settings",
  PROFILE: "profile",
  EDITOR: "editor",
  ARTICLE: "article/:slug",
  ARCHITECTURE_DEMO: "architecture-demo",
};

const isNotAuthenticated = () =>
  inject(UserService).isAuthenticated.pipe(map((isAuth) => !isAuth));
const isAuthenticated = () => inject(UserService).isAuthenticated;

export const routes: Routes = [
  {
    path: APP_ROUTES.HOME,
    loadComponent: () => import("./features/article/pages/home/home.component"),
  },
  {
    path: APP_ROUTES.LOGIN,
    loadComponent: () => import("./core/auth/auth.component"),
    canActivate: [isNotAuthenticated],
  },
  {
    path: APP_ROUTES.REGISTER,
    loadComponent: () => import("./core/auth/auth.component"),
    canActivate: [isNotAuthenticated],
  },
  {
    path: APP_ROUTES.SETTINGS,
    loadComponent: () => import("./features/settings/settings.component"),
    canActivate: [isAuthenticated],
  },
  {
    path: APP_ROUTES.PROFILE,
    loadChildren: () => import("./features/profile/profile.routes"),
  },
  {
    path: APP_ROUTES.EDITOR,
    children: [
      {
        path: "",
        loadComponent: () =>
          import("./features/article/pages/editor/editor.component"),
        canActivate: [isAuthenticated],
      },
      {
        path: ":slug",
        loadComponent: () =>
          import("./features/article/pages/editor/editor.component"),
        canActivate: [isAuthenticated],
      },
    ],
  },
  {
    path: APP_ROUTES.ARTICLE,
    loadComponent: () =>
      import("./features/article/pages/article/article.component"),
  },
  {
    path: APP_ROUTES.ARCHITECTURE_DEMO,
    loadComponent: () =>
      import(
        "./features/article/pages/architecture-demo/architecture-demo.component"
      ),
    canActivate: [isAuthenticated],
  },
];
