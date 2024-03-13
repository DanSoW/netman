import { FC } from "react";
import styles from "./Button.module.scss";
import cn from "classnames";

export interface IButtonProps {
    label?: string;
    className?: string;
    clickHandler?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const Button: FC<IButtonProps> = (props) => {
    const { className, label, clickHandler } = props;

    return (
        <>
            <div className={styles.container}>
                <button
                    className={cn(styles.button, className)}
                    onClick={clickHandler}
                >
                    {label}
                </button>
            </div>
        </>
    );
};

export default Button;
