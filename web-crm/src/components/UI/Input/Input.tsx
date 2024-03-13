import { FC } from "react";
import styles from "./Input.module.scss";

export interface IInputProps {
    label?: string;
    title?: string;
    type?: string;
}

const Input: FC<IInputProps> = (props) => {
    const { title, label, type = "text" } = props;

    return (
        <>
            <div className={styles.container}>
                {label && <span className={styles.label}>{label}</span>}
                <input
                    className={styles.input}
                    title={title}
                    type={type}
                />
            </div>
        </>
    );
};

export default Input;
