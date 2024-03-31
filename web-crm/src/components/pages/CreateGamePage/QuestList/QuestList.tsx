import { FC } from "react";
import styles from "./QuestList.module.scss";

const QuestList: FC<any> = () => {
    return (
        <>
            <div className={styles.container}>
                <h2>Созданные квесты</h2>
            </div>
        </>
    );
};

export default QuestList;
