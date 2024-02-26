//------------------------------------------------------------------
//Определение навигации для сайта
//------------------------------------------------------------------

import React, { useContext, useEffect, useState } from 'react';
import { NavLink, useHistory } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useHttp } from '../../hooks/http.hook';
import { useMessage } from '../../hooks/message.hook';
import classNames from 'classnames';

// Подключение изображений
import account_user from "../../resources/icons/account_user.svg";
import messenger from "../../resources/icons/messenger.svg";
import logo_netman from "../../resources/images/main/image_netman.png";

// Подключение таблицы стилей
import styles from "./Navbar.module.css";

// Routes constants
import CreatorRoutesConstants from '../../constants/addresses/routes/creator.routes.constants';
import ModeratorRoutesConstants from '../../constants/addresses/routes/moderator.routes.constants';
import AdminRoutesConstants from '../../constants/addresses/routes/admin.routes.constants';
import SuperAdminRoutesConstants from '../../constants/addresses/routes/super.admin.routes.constants';
import ManagerRoutesConstants from '../../constants/addresses/routes/manager.routes.constants';
import MainRoutesConstants from '../../constants/addresses/routes/main.routes.constants';

// Api constants
import SequrityApiConstants from '../../constants/addresses/api/sequrity.api.constants';

// Storages constants
import AuthStoragesConstants from '../../constants/values/storages/auth.storages.constants';

