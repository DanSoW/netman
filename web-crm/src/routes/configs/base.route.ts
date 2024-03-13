import { lazy } from "react";
import BaseRoute from "src/constants/routes/base.route";
import IRouteModel from "src/models/IRouteModel";
import HomePage from "src/containers/HomePage";
import SignInPage from "src/containers/Auth/SignInPage";

const BaseRouteConfig: IRouteModel[] = [
    {
        // URL: /
        path: BaseRoute.BASE,
        element: SignInPage
    },
    {
        // URL: /home
        path: BaseRoute.HOME,
        element: HomePage
    },
    {
        // URL: /auth/sign-in
        path: BaseRoute.SIGN_IN,
        element: SignInPage
    }
];

export default BaseRouteConfig;