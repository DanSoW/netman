import { FC, useEffect, useState } from "react";
import styles from "./QuestParams.module.css";
import Input from "src/components/UI/Input";
import TextArea from "src/components/UI/TextArea";
import InputRange from "src/components/UI/InputRange";
import Button from "src/components/UI/Button";
import { useAppDispatch } from "src/hooks/redux.hook";
import messageQueueAction from "src/store/actions/MessageQueueAction";
import { InputValueType } from "src/types/input";

export interface IQuestForm {
    hint: string;
    task: string;
    action: string;
    radius: number;
}

const QuestParams: FC<any> = () => {
    const dispatch = useAppDispatch();

    const [form, setForm] = useState<IQuestForm>({
        hint: "",
        task: "",
        action: "",
        radius: 0
    });

    const inputChangeHandler = (type: string) => {
        return (value: InputValueType) => {
            setForm({
                ...form,
                [type]: (type === "radius") ? Number(value) : value
            });
        };
    };

    return (
        <>
            <div className={styles.container}>
                <div className={styles.content}>
                    <Input
                        label="Местоположение"
                        readOnly={true}
                    />
                    <Input
                        name="hint"
                        label="Подсказка"
                        defaultValue={form.hint}
                        changeHandler={inputChangeHandler("hint")}
                    />
                    <TextArea
                        name="task"
                        label="Задача"
                        defaultValue={form.task}
                        changeHandler={inputChangeHandler("task")}
                    />
                    <TextArea
                        name="action"
                        label="Действие"
                        defaultValue={form.action}
                        changeHandler={inputChangeHandler("action")}
                    />
                    <InputRange
                        name="radius"
                        label="Радиус действия"
                        defaultValue={form.radius} 
                        changeHandler={inputChangeHandler("radius")}
                    />
                </div>

                <div className={styles.controls}>
                    <Button
                        label="Очистить"
                        clickHandler={() => {
                            dispatch(messageQueueAction.addMessage(null, "dark", "Форма очищена"));
                        }}
                    />
                    <Button
                        label="Создать"
                    />
                </div>
            </div>
        </>
    );
};

export default QuestParams;
