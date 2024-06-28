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
                            required={true}
                        />
                        <Input
                            label="Город"
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default GameParams;