const Navbar = () => {
    const history = useHistory();
    const auth = useContext(AuthContext);
    const message = useMessage();
    const { loading, request, error, clearError } = useHttp();
    let [nameRole, setNameRole] = useState("Модуль");
    let [currentFunction, setCurrentFunction] = useState(null);
    let [roleFunctions, setRoleFunctions] = useState({
        functions: []
    });

    useEffect(() => {
        message(error);
        clearError();
    }, [error, message, clearError]);

    // Обработка разлогирования пользователя
    const logoutHandler = (event) => {
        event.preventDefault();
        auth.logout();
        history.push(MainRoutesConstants.line);
    };

    // Проверка доступа к определённому функциональному модулю
    const checkAccess = async (event, name) => {
        try {
            const data = await request(SequrityApiConstants.access, 'POST', {
                users_id: auth.usersId, name_module: name,
                access_token: (JSON.parse(localStorage.getItem(AuthStoragesConstants.main))).access_token
            });

            if ((data.message) || (data.errors)) {
                message(data.message);

                const errors = data.errors;
                if (errors) {
                    errors.forEach(function (item) {
                        message(item.msg);
                    });
                }

                logoutHandler(event);
                return;
            }

            /*localStorage.setItem(default_config.storageName, JSON.stringify({
                ...JSON.parse(localStorage.getItem(default_config.storageName))
            }));*/

        } catch (e) {
            logoutHandler(event);
        }
    };

    return (
        <nav className={styles["navbar-wrapper"]}>
            <ul className={styles["navbar-topmenu"]}>
                <li className={styles["navbar-topmenu-item-2"]}>
                    {
                        // Установка функциональных кнопок для обеспечения пользователя тем или иным функционалом
                    }
                    <ul className={styles["topmenu-item-2-block-function"]}>
                        {(roleFunctions.functions !== null) && roleFunctions.functions.map(item => (
                            <li
                                key={item.name}
                            >
                                <NavLink to={item.ref}
                                    name={item.name}
                                    disabled={loading}
                                    className={styles["block-function-navlink"]}
                                    style={{
                                        color: 'white',
                                        fontWeight: ((currentFunction) && (currentFunction.function === item.name)) ? 'bold' : 'normal'
                                    }}
                                    onClick={(e) => {
                                        setCurrentFunction({
                                            function: item.name
                                        });
                                    }}
                                >
                                    {item.text}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </li>
                <li className={styles["navbar-topmenu-item-1"]}><img src={logo_netman} /></li>
                <li className={styles["navbar-topmenu-item-3"]}>
                    <label className={styles["topmenu-item-3-role"]}>{nameRole}</label>
                    <ul className={classNames(styles["submenu"], styles["buttons-block"])}>

                        {((auth.isAuthenticated) && (auth.modules) &&
                            (auth.modules.creator)) &&
                            <li>
                                <NavLink to={CreatorRoutesConstants.creator}
                                    name="creator"
                                    onClick={(e) => {
                                        checkAccess(e, "creator");
                                    }}
                                    disabled={loading}
                                >
                                <button onClick={() => {
                                    setNameRole("Создатель");
                                    setRoleFunctions({
                                        functions: [{
                                            ref: CreatorRoutesConstants.creator,
                                            text: 'Создать игру',
                                            name: 'creator',
                                        },
                                            {
                                            ref: CreatorRoutesConstants.games_view_created,
                                            text: 'Просмотр игр',
                                            name: 'game_views',
                                        },
                                        {
                                            ref: CreatorRoutesConstants.games_archive,
                                            text: 'Архив игр',
                                            name: 'game_archive',
                                        }]
                                    });
                                }}>Создатель</button>
                            </NavLink>
                            </li>
                        }

                        {((auth.isAuthenticated) && (auth.modules) &&
                            (auth.modules.moderator)) &&
                            <li><NavLink to={ModeratorRoutesConstants.moderator}
                                name="moderator"
                                onClick={(e) => {
                                    checkAccess(e, "moderator");
                                }}
                                disabled={loading}
                            ><button onClick={() => {
                                setNameRole("Модератор");
                                setRoleFunctions({
                                    functions: [{
                                        ref: ModeratorRoutesConstants.moderator,
                                        text: 'Просмотр игр',
                                        name: 'moderator'
                                    },
                                        {
                                        ref: ModeratorRoutesConstants.creators_list,
                                        text: 'Создатели',
                                        name: 'creator_list'
                                    }
                                    ]
                                });
                            }}>Модератор</button></NavLink></li>
                        }

                        {((auth.isAuthenticated) && (auth.modules) &&
                            (auth.modules.manager)) &&
                            <li><NavLink to={ManagerRoutesConstants.manager}
                                name="manager"
                                onClick={(e) => {
                                    checkAccess(e, "manager");
                                }}
                                disabled={loading}
                            ><button onClick={() => {
                                setNameRole("Менеджер");
                            }}>Менеджер</button></NavLink></li>
                        }

                        {((auth.isAuthenticated) && (auth.modules) &&
                            (auth.modules.admin)) &&
                            <li><NavLink to={AdminRoutesConstants.admin}
                                name="admin"
                                onClick={(e) => {
                                    checkAccess(e, "admin");
                                }}
                                disabled={loading}
                            ><button onClick={() => {
                                setNameRole("Администратор");
                            }}>Админ</button></NavLink></li>
                        }

                        {((auth.isAuthenticated) && (auth.modules) &&
                            (auth.modules.super_admin)) &&
                            <li><NavLink to={SuperAdminRoutesConstants.super_admin}
                                name="super_admin"
                                onClick={(e) => {
                                    checkAccess(e, "super_admin");
                                }}
                                disabled={loading}
                            ><button onClick={() => {
                                setNameRole("Бог");
                            }}>Бог</button></NavLink></li>
                        }
                    </ul>
                </li>
                <li className={styles["navbar-topmenu-item-4"]}>
                    <img src={messenger} />
                    <ul className={classNames(styles["submenu"], styles["buttons-block"])}>
                        <li>
                            <a href="/">
                                <button onClick={logoutHandler}>New</button>
                            </a>
                        </li>
                    </ul>
                </li>
                <li className={styles["navbar-topmenu-item-5"]}>
                    <img src={account_user} />
                    <ul className={classNames(styles["submenu"], styles["buttons-block"])}>
                        <li>
                            <a href="/">
                                <button onClick={logoutHandler}>Выход</button>
                            </a>
                        </li>
                    </ul>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;