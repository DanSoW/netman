import { FC } from "react";
import NetmanPng from "src/assets/images/netman.png";
import styles from "./SignInPage.module.scss";
import Input from "src/components/UI/Input";
import Button from "src/components/UI/Button";
import { useAppDispatch } from "src/hooks/redux.hook";
import messageQueueAction from "src/store/actions/MessageQueueAction";
import BaseRoute from "src/constants/routes/base.route";
import Link from "src/components/UI/Link";
import { useLocation, useNavigate } from "react-router-dom";

const SignInPage: FC<any> = () => {
  const dispatch = useAppDispatch();

  return (
    <>
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.form}>
            <div className={styles.title}>
              <img className={styles.imgLogo} src={NetmanPng} />
              <p>Авторизация</p>
            </div>
            <div className={styles.control}>
              <Input
                label={"Email"}
                title={"Введите email"}
                type={"text"}
              />
              <Input
                label={"Пароль"}
                title={"Введите пароль"}
                type={"password"}
              />
              <Button
                className={styles.btnAuth}
                label={"Авторизация"}
                clickHandler={() => {
                  dispatch(messageQueueAction.addMessage(null, "success", "Нажатие на кнопку!"));
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignInPage;
