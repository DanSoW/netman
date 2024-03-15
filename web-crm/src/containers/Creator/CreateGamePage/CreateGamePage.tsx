import { FC } from "react";
import styles from "./CreateGamePage.module.scss";
import GameParams from "src/components/pages/CreateGamePage/GameParams";
import Button from "src/components/UI/Button";
import QuestEditor from "src/components/pages/CreateGamePage/QuestEditor";

const CreateGamePage: FC<any> = () => {
    return (
        <>
            <div className={styles.page}>
                <GameParams />
                <Button
                    label={"Добавить новую метку на карту"}
                    width={300}
                />
                <QuestEditor />
            </div>
        </>
    );
};

export default CreateGamePage;
