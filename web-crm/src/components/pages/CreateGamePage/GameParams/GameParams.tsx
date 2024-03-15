import { FC } from "react";
import styles from "./GameParams.module.scss";
import Input from "src/components/UI/Input";

const GameParams: FC<any> = () => {
    return (
        <>
            <div className={styles.container}>
                <h2>Настройка параметров игры</h2>
                <div className={styles.params}>
                    <div className={styles.column}>
                        <Input
                            label="Название игры"
                        />
                        <Input
                            label="Город"
                        />
                        <Input
                            label="Ограничения"
                        />
                    </div>
                    <div className={styles.column}>
                        <Input
                            label="Дата начала"
                            type="datetime-local"
                            customClass={styles.inputDateTime}
                        />
                        <Input
                            label="Дата завершения"
                            type="datetime-local"
                            customClass={styles.inputDateTime}
                        />
                        <Input
                            label="Рейтинг"
                            type="number"
                        />
                    </div>
                    <div className={styles.column}>
                        <Input
                            label="Число команд"
                            type="number"
                        />
                        <Input
                            label="Мин. число игроков"
                            type="number"
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default GameParams;
