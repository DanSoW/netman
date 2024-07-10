import React, { FC, useEffect } from "react";
import styles from './Modal.module.scss';
import Button from "../UI/Button";
import Portal from "../Portal";
import IconRouter from "../Icons/Routers/IconRouter";

export interface IModalProps {
    title?: string;
    isOpen: boolean;
    actionHandler: () => void;
    closeHandler: () => void;
    children: React.ReactNode;
    width: number;
    height: number;
}

const Modal: FC<IModalProps> = (props) => {
    const {
        title, isOpen, closeHandler,
        children, width, height,
        actionHandler
    } = props;

    /**
     * Обработка нажатия клавиши Escape
     */
    useEffect(() => {
        const closeOnEscapeKey = e => e.key === "Escape" ? closeHandler() : null;
        document.addEventListener("keydown", closeOnEscapeKey);

        return () => {
            document.removeEventListener("keydown", closeOnEscapeKey);
        };
    }, [closeHandler]);


    if (!isOpen) {
        return null;
    }

    return (
        <Portal>
            <div
                className={styles.container}
            >
                <div className={styles.holder}

                    style={{
                        width: `${width}px`,
                        height: `${height}px`
                    }}
                >
                    <div className={styles.up_controls}>
                        {
                            title && <p className={styles.title}>{title}</p>
                        }

                        <IconRouter.CrossCircleIcon
                            width={30}
                            height={30}
                            clickHandler={closeHandler}
                        />
                    </div>

                    <div className={styles.content}>
                        {children}
                    </div>

                    <div className={styles.down_controls}>
                        <Button
                            label="Закрыть"
                            clickHandler={closeHandler}
                            width={100}
                        />
                        <Button
                            label="Добавить"
                            clickHandler={actionHandler}
                            width={100}
                        />
                    </div>
                </div>
            </div>
        </Portal>
    )
};

export default Modal;