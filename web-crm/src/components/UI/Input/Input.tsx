import { FC, useEffect, useRef, useState } from "react";
import styles from "./Input.module.scss";
import { VOID_NULL, isVoidNull } from "src/types/void_null";
import { InputValueType } from "src/types/input";

export interface IInputProps {
    name?: string;
    label?: string;
    title?: string;
    type?: string;
    defaultValue?: InputValueType;
    changeHandler?: (value?: InputValueType) => void;
    delay?: number
}

const Input: FC<IInputProps> = (props) => {
    const {
        title, label, type = "text",
        defaultValue = '', name, changeHandler,
        delay = 0
    } = props;

    const [value, setValue] = useState<InputValueType>('');
    const timerChange = useRef<NodeJS.Timeout | VOID_NULL>(null);

    useEffect(() => {
        if (!isVoidNull(defaultValue)) {
            setValue(defaultValue);
        }
    }, [defaultValue]);

    // Отложенное обновление верхнеуровневых состояний
    useEffect(() => {
        timerChange.current && clearTimeout(timerChange.current);

        timerChange.current = setTimeout(() => {
            if (!isVoidNull(value)) {
                changeHandler && changeHandler(value);
            }
            timerChange.current && clearTimeout(timerChange.current);
        }, delay);
    }, [value]);

    // Очистка ресурсов
    useEffect(() => {
        return () => {
            timerChange.current && clearTimeout(timerChange.current);
        }
    }, []);

    // Обработка изменения данных в Input
    const inputChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
    };

    return (
        <>
            <div className={styles.container}>
                {label && <span className={styles.label}>{label}</span>}
                <input
                    name={name}
                    className={styles.input}
                    title={title}
                    type={type}
                    value={value}
                    onChange={inputChangeHandler}
                />
            </div>
        </>
    );
};

export default Input;
