import { lazy } from "react";
import BaseRoute from "src/constants/routes/base.route";
import IRouteModel from "src/models/IRouteModel";
import HomePage from "src/containers/HomePage";

const BaseRouteConfig: IRouteModel[] = [
    {
        // URL: /
        path: BaseRoute.BASE,
        element: HomePage
    },
    {
        // URL: /home
        path: BaseRoute.HOME,
        element: HomePage
    }
];

export default BaseRouteConfig;