import { FC } from "react";
import styles from "./Navbar.module.css";
import IconRouter from "../Icons/Routers/IconRouter";
import Dropdown from "../UI/Dropdown";
import { DropdownOption } from "../UI/Dropdown/Dropdown";
import NetmanPng from "src/assets/images/netman.png";
import { useAppDispatch, useAppSelector } from "src/hooks/redux.hook";
import AuthAction from "src/store/actions/AuthAction";
import messageQueueAction from "src/store/actions/MessageQueueAction";
import { useNavigate } from "react-router-dom";
import BaseRoute from "src/constants/routes/base.route";

const optionsUserProfile: DropdownOption[] = [
    {
        id: 1,
        label: "Профиль"
    },
    {
        id: 2,
        label: "Выход"
    }
];

const optionsCreator: DropdownOption[] = [
    {
        id: 1,
        label: "Создать игру"
    },
    {
        id: 2,
        label: "Архив игр"
    },
    {
        id: 2,
        label: "Созданные игры"
    }
];

const Navbar: FC<any> = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const userProfileClick = (id: number) => {
        const index = optionsUserProfile.findIndex((item) => {
            return item.id === id;
        });

        if ((index >= 0) && (optionsUserProfile[index].label.trim().toLowerCase() === "выход")) {
            dispatch(AuthAction.logout(() => {
                navigate(BaseRoute.SIGN_IN);
                dispatch(messageQueueAction.addMessage(null, "dark", "Вы вышли из системы!"));
            }))
        }
    };

    const creatorClick = (id: number) => {

    };

    return (
        <>
            <div className={styles.navbar}>
                <div>
                    <Dropdown
                        position={"center"}
                        options={optionsUserProfile}
                        clickHandler={userProfileClick}
                    >
                        <IconRouter.UserProfileIcon />
                    </Dropdown>
                </div>
                <div>
                    <Dropdown
                        label={"Создатель"}
                        position={"left"}
                        options={optionsCreator}
                        clickHandler={creatorClick}
                    />
                </div>
                <div className={styles.image}>
                    <img className={styles.logo} src={NetmanPng} />
                </div>
            </div>
        </>
    );
};

export default Navbar;
