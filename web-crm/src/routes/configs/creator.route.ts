import { lazy } from "react";
import CreatorRoute from "src/constants/routes/creator.route";
import IRouteModel from "src/models/IRouteModel";

const CreateGamePage = lazy(() => import("src/containers/Creator/CreateGamePage"));

const CreatorRouteConfig: IRouteModel[] = [
    {
        // URL: /creator
        path: CreatorRoute.BASE,
        element: CreateGamePage
    },
    {
        // URL: /creator/create/game
        path: CreatorRoute.CREATE_GAME,
        element: CreateGamePage
    }
];

export default CreatorRouteConfig;