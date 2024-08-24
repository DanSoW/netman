import { lazy } from "react";
import CreatorRoute from "src/constants/routes/creator.route";
import IRouteModel from "src/models/IRouteModel";

const CreateGamePage = lazy(() => import("src/containers/Creator/CreateGamePage"));
const GameListPage = lazy(() => import("src/containers/Creator/GameListPage"));

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
    },
    {
        // URL: /creator/game/list
        path: CreatorRoute.GAME_LIST,
        element: GameListPage
    }
];

export default CreatorRouteConfig;