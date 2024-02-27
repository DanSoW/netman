//**************************************************************
// Маршрутизация в зависимости от прав доступа пользователя
//**************************************************************

import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import AuthPage from '../containers/AuthPage';
import EmptyPage from '../containers/EmptyPage';
import ModeratorPage from '../containers/ModeratorPage';
import CreatorPage from '../containers/CreatorPage';
import ViewGamePage from '../containers/CreatorPage/ViewGamePage';
import CreatorListPage from '../containers/ModeratorPage/CreatorListPage';
import CreatorInfoPage from '../containers/ModeratorPage/CreatorInfoPage';
import GameModerationPage from '../containers/ModeratorPage/GameModerationPage';
import ViewSpecificGame from '../containers/CreatorPage/ViewSpecificGame';

// Constants routes
import CreatorRoutesConstants from '../constants/addresses/routes/creator.routes.constants';
import ModeratorRoutesConstants from '../constants/addresses/routes/moderator.routes.constants';
import AdminRoutesConstants from '../constants/addresses/routes/admin.routes.constants';
import MainRoutesConstants from '../constants/addresses/routes/main.routes.constants';
import ManagerRoutesConstants from '../constants/addresses/routes/manager.routes.constants';
import SuperAdminRoutesConstants from '../constants/addresses/routes/super.admin.routes.constants';

export const useRoutes = (isAuthenticated, modules) => {

    if (isAuthenticated && (modules)) {
        return (
            <Switch>
                {
                    //Маршрутизация функционала создателя
                    //.................................
                }

                {
                    (modules.creator === true) &&
                    <Route path={CreatorRoutesConstants.creator} exact>
                        < CreatorPage />
                    </Route>
                }

                {
                    (modules.creator === true) &&
                    <Route path={CreatorRoutesConstants.games_add} exact>
                        < CreatorPage />
                    </Route>
                }

                {
                    (modules.creator === true) &&
                    <Route path={CreatorRoutesConstants.games_view_created} exact>
                        <ViewGamePage />
                    </Route>
                }

                {
                    (modules.creator === true) &&
                    <Route path={CreatorRoutesConstants.game_view} exact>
                        <ViewSpecificGame />
                    </Route>
                }

                {
                    //.................................
                }

                {
                    //Маршрутизация функционала модератора
                    //.................................
                }

                {
                    (modules.moderator === true) &&
                    <Route path={ModeratorRoutesConstants.moderator} exact>
                        < ModeratorPage />
                    </Route>
                }

                {
                    (modules.moderator === true) &&
                    <Route path={ModeratorRoutesConstants.creators_list} exact>
                        < CreatorListPage />
                    </Route>
                }

                {
                    (modules.moderator === true) &&
                    <Route path={ModeratorRoutesConstants.creator_info} exact>
                        < CreatorInfoPage />
                    </Route>
                }

                {
                    (modules.moderator === true) &&
                    <Route path={ModeratorRoutesConstants.game_moderation} exact>
                        < GameModerationPage />
                    </Route>
                }

                {
                    //.................................
                }

                {
                    //Маршрутизация функционала менеджера
                    //.................................
                }

                {
                    (modules.manager === true) &&
                    <Route path={ManagerRoutesConstants.manager} exact>
                        <EmptyPage />
                    </Route>
                }

                {
                    //.................................
                }

                {
                    //Маршрутизация функционала администратора
                    //.................................
                }


                {
                    (modules.admin === true) &&
                    <Route path={AdminRoutesConstants.admin} exact>
                        <EmptyPage />
                    </Route>
                }

                {
                    //.................................
                }

                {
                    //Маршрутизация функционала супер-админа
                    //.................................
                }

                {
                    (modules.super_admin === true) &&
                    <Route path={SuperAdminRoutesConstants.super_admin} exact>
                        <EmptyPage />
                    </Route>
                }

                {
                    //.................................
                }

                <Redirect to={CreatorRoutesConstants.creator} />

                {
                    //Маршруты вне зависимости от доступа к определённому
                    //функциональному блоку
                    //.................................
                }


                {
                    //.................................
                }
            </Switch>
        );
    }

    return (
        <Switch>
            <Route path={MainRoutesConstants.auth} exact>
                <AuthPage />
            </Route>

            <Route path={MainRoutesConstants.line} exact>
                <AuthPage />
            </Route>

            <Redirect to={MainRoutesConstants.line} />
        </Switch>
    );
}